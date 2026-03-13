import os
import asyncio
import httpx
import re
from dotenv import load_dotenv

load_dotenv()

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

# Profile language names -> YouTube API relevanceLanguage (ISO 639-1)
# Comprehensive mapping covering Indian, European, Asian, and other major languages
LANG_TO_ISO = {
    # Indian languages
    "telugu": "te",
    "hindi": "hi",
    "tamil": "ta",
    "kannada": "kn",
    "bengali": "bn",
    "marathi": "mr",
    "gujarati": "gu",
    "malayalam": "ml",
    "punjabi": "pa",
    "odia": "or",
    "urdu": "ur",
    "assamese": "as",
    # European languages
    "spanish": "es",
    "french": "fr",
    "german": "de",
    "portuguese": "pt",
    "italian": "it",
    "dutch": "nl",
    "russian": "ru",
    "polish": "pl",
    "turkish": "tr",
    "greek": "el",
    "swedish": "sv",
    "norwegian": "no",
    "danish": "da",
    "finnish": "fi",
    "czech": "cs",
    "romanian": "ro",
    "hungarian": "hu",
    "ukrainian": "uk",
    # Asian languages
    "japanese": "ja",
    "korean": "ko",
    "chinese": "zh",
    "mandarin": "zh",
    "thai": "th",
    "vietnamese": "vi",
    "indonesian": "id",
    "malay": "ms",
    "filipino": "tl",
    "tagalog": "tl",
    # Middle Eastern
    "arabic": "ar",
    "persian": "fa",
    "farsi": "fa",
    "hebrew": "he",
    # African
    "swahili": "sw",
    "amharic": "am",
}

SKILL_DOMAINS = [
    "geeksforgeeks.org", "tutorialspoint.com", "w3schools.com",
    "javatpoint.com", "roadmap.sh", "medium.com", "dev.to",
    "freecodecamp.org", "kaggle.com", "towardsdatascience.com",
    "learn.microsoft.com", "developer.mozilla.org", "docs.oracle.com",
    "realpython.com", "digitalocean.com", "baeldung.com",
    "coursera.org", "udemy.com",
]

# Domains most likely to host non-English learning content.
LANG_DOMAINS = [
    "youtube.com",
    "udemy.com",
    "medium.com",
]


