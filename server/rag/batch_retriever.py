import asyncio
import time
from rag.retriever import retrieve_web_context
from rag.vector_cache import get_embeddings_batch, search_by_embeddings_batch, store_entry

# In-process cache for complete batch context strings.
# Key: (normalized_role, sorted_queries_tuple) — partitioned by role so
# different roles never share cached context even with identical queries.
# On a full cache-hit scenario (same role → same queries every time),
# this skips ALL embedding and DB work after the first call: ~0ms.
_context_cache: dict[tuple, str] = {}
_MAX_CONTEXT_CACHE = 128


async def batch_retrieve(queries: list[str], max_sources: int = 20, language: str = "English", target_role: str = "") -> str:
    """
    Three-layer retrieval:
      L0 - In-memory context cache  (~0ms)
      L1 - pgvector semantic cache  (filter by role + language, similarity >= 0.86)
      L2 - Tavily/YouTube live fetch (only for cache misses)

    Partitioned by (role, language); if >= 8 sources found in L1, return cached.
    """
    t0 = time.time()

    role_key = target_role.strip().lower()
    lang_key = language.strip().lower() or "english"

    # L0: in-memory hit
    cache_key = (role_key, lang_key, tuple(sorted(queries)))
    if cache_key in _context_cache:
        print(f"[batch_retrieve] L0 in-memory HIT in {time.time() - t0:.3f}s")
        return _context_cache[cache_key]

    # Step 1: embed all queries
    t1 = time.time()
    embeddings: list[list[float]] = await asyncio.to_thread(get_embeddings_batch, queries)
    print(f"[batch_retrieve] step1 embed  ({len(queries)} queries): {time.time() - t1:.3f}s")

    # Step 2: vector-DB search filtered by role + language
    t2 = time.time()
    results: list[list[dict] | None] = await asyncio.to_thread(
        search_by_embeddings_batch, embeddings, target_role, language
    )
    cache_hits = sum(1 for r in results if r is not None)
    miss_indices = [i for i, r in enumerate(results) if r is None]
    print(
        f"[batch_retrieve] step2 vector-DB ({cache_hits}/{len(queries)} hits, "
        f"{len(miss_indices)} misses): {time.time() - t2:.3f}s"
    )

    # Step 3: Tavily/YouTube for cache misses
    if miss_indices:
        t3 = time.time()
        fresh_results = await asyncio.gather(
            *[retrieve_web_context(queries[i], language=language) for i in miss_indices],
            return_exceptions=True,
        )
        print(f"[batch_retrieve] step3 Tavily/YT ({len(miss_indices)} calls): {time.time() - t3:.3f}s")

        # Step 4: store all fresh results (including language-specific) with role + language
        store_tasks = []
        for pos, i in enumerate(miss_indices):
            fresh = fresh_results[pos]
            if isinstance(fresh, Exception) or not fresh:
                results[i] = []
            else:
                results[i] = fresh
                store_tasks.append(
                    asyncio.to_thread(
                        store_entry, queries[i], embeddings[i], fresh, target_role, language
                    )
                )
        if store_tasks:
            t4 = time.time()
            await asyncio.gather(*store_tasks, return_exceptions=True)
            print(f"[batch_retrieve] step4 store   ({len(store_tasks)} entries): {time.time() - t4:.3f}s")

    # Step 5: deduplicate and build context string
    seen: set[str] = set()
    collected: list[dict] = []

    for result in results:
        for r in (result or []):
            url = r.get("url", "")
            if url and url not in seen:
                seen.add(url)
                collected.append(r)
            if len(collected) >= max_sources:
                break
        if len(collected) >= max_sources:
            break

    context = ""
    for r in collected:
        context += f"""
Title: {r['title']}
URL: {r['url']}
Content: {r['content']}
"""
    context = context.strip()

    # Store in in-memory cache (evict oldest if at capacity)
    if len(_context_cache) >= _MAX_CONTEXT_CACHE:
        del _context_cache[next(iter(_context_cache))]
    _context_cache[cache_key] = context

    elapsed = time.time() - t0
    print(
        f"[batch_retrieve] DONE {len(collected)} sources in {elapsed:.3f}s "
        f"({cache_hits}/{len(queries)} DB hits, {len(miss_indices)} live fetch)"
    )
    return context


if __name__ == "__main__":
    async def _test():
        queries = [
            "data scientist roadmap",
            "best python libraries for data science",
            "how to learn machine learning",
        ]
        context = await batch_retrieve(queries, max_sources=10)
        print(context[:500])

    asyncio.run(_test())