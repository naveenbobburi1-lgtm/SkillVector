"""
Real-time skill extraction from Adzuna job listings via LLM.

Flow:
  1. Fetch up to 100 listings (2 pages × 50) for the role from Adzuna
  2. Sample 25 listings → send to Groq LLM → LLM returns every skill
     mentioned across those descriptions (no hardcoded vocabulary)
  3. Count how many of all 100 listings contain each LLM-extracted skill
  4. Noise-filter (≥10% of listings), return top N ranked by listing count

Using an LLM for extraction means:
- Any skill that appears in real postings is discovered automatically
- New frameworks, tools, and methodologies are captured the moment they
  appear in job listings — no list to maintain or update
- Canonical names come from the LLM, not brittle string manipulation

Results cached in-process for 6 hours to conserve API quota.
"""

import os
import re
import json
import time
import asyncio
import httpx
from collections import Counter
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

ADZUNA_APP_ID  = os.getenv("ADZUNA_APP_ID", "")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY", "")
GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "")

ADZUNA_COUNTRY = os.getenv("ADZUNA_COUNTRY", "us")
ADZUNA_BASE    = f"https://api.adzuna.com/v1/api/jobs/{ADZUNA_COUNTRY}/search"

# ── In-process cache: role → (timestamp, skills_list) ──────────────────────
_live_cache: dict[str, tuple[float, list[dict]]] = {}
LIVE_CACHE_TTL = 6 * 3600  # 6 hours

# ── Fetch config ─────────────────────────────────────────────────────────────
RESULTS_PER_PAGE = 50
PAGES_TO_FETCH   = 2   # 2 × 50 = 100 listings total

# ── LLM extraction config ─────────────────────────────────────────────────────
# How many listings to sample for the LLM extraction call.
# 25 descriptions give broad coverage without hitting token limits.
LLM_SAMPLE_SIZE = 25
# Max chars per description passed to LLM (skills appear early; ~400 chars is enough)
DESC_TRUNCATE   = 400


async def _fetch_page(
    client: httpx.AsyncClient, role: str, page: int, broad: bool = False
) -> list[dict]:
    """Fetch one page of Adzuna results. Returns [] on any error."""
    try:
        params = {
            "app_id":           ADZUNA_APP_ID,
            "app_key":          ADZUNA_APP_KEY,
            "results_per_page": RESULTS_PER_PAGE,
            "content-type":     "application/json",
        }
        params["what"] = role if broad else None
        params["what_and"] = None if broad else role
        # Remove None values
        params = {k: v for k, v in params.items() if v is not None}

        resp = await client.get(f"{ADZUNA_BASE}/{page}", params=params)
        resp.raise_for_status()
        return resp.json().get("results", [])
    except Exception as e:
        print(f"[live_skills] page {page} ({'broad' if broad else 'exact'}) error: {e}")
        return []


def _job_text(job: dict) -> str:
    """Concatenate all text fields from a job listing, lowercased."""
    cat = job.get("category", {})
    return " ".join([
        job.get("title", ""),
        job.get("description", ""),
        cat.get("label", "") if isinstance(cat, dict) else "",
    ]).lower()


