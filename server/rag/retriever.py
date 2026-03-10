import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

SKILL_DOMAINS = [
    "youtube.com", "wikipedia.org", "geeksforgeeks.org",
    "tutorialspoint.com", "w3schools.com", "javatpoint.com",
    "roadmap.sh", "medium.com", "dev.to", "freecodecamp.org",
    "kaggle.com", "towardsdatascience.com",
]

def clean_llm_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        text = text.split("\n", 1)[-1] if "\n" in text else text
    return text.strip()

async def retrieve_web_context(query: str, max_results: int = 5) -> list[dict]:
    """Fetch relevant web content for a query using Tavily search (async)."""
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "basic",
        "include_answer": False,
        "max_results": max_results,
        "include_domains": SKILL_DOMAINS,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()

    results = []
    for item in data.get("results", []):
        results.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "content": item.get("content", ""),
        })
    return results

if __name__ == "__main__":
    async def _test():
        contexts = await retrieve_web_context("data scientist roadmap")
        for ctx in contexts:
            print(f"Title: {ctx['title']}")
            print(f"URL:   {ctx['url']}")
            print(f"       {ctx['content'][:200]}\n")

    asyncio.run(_test())
