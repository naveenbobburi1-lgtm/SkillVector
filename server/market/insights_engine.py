def _normalise(s: str) -> str:
    """Lowercase, strip, collapse whitespace."""
    return " ".join(s.lower().split())


def _user_covers_skill(user_tokens: set, market_skill: str) -> bool:
    """
    Check whether the user already possesses *market_skill*.
    Uses simple case-insensitive matching — works because both sides now
    contain concrete technology names (e.g. "Python", "Microsoft Excel").
    """
    ms = _normalise(market_skill)

    # 1. Exact token match
    if ms in user_tokens:
        return True

    # 2. Substring containment (either direction)
    for ut in user_tokens:
        if ms in ut or ut in ms:
            return True

    return False


def generate_market_insights(user_skills: list, market_skills: list) -> dict:
    """Compare user skills against market-required technology skills."""
    user_tokens = set(_normalise(s) for s in user_skills)

    if not market_skills:
        return {
            "market_required_skills": [],
            "missing_skills": [],
            "skill_coverage_percent": 0,
        }

    missing = [
        skill for skill in market_skills
        if not _user_covers_skill(user_tokens, skill)
    ]

    coverage = int((len(market_skills) - len(missing)) / len(market_skills) * 100)

    return {
        "market_required_skills": market_skills,
        "missing_skills": missing,
        "skill_coverage_percent": coverage,
    }

from groq import Groq
import os
import json
from rag.retriever import clean_llm_json
from config import LLM_MODEL, LLM_TEMPERATURE

def analyze_role_outlook(role_name: str):
    """
    Uses LLM to generate real-time market outlook scores for a given role.
    Returns: { "salary": int, "demand": int, "growth": int, "summary": str, "trending_skills": [] }
    """
    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        prompt = f"""
        Analyze the current job market (2025/2026 outlook) for the role: "{role_name}".
        
        Provide:
        1. salary_score (0-100): 100 = Top tier tech salaries ($200k+), 50 = Average median.
        2. demand_score (0-100): 100 = Extremely high demand / labor shortage.
        3. growth_score (0-100): 100 = Explosive future growth (AI, Green Tech).
        4. trending_skills: List of 5 bleeding-edge skills/tech emerging for this role.
        5. summary: A 1-sentence market pulse check.

        Return ONLY JSON:
        {{
            "salary": number,
            "demand": number,
            "growth": number,
            "trending_skills": [string],
            "summary": string
        }}
        """

        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=LLM_TEMPERATURE,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        return json.loads(clean_llm_json(content))
    
    except Exception as e:
        print(f"LLM Market Analysis Failed: {e}")
        # Fallback to decent defaults if LLM fails
        return {
            "salary": 75,
            "demand": 75,
            "growth": 75,
            "trending_skills": [],
            "summary": "Market data currently unavailable."
        }
