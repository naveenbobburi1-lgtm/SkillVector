import os
import asyncio
import httpx
from dotenv import load_dotenv
import time
load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

SKILL_DOMAINS = [
    "youtube.com", "wikipedia.org", "geeksforgeeks.org",
    "tutorialspoint.com", "w3schools.com", "javatpoint.com",
    "roadmap.sh", "medium.com", "dev.to", "freecodecamp.org",
    "kaggle.com", "towardsdatascience.com",
]

# Domains most likely to host non-English learning content.
# Used instead of SKILL_DOMAINS when the query is language-specific.
LANG_DOMAINS = [
    "youtube.com",   # largest source of non-English tech tutorials
    "udemy.com",     # has courses in many languages
    "medium.com",    # multilingual articles
]

def clean_llm_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        text = text.split("\n", 1)[-1] if "\n" in text else text
    return text.strip()

async def retrieve_web_context(query: str, max_results: int = 5, language: str = "English") -> list[dict]:
    """Fetch relevant web content for a query using Tavily search (async).

    Domain selection logic:
      - Query contains language name + "youtube" → youtube.com only
        (e.g. "Backend Developer YouTube Telugu" → only YouTube results)
      - Query contains language name (non-English) → LANG_DOMAINS
        (YouTube + Udemy + Medium for multilingual content)
      - Default → SKILL_DOMAINS (English learning sites)
    """
    url = "https://api.tavily.com/search"
    q_lower = query.lower()
    lang_lower = language.lower()
    is_non_english = lang_lower not in ("english", "en")
    is_lang_query = is_non_english and lang_lower in q_lower
    is_yt_lang_query = is_lang_query and "youtube" in q_lower

    if is_yt_lang_query:
        domains = ["youtube.com"]           # YouTube-only → max Telugu video results
    elif is_lang_query:
        domains = LANG_DOMAINS              # YT + Udemy + Medium
    else:
        domains = SKILL_DOMAINS             # English learning sites
    payload = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "basic",
        "include_answer": False,
        "max_results": max_results,
        "include_domains": domains,
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