async def _extract_skills_with_llm(role: str, descriptions: list[str]) -> list[str]:
    """Ask Groq LLM to read a sample of job descriptions and return every
    skill/tool/technology mentioned — no predefined vocabulary needed.

    Returns a deduplicated list of canonical skill name strings.
    """
    sample = descriptions[:LLM_SAMPLE_SIZE]
    combined = "\n\n".join(
        f"[{i + 1}] {text[:DESC_TRUNCATE]}" for i, text in enumerate(sample)
    )

    prompt = f"""Below are {len(sample)} real job postings for the role: "{role}"

{combined}

List every unique technical skill, tool, technology, framework, programming language, cloud platform, database, API, methodology, and certification that appears anywhere in these postings.

Rules:
- Use canonical names: "PostgreSQL" not "postgres", "TypeScript" not "ts", "Kubernetes" not "k8s", "Machine Learning" not "ML"
- Include both common and niche skills — everything that appears in the text
- Do NOT invent skills that are not actually mentioned in the postings above
- Return ONLY a JSON array of strings, nothing else

Example: ["Python", "AWS", "Docker", "React", "PostgreSQL", "Kubernetes", "CI/CD"]"""

    client = Groq(api_key=GROQ_API_KEY)
    response = await asyncio.to_thread(
        client.chat.completions.create,
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )

    raw = response.choices[0].message.content.strip()

    # Extract the JSON array even if the LLM wraps it in extra prose
    match = re.search(r"\[.*?\]", raw, re.DOTALL)
    if match:
        try:
            skills = json.loads(match.group())
            if isinstance(skills, list):
                return [str(s).strip() for s in skills if s and isinstance(s, str)]
        except Exception:
            pass

    print(f"[live_skills] LLM returned unparseable output for '{role}': {raw[:300]}")
    return []


async def fetch_live_skills(role: str, top_n: int = 20) -> list[dict]:
    """Return the top skills demanded across real Adzuna job listings for *role*.

    Each entry: {"skill": "Python", "listing_count": 42}
    listing_count = number of listings (out of all fetched) that mention the skill.

    - LLM reads 25 sampled descriptions to discover skills dynamically
    - Frequency counted against all 100 listings via simple substring match
    - Cached in-process for 6 hours; returns [] on error (never blocks the caller)
    """
    role_key = role.lower().strip()

    if role_key in _live_cache:
        ts, skills = _live_cache[role_key]
        if time.time() - ts < LIVE_CACHE_TTL:
            print(f"[live_skills] cache HIT for '{role}' ({len(skills)} skills)")
            return skills

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Fetch all pages in parallel (exact role match)
            pages = await asyncio.gather(
                *[_fetch_page(client, role, p) for p in range(1, PAGES_TO_FETCH + 1)]
            )
            listings = [job for page in pages for job in page]

            # Fall back to broad search if exact match returns too few listings
            if len(listings) < 10:
                print(f"[live_skills] exact match gave {len(listings)} listings for '{role}', retrying broad")
                broad_pages = await asyncio.gather(
                    *[_fetch_page(client, role, p, broad=True) for p in range(1, PAGES_TO_FETCH + 1)]
                )
                listings = [job for page in broad_pages for job in page]

        if not listings:
            print(f"[live_skills] 0 listings for '{role}'")
            return []

        descriptions = [_job_text(job) for job in listings]

        # ── Step 1: LLM discovers skills from a sample of descriptions ──────
        t0 = time.time()
        extracted = await _extract_skills_with_llm(role, descriptions)
        print(f"[live_skills] LLM extracted {len(extracted)} skills in {time.time() - t0:.2f}s")

        if not extracted:
            return []

        # ── Step 2: Count how many listings contain each extracted skill ─────
        # Simple case-insensitive substring match — fast, no regex needed
        counter: Counter = Counter()
        for text in descriptions:
            seen: set[str] = set()
            for skill in extracted:
                if skill.lower() in text and skill not in seen:
                    counter[skill] += 1
                    seen.add(skill)

        total = len(listings)
        # Noise filter: skill must appear in at least 10% of listings
        min_count = max(2, total // 10)

        skills = [
            {"skill": skill, "listing_count": count}
            for skill, count in counter.most_common(top_n * 2)
            if count >= min_count
        ][:top_n]

        print(
            f"[live_skills] {total} listings → {len(extracted)} LLM skills "
            f"→ {len(skills)} after noise filter (min={min_count})"
        )

        _live_cache[role_key] = (time.time(), skills)
        return skills

    except Exception as e:
        print(f"[live_skills] fatal error for '{role}': {e}")
        return []
