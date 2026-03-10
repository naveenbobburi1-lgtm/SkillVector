import asyncio
from rag.retriever import retrieve_web_context
import time
async def batch_retrieve(queries: list[str], max_sources: int = 20) -> str:
    """Fire all search queries concurrently and deduplicate results."""
    start_time = time.time()
    # Run all queries in parallel instead of sequentially
    all_results: list[list[dict]] = await asyncio.gather(
        *[retrieve_web_context(q) for q in queries],
        return_exceptions=True,
    )

    seen: set[str] = set()
    collected: list[dict] = []

    for result in all_results:
        if isinstance(result, Exception):
            continue
        for r in result:
            if r["url"] and r["url"] not in seen:
                seen.add(r["url"])
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
    end_time = time.time()
    print(f"Batch retrieved {len(collected)} sources in {end_time - start_time:.2f} seconds")
    return context.strip()

if __name__ == "__main__":
    queries = [
        "data scientist roadmap",
        "best python libraries for data science",
        "how to learn machine learning",
    ]
    start_time = time.time()
    context = asyncio.run(batch_retrieve(queries, max_sources=10))
    end_time = time.time()
    print(f"Retrieved context in {end_time - start_time:.2f} seconds:\n")