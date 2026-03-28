"""
3-layer resource cache service for learning path YouTube/Tavily results.

  L0 — In-memory dict (bounded, 1-hour TTL, ~0ms)
  L1 — ResourceCache DB table (30-day TTL, ~50-100ms batch query)
  L2 — Live API call (YouTube / Tavily, seconds)

Cross-user, cross-restart persistence via L1. L0 avoids DB round-trips for
repeat queries within the same server process.
"""

import json
import hashlib
import time
from datetime import datetime, timedelta, timezone

from config import RESOURCE_CACHE_TTL_DAYS

# ── L0: In-memory cache ─────────────────────────────────────────────────────
# Bounded dict: cache_key → (timestamp, resources)
_L0_CACHE: dict[str, tuple[float, list[dict]]] = {}
_L0_MAX_SIZE = 256
_L0_TTL_SECONDS = 3600  # 1 hour — short enough to stay fresh, long enough to help


def _l0_get(cache_key: str) -> list[dict] | None:
    """Return cached resources from L0 if present and within TTL, else None."""
    entry = _L0_CACHE.get(cache_key)
    if entry is None:
        return None
    ts, resources = entry
    if time.time() - ts > _L0_TTL_SECONDS:
        del _L0_CACHE[cache_key]
        return None
    return resources


def _l0_put(cache_key: str, resources: list[dict]) -> None:
    """Store resources in L0. Evicts oldest entry if at capacity."""
    if len(_L0_CACHE) >= _L0_MAX_SIZE:
        # Evict oldest entry
        oldest_key = min(_L0_CACHE, key=lambda k: _L0_CACHE[k][0])
        del _L0_CACHE[oldest_key]
    _L0_CACHE[cache_key] = (time.time(), resources)


def _l0_put_batch(entries: dict[str, list[dict]]) -> None:
    """Store multiple entries in L0."""
    for key, resources in entries.items():
        _l0_put(key, resources)


# ── Key builder ──────────────────────────────────────────────────────────────


def _build_cache_key(source_type: str, query: str, language: str) -> str:
    """SHA-256 of '{source_type}:{query}:{language}' (all lowercased)."""
    payload = f"{source_type.lower().strip()}:{query.lower().strip()}:{language.lower().strip()}"
    return hashlib.sha256(payload.encode()).hexdigest()


# ── Batch operations (preferred for learning path pipeline) ──────────────────


def batch_get_cached_resources(
    items: list[tuple[str, str, str]],
) -> dict[str, list[dict] | None]:
    """Look up many (source_type, query, language) tuples.

    L0 (in-memory) is checked first. Only L0 misses query the DB (L1).
    Returns a dict keyed by cache_key → resource list (hit) or None (miss).
    """
    if not items:
        return {}

    keys = {_build_cache_key(st, q, lang): (st, q) for st, q, lang in items}
    result: dict[str, list[dict] | None] = {}
    l1_needed_keys: dict[str, tuple[str, str]] = {}

    # ── L0 pass ──────────────────────────────────────────────────────────
    l0_hits = 0
    for cache_key, (st, q) in keys.items():
        l0_result = _l0_get(cache_key)
        if l0_result is not None:
            result[cache_key] = l0_result
            l0_hits += 1
        else:
            result[cache_key] = None
            l1_needed_keys[cache_key] = (st, q)

    if l0_hits:
        print(f"[ResourceCache] L0 in-memory: {l0_hits} hits")

    if not l1_needed_keys:
        return result

    # ── L1 pass (DB) ─────────────────────────────────────────────────────
    try:
        from db.database import SessionLocal
        from db.models import ResourceCache

        cutoff = datetime.now(timezone.utc) - timedelta(days=RESOURCE_CACHE_TTL_DAYS)
        db = SessionLocal()
        try:
            rows = (
                db.query(ResourceCache)
                .filter(ResourceCache.cache_key.in_(list(l1_needed_keys.keys())))
                .all()
            )

            expired_ids = []
            l0_new_entries: dict[str, list[dict]] = {}

            for row in rows:
                if row.created_at.replace(tzinfo=timezone.utc) >= cutoff:
                    resources = json.loads(row.resources)
                    result[row.cache_key] = resources
                    l0_new_entries[row.cache_key] = resources
                    st, q = l1_needed_keys.get(row.cache_key, ("?", "?"))
                    print(
                        f"[ResourceCache] HIT  {st}:'{q[:50]}' "
                        f"({len(resources)} resources)"
                    )
                else:
                    expired_ids.append(row.id)

            # Promote L1 hits to L0
            if l0_new_entries:
                _l0_put_batch(l0_new_entries)

            # Clean up expired entries
            if expired_ids:
                db.query(ResourceCache).filter(
                    ResourceCache.id.in_(expired_ids)
                ).delete(synchronize_session=False)
                db.commit()

            miss_count = sum(1 for v in result.values() if v is None)
            hit_count = len(result) - miss_count
            if miss_count:
                print(f"[ResourceCache] Batch: {hit_count} hits ({l0_hits} L0 + {hit_count - l0_hits} DB), {miss_count} misses")
            elif l0_hits < len(keys):
                print(f"[ResourceCache] Batch: {hit_count} hits ({l0_hits} L0 + {hit_count - l0_hits} DB), 0 misses")

        finally:
            db.close()
    except Exception as e:
        print(f"[ResourceCache] batch lookup error: {e}")

    return result


def batch_store_cached_resources(
    items: list[tuple[str, str, str, list[dict]]],
) -> None:
    """Store many (source_type, query, language, resources) in ONE DB session.

    Also populates L0 for immediate in-memory availability.
    """
    storable = [(st, q, lang, res) for st, q, lang, res in items if res]
    if not storable:
        return

    # ── L0: populate immediately ─────────────────────────────────────────
    for st, q, lang, resources in storable:
        cache_key = _build_cache_key(st, q, lang)
        _l0_put(cache_key, resources)

    # ── L1: persist to DB ────────────────────────────────────────────────
    try:
        from db.database import SessionLocal
        from db.models import ResourceCache

        db = SessionLocal()
        try:
            keys_to_store = [
                _build_cache_key(st, q, lang) for st, q, lang, _ in storable
            ]
            # Delete existing entries for these keys (upsert)
            db.query(ResourceCache).filter(
                ResourceCache.cache_key.in_(keys_to_store)
            ).delete(synchronize_session=False)

            for st, q, lang, resources in storable:
                cache_key = _build_cache_key(st, q, lang)
                db.add(
                    ResourceCache(
                        cache_key=cache_key,
                        query_text=q,
                        source_type=st,
                        language=lang.lower().strip() or "english",
                        resources=json.dumps(resources),
                    )
                )

            db.commit()
            print(
                f"[ResourceCache] BATCH STORE {len(storable)} entries (L0 + DB)"
            )
        except Exception as e:
            db.rollback()
            print(f"[ResourceCache] batch store error: {e}")
        finally:
            db.close()
    except Exception as e:
        print(f"[ResourceCache] batch store error: {e}")
