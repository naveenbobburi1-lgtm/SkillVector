import os
import requests
from dotenv import load_dotenv

load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
def clean_llm_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
    return text.strip()

def retrieve_web_context(query: str) -> list[dict]:
    url = "https://api.tavily.com/search"

    payload = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "basic",
        "include_answer": False,
        "max_results": 5
    }

    response = requests.post(url, json=payload, timeout=15)
    response.raise_for_status()
    data = response.json()

    results = []
    for item in data.get("results", []):
        results.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "content": item.get("content", "")
        })

    return results
if __name__ == "__main__":
    test_query = "What is machine learning?"
    contexts = retrieve_web_context(test_query)
    for context in contexts:
        print(f"Title: {context['title']}")
        print(f"URL: {context['url']}")
        print(f"Content: {context['content'][:200]}...\n")