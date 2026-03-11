"""
Vector cache for RAG web sources using pgvector + Mistral embeddings.

Flow per query in batch_retrieve:
  1. Embed the query via Mistral `mistral-embed` (1024-dim)
  2. Cosine-search rag_source_cache for similar past queries (threshold >= 0.90)
  3. If >= 3 unique source URLs found → return cached sources (no Tavily call)
  4. Else → caller fetches via Tavily, then calls store_entry() to persist
"""

import os
import json
from datetime import datetime, timedelta, timezone
from mistralai import Mistral
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────
SIMILARITY_THRESHOLD = 0.90         # cosine similarity floor for a cache hit
MIN_SOURCES_FOR_HIT = 3             # minimum unique URLs needed to skip Tavily
SOURCE_CACHE_TTL_DAYS = 30          # discard entries older than this
QUERY_PLAN_TTL_DAYS = 30            # same TTL for query-plan cache (query_planner.py uses this)

# ── Mistral client (lazy singleton) ──────────────────────────────────────────
_mistral_client: Mistral | None = None


def _client() -> Mistral:
    global _mistral_client
    if _mistral_client is None:
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            raise RuntimeError("MISTRAL_API_KEY is not set in environment")
        _mistral_client = Mistral(api_key=api_key)
    return _mistral_client

def _get_db():
    """Create a fresh isolated session owned by the cache module."""
    from db.database import SessionLocal
    return SessionLocal()

# ── Public helpers ────────────────────────────────────────────────────────────

# In-process embedding cache: query string → 1024-dim vector.
# Plain dict (not @lru_cache) so get_embeddings_batch can inspect membership
# before deciding which texts to batch-send to Mistral.
_embedding_cache: dict[str, list[float]] = {}


def get_embedding(text_str: str) -> list[float]:
    """Return the Mistral embedding for text_str, cached in _embedding_cache.
    Blocking/sync — wrap in asyncio.to_thread() from async code.
    """
    if text_str not in _embedding_cache:
        resp = _client().embeddings.create(model="mistral-embed", inputs=[text_str])
        _embedding_cache[text_str] = resp.data[0].embedding
    return _embedding_cache[text_str]


