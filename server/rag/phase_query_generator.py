"""
Phase Query Generator — Stage 2 of the two-stage learning path architecture.

Given learning path phases (with topics/skills), produces two clean arrays
per phase:
  - web_queries:     for Tavily API (articles, books, docs — always English)
  - youtube_queries:  for YouTube API (videos in English + user's language)

Single LLM call for all phases. Every skill gets at least one query.
"""

import os
import json
from groq import Groq
from config import LLM_TEMPERATURE
from dotenv import load_dotenv

load_dotenv()


def _fallback_queries(phase: dict, language: str, role: str) -> dict:
    """Deterministic skill-specific queries when LLM fails."""
    skills = phase.get("skills", [])
    topics = phase.get("topics", [])[:3]

    web = []
    yt = []

    for skill in skills:
        web.append(f"{skill} tutorial for {role}")
        yt.append(f"{skill} tutorial for beginners")

    for topic in topics[:2]:
        web.append(f"{topic} guide for {role}")

    # Add user-language YouTube queries
    lang_lower = language.lower().strip()
    if lang_lower not in ("english", "en"):
        for skill in skills[:3]:
            yt.append(f"{skill} tutorial {language}")

    return {
        "web_queries": web[:6],
        "youtube_queries": yt[:5],
    }


def generate_phase_queries(
    phases: list[dict],
    language: str = "English",
    role: str = "",
) -> dict[int, dict]:
    """Generate search queries for each phase — two arrays per phase.

    Returns:
        {phase_index: {"web_queries": [...], "youtube_queries": [...]}}
    """
    if not phases:
        return {}

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    lang_lower = language.lower().strip()
    is_non_english = lang_lower not in ("english", "en")

    phase_summaries = []
    for i, p in enumerate(phases):
        phase_summaries.append({
            "index": i,
            "name": p.get("phase", f"Phase {i + 1}"),
            "topics": p.get("topics", [])[:6],
            "skills": p.get("skills", [])[:8],
        })

    lang_note = ""
    if is_non_english:
        lang_note = f"""
IMPORTANT for youtube_queries:
- Include BOTH English queries AND {language}-language queries.
- For {language} queries, write them in English but append "{language}" at the end.
  Example: "React JS tutorial {language}", "Python basics for beginners {language}"
- This way the user gets a mix of English AND {language} video tutorials."""

    prompt = f"""You generate search queries to find learning resources for a "{role}" learning path.

Each phase has SKILLS and TOPICS. Generate queries targeting SPECIFIC skills.

Phases:
{json.dumps(phase_summaries, indent=2)}

For EACH phase, return exactly TWO arrays:

1. "web_queries": 4-6 queries for finding articles, tutorials, documentation, books.
   - MUST target specific skills/topics from that phase
   - MUST be in English (technical content is in English)
   - Example: "Microsoft SQL Server administration tutorial", "Linux basics for database administrators", "best books for learning Git"

2. "youtube_queries": 3-5 queries for finding YouTube video tutorials.
   - MUST target specific skills from that phase
   - Example: "Microsoft SQL Server crash course", "Linux command line tutorial for beginners"
{lang_note}

RULES:
- Every skill in a phase must have at least ONE query targeting it
- Queries must be specific (use actual skill/tool names, not generic terms)
- NO duplicate queries across phases
- Return ONLY valid JSON

Output format:
{{
  "0": {{
    "web_queries": ["query1", "query2", ...],
    "youtube_queries": ["query1", "query2", ...]
  }},
  "1": {{ ... }}
}}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=LLM_TEMPERATURE,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            raw = raw.split("\n", 1)[-1] if "\n" in raw else raw
            raw = raw.strip()

        parsed = json.loads(raw)

        result: dict[int, dict] = {}
        for i in range(len(phases)):
            key = str(i)
            if key in parsed and isinstance(parsed[key], dict):
                entry = parsed[key]
                result[i] = {
                    "web_queries": _ensure_list(entry.get("web_queries"), 6),
                    "youtube_queries": _ensure_list(entry.get("youtube_queries"), 5),
                }
            else:
                result[i] = _fallback_queries(phases[i], language, role)

        # Verify: if any phase has no queries, supplement with fallback
        for i, phase in enumerate(phases):
            if i in result:
                wq = result[i]["web_queries"]
                yq = result[i]["youtube_queries"]
                if len(wq) < 2 or len(yq) < 2:
                    fb = _fallback_queries(phase, language, role)
                    if len(wq) < 2:
                        result[i]["web_queries"] = fb["web_queries"]
                    if len(yq) < 2:
                        result[i]["youtube_queries"] = fb["youtube_queries"]

        print(f"[phase_query_gen] Generated queries for {len(result)} phases")
        for i in result:
            wc = len(result[i]["web_queries"])
            yc = len(result[i]["youtube_queries"])
            print(f"  Phase {i}: {wc} web + {yc} youtube queries")
        return result

    except Exception as e:
        print(f"[phase_query_gen] LLM failed: {e} — using fallback")
        return {
            i: _fallback_queries(phases[i], language, role)
            for i in range(len(phases))
        }


def _ensure_list(val, max_n: int = 6) -> list[str]:
    """Ensure val is a list of strings, capped at max_n."""
    if not isinstance(val, list):
        return []
    return [str(v) for v in val if isinstance(v, str)][:max_n]