async def retrieve_youtube_videos(query: str, max_results: int = 5, language: str = "English") -> list[dict]:
    """Fetch YouTube videos via Data API v3, excluding Shorts via videoDuration filter.

    Uses videoDuration=medium (4–20 min) and videoDuration=long (>20 min) to ensure
    only substantial tutorial/course videos are returned — never Shorts.

    Returns list of {title, url, content} matching the Tavily result format.
    """
    api_key = YOUTUBE_API_KEY
    if not api_key:
        return []

    # Strip "youtube" and language name for a cleaner topic-focused query
    q_clean = re.sub(r"\byoutube\b", "", query, flags=re.IGNORECASE).strip()
    lang_lower = language.lower().strip()
    q_clean = re.sub(re.escape(lang_lower), "", q_clean, flags=re.IGNORECASE).strip()
    q_clean = re.sub(r"\s+", " ", q_clean) or query

    lang_code = LANG_TO_ISO.get(lang_lower, "en")
    url = "https://www.googleapis.com/youtube/v3/search"

    # Split quota: fetch medium-length AND long videos, merge results
    half = max(1, max_results // 2)
    remainder = max_results - half

    base_params = {
        "part": "snippet",
        "type": "video",
        "q": q_clean,
        "relevanceLanguage": lang_code,
        "key": api_key,
    }

    async def _fetch_duration(duration: str, n: int) -> list[dict]:
        params = {**base_params, "videoDuration": duration, "maxResults": min(n, 25)}
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json().get("items", [])
        except Exception:
            return []

    # Fetch medium (4–20 min) and long (>20 min) concurrently
    medium_items, long_items = await asyncio.gather(
        _fetch_duration("medium", half + 2),
        _fetch_duration("long", remainder + 2),
    )

    results = []
    seen_ids: set[str] = set()
    for item in medium_items + long_items:
        kind = (item.get("id") or {}).get("kind", "")
        if kind != "youtube#video":
            continue
        video_id = (item.get("id") or {}).get("videoId", "")
        if not video_id or video_id in seen_ids:
            continue
        seen_ids.add(video_id)
        snippet = item.get("snippet") or {}
        title = snippet.get("title", "")
        desc = snippet.get("description", "")
        results.append({
            "title": title,
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "content": desc or title,
        })
        if len(results) >= max_results:
            break
    return results


async def retrieve_youtube_playlists(query: str, max_results: int = 2, language: str = "English") -> list[dict]:
    """Fetch YouTube playlists via Data API v3 with relevanceLanguage.

    Returns list of {title, url, content} for curated playlists on the topic.
    """
    api_key = YOUTUBE_API_KEY
    if not api_key:
        return []

    q_clean = re.sub(r"\byoutube\b", "", query, flags=re.IGNORECASE).strip()
    lang_lower = language.lower().strip()
    q_clean = re.sub(re.escape(lang_lower), "", q_clean, flags=re.IGNORECASE).strip()
    q_clean = re.sub(r"\s+", " ", q_clean) or query
    # Bias toward tutorial/course playlists
    q_clean = f"{q_clean} tutorial playlist"

    lang_code = LANG_TO_ISO.get(lang_lower, "en")
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "type": "playlist",
        "q": q_clean,
        "relevanceLanguage": lang_code,
        "maxResults": min(max_results, 10),
        "key": api_key,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
    except Exception:
        return []

    results = []
    for item in data.get("items", []):
        kind = (item.get("id") or {}).get("kind", "")
        if kind != "youtube#playlist":
            continue
        playlist_id = (item.get("id") or {}).get("playlistId", "")
        if not playlist_id:
            continue
        snippet = item.get("snippet") or {}
        title = snippet.get("title", "")
        desc = snippet.get("description", "")
        results.append({
            "title": title,
            "url": f"https://www.youtube.com/playlist?list={playlist_id}",
            "content": desc or title,
        })
    return results


async def retrieve_videos(query: str, language: str = "English", max_results: int = 3) -> list[dict]:
    """Dedicated video + playlist retrieval with proper language routing.

    Fetches both individual videos (excluding Shorts) and curated playlists,
    returning a mixed list for richer phase resources.

    Returns list of {type, title, platform, link} formatted for direct phase injection.
    """
    if not YOUTUBE_API_KEY:
        return []

    lang_lower = language.lower().strip()
    is_non_english = lang_lower not in ("english", "en")

    # Append language name for non-English to help YouTube's text search
    search_query = f"{query} {language}" if is_non_english else query

    # Fetch videos and playlists concurrently
    video_count = max(1, max_results - 1)  # Reserve 1 slot for playlist
    playlist_count = max(1, max_results // 2)

    raw_videos, raw_playlists = await asyncio.gather(
        retrieve_youtube_videos(search_query, max_results=video_count, language=language),
        retrieve_youtube_playlists(search_query, max_results=playlist_count, language=language),
    )

    results = []
    # Add playlists first (more comprehensive learning resource)
    for r in raw_playlists[:2]:
        results.append({
            "type": "Playlist",
            "title": r["title"],
            "platform": "YouTube",
            "link": r["url"],
        })
    # Then individual videos
    for r in raw_videos:
        results.append({
            "type": "Video",
            "title": r["title"],
            "platform": "YouTube",
            "link": r["url"],
        })
    return results


async def retrieve_articles(query: str, max_results: int = 3) -> list[dict]:
    """Fetch articles/blogs via Tavily, formatted for direct phase injection.

    Returns list of {type, title, platform, link}.
    """
    if not TAVILY_API_KEY:
        return []

    payload = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "basic",
        "include_answer": False,
        "max_results": max_results,
        "include_domains": SKILL_DOMAINS,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post("https://api.tavily.com/search", json=payload)
            response.raise_for_status()
            data = response.json()
    except Exception:
        return []

    results = []
    for item in data.get("results", []):
        url = item.get("url", "")
        title = item.get("title", "")
        if not url or not title:
            continue
        # Classify as Book if it looks like a book listing
        is_book = any(
            kw in url.lower() or kw in title.lower()
            for kw in ("amazon.", "goodreads.", "book", "oreilly.", "manning.", "packt.")
        )
        results.append({
            "type": "Book" if is_book else "Article",
            "title": title,
            "platform": _extract_platform(url),
            "link": url,
        })
    return results


def _extract_platform(url: str) -> str:
    """Extract a human-readable platform name from a URL."""
    try:
        from urllib.parse import urlparse
        domain = urlparse(url).netloc.replace("www.", "")
        # Map known domains to friendly names
        platform_map = {
            "medium.com": "Medium",
            "dev.to": "Dev.to",
            "freecodecamp.org": "freeCodeCamp",
            "geeksforgeeks.org": "GeeksforGeeks",
            "tutorialspoint.com": "TutorialsPoint",
            "w3schools.com": "W3Schools",
            "roadmap.sh": "roadmap.sh",
            "kaggle.com": "Kaggle",
            "towardsdatascience.com": "Towards Data Science",
            "wikipedia.org": "Wikipedia",
            "amazon.com": "Amazon",
            "goodreads.com": "Goodreads",
        }
        return platform_map.get(domain, domain.split(".")[0].capitalize())
    except Exception:
        return "Web"


def clean_llm_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        text = text.split("\n", 1)[-1] if "\n" in text else text
    return text.strip()


async def retrieve_web_context(query: str, max_results: int = 5, language: str = "English") -> list[dict]:
    """Fetch relevant web content using Tavily or YouTube Data API.

    - Query contains language name + "youtube" → YouTube API (relevanceLanguage)
    - Query contains language name (non-English) → Tavily with LANG_DOMAINS
    - Default → Tavily with SKILL_DOMAINS
    """
    q_lower = query.lower()
    lang_lower = language.lower()
    is_non_english = lang_lower not in ("english", "en")
    is_lang_query = is_non_english and lang_lower in q_lower
    is_yt_lang_query = is_lang_query and "youtube" in q_lower

    if is_yt_lang_query and YOUTUBE_API_KEY:
        return await retrieve_youtube_videos(query, max_results=max_results, language=language)

    domains = LANG_DOMAINS if is_lang_query else SKILL_DOMAINS
    payload = {
        "api_key": TAVILY_API_KEY,
        "query": query,
        "search_depth": "basic",
        "include_answer": False,
        "max_results": max_results,
        "include_domains": domains,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post("https://api.tavily.com/search", json=payload)
        response.raise_for_status()
        data = response.json()

    return [
        {"title": item.get("title", ""), "url": item.get("url", ""), "content": item.get("content", "")}
        for item in data.get("results", [])
    ]

if __name__ == "__main__":
    async def _test():
        contexts = await retrieve_web_context("data scientist roadmap")
        for ctx in contexts:
            print(f"Title: {ctx['title']}")
            print(f"URL:   {ctx['url']}")
            print(f"       {ctx['content'][:200]}\n")

    asyncio.run(_test())