def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Embed *all* texts in ONE Mistral API call (only for cache misses).

    Texts already in _embedding_cache are returned instantly.
    New texts are sent to Mistral in a single batched request, then cached.
    Blocking/sync — call via asyncio.to_thread() from async code.
    """
    miss_indices = [i for i, t in enumerate(texts) if t not in _embedding_cache]
    if miss_indices:
        miss_texts = [texts[i] for i in miss_indices]
        resp = _client().embeddings.create(model="mistral-embed", inputs=miss_texts)
        for pos, i in enumerate(miss_indices):
            _embedding_cache[texts[i]] = resp.data[pos].embedding
    return [_embedding_cache[t] for t in texts]


def _vec_literal(embedding: list[float]) -> str:
    """Format a float list as a pgvector literal string: '[v1,v2,...]'"""
    return "[" + ",".join(f"{v:.8f}" for v in embedding) + "]"


def search_by_embedding(embedding: list[float], target_role: str = "") -> list[dict] | None:
    """Search rag_source_cache for sources stored under semantically similar queries.

    Filters by target_role so that e.g. "Frontend Developer" queries never
    return cached "Backend Developer" sources even if embeddings are similar.

    Returns a merged, deduplicated list of source dicts if >= MIN_SOURCES_FOR_HIT
    unique URLs are found within TTL, otherwise returns None (cache miss).
    Uses its own isolated DB session — failures never affect the caller.
    """
    db = _get_db()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=SOURCE_CACHE_TTL_DAYS)
        vec_str = _vec_literal(embedding)

        # vec_str is safe to interpolate: _vec_literal() only produces digits,
        # commas and brackets — no user input can reach this.
        rows = db.execute(
            text(f"""
                SELECT sources
                FROM rag_source_cache
                WHERE target_role = :role
                  AND created_at >= :cutoff
                  AND 1 - (query_embedding <=> '{vec_str}'::vector) >= :threshold
                ORDER BY query_embedding <=> '{vec_str}'::vector
                LIMIT 10
            """),
            {
                "role": target_role,
                "threshold": SIMILARITY_THRESHOLD,
                "cutoff": cutoff,
            },
        ).fetchall()

        if not rows:
            return None

        seen_urls: set[str] = set()
        merged: list[dict] = []
        for (sources_json,) in rows:
            for src in json.loads(sources_json):
                url = src.get("url", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    merged.append(src)

        return merged if len(merged) >= MIN_SOURCES_FOR_HIT else None

    except Exception as e:
        print(f"[vector_cache] search error: {e}")
        return None
    finally:
        db.close()


def search_by_embeddings_batch(embeddings: list[list[float]], target_role: str = "") -> list[list[dict] | None]:
    """Search all N embeddings in ONE DB round-trip using UNION ALL.

    Filters by target_role so different roles never share cached sources.
    Replaces N separate search_by_embedding() calls with a single query that
    invokes the HNSW index independently for each subquery. Cuts remote DB
    round-trips from N to 1, which is the dominant latency on a full cache hit.

    Returns list[N]: each element is a list of source dicts (hit) or None (miss).
    """
    if not embeddings:
        return []
    db = _get_db()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=SOURCE_CACHE_TTL_DAYS)
        # Build UNION ALL: one subquery per embedding, each returns ≤10 rows.
        # vec_str values are safe to interpolate — _vec_literal() only emits
        # digits, '.', commas and brackets; no user input ever reaches here.
        parts = []
        for idx, emb in enumerate(embeddings):
            vec = _vec_literal(emb)
            parts.append(
                f"(SELECT {idx} AS idx, sources "
                f"FROM rag_source_cache "
                f"WHERE target_role = :role "
                f"  AND created_at >= :cutoff "
                f"  AND 1 - (query_embedding <=> '{vec}'::vector) >= :threshold "
                f"ORDER BY query_embedding <=> '{vec}'::vector "
                f"LIMIT 10)"
            )

        rows = db.execute(
            text("\nUNION ALL\n".join(parts)),
            {"role": target_role, "cutoff": cutoff, "threshold": SIMILARITY_THRESHOLD},
        ).fetchall()

        # Group by idx, dedup URLs within each group
        grouped: dict[int, list[dict]] = {i: [] for i in range(len(embeddings))}
        seen_per_idx: dict[int, set[str]] = {i: set() for i in range(len(embeddings))}
        for (idx, sources_json) in rows:
            for src in json.loads(sources_json):
                url = src.get("url", "")
                if url and url not in seen_per_idx[idx]:
                    seen_per_idx[idx].add(url)
                    grouped[idx].append(src)

        return [
            grouped[i] if len(grouped[i]) >= MIN_SOURCES_FOR_HIT else None
            for i in range(len(embeddings))
        ]

    except Exception as e:
        print(f"[vector_cache] batch search error: {e}")
        return [None] * len(embeddings)
    finally:
        db.close()


def store_entry(query: str, embedding: list[float], sources: list[dict], target_role: str = "") -> None:
    """Persist a query, its embedding, role, and the fetched sources to rag_source_cache.
    Uses its own isolated DB session so a failure never affects the caller's session.
    """
    if not sources:
        return
    db = _get_db()
    try:
        vec_str = _vec_literal(embedding)
        # vec_str is safe to interpolate: only digits, commas and brackets.
        db.execute(
            text(f"""
                INSERT INTO rag_source_cache (query_text, query_embedding, sources, target_role, created_at)
                VALUES (:query, '{vec_str}'::vector, :sources, :role, NOW())
            """),
            {
                "query": query,
                "sources": json.dumps(sources),
                "role": target_role,
            },
        )
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[vector_cache] store error: {e}")
    finally:
        db.close()
