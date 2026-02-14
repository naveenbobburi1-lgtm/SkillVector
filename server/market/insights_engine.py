def generate_market_insights(user_skills, market_skills):
    user_skills_lower = set(s.lower() for s in user_skills)

    # Handle empty market_skills to avoid division by zero
    if not market_skills or len(market_skills) == 0:
        return {
            "market_required_skills": [],
            "missing_skills": [],
            "skill_coverage_percent": 0
        }

    missing_skills = [
        skill for skill in market_skills
        if skill.lower() not in user_skills_lower
    ]

    coverage = int(
        (len(market_skills) - len(missing_skills)) / len(market_skills) * 100
    )

    return {
        "market_required_skills": market_skills,
        "missing_skills": missing_skills,
        "skill_coverage_percent": coverage
    }

from groq import Groq
import os
import json
from rag.retriever import clean_llm_json

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
            model="groq/compound",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
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
