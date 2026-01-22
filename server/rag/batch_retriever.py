from rag.retriever import retrieve_web_context

def batch_retrieve(queries: list[str], max_sources: int = 20) -> str:
    seen = set()
    collected = []

    for q in queries:
        results = retrieve_web_context(q)

        for r in results:
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

    return context.strip()
