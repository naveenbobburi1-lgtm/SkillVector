import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def generate_search_queries(profile) -> list[str]:
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    industries = []
    try:
        if profile.preferred_industries:
            industries = json.loads(profile.preferred_industries)
    except Exception:
        pass

    language = getattr(profile, "language", None) or "English"

    prompt = f"""
Generate 8–10 focused web search queries to find learning resources.

Target role: {profile.desired_role}
Existing skills: {profile.skills}
Preferred industries: {', '.join(industries) if industries else 'general'}
Instruction language: {language}

Rules:
- Include YouTube queries
- Include beginner and advanced queries
- Include industry-specific queries (e.g., "{profile.desired_role} in {industries[0] if industries else 'tech'}")
- If instruction language is not English, include 1-2 queries like "{profile.desired_role} tutorials in {language}"
- Return ONLY a JSON array of strings
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )

    raw = response.choices[0].message.content.strip()

    # HARD SAFETY
    try:
        queries = json.loads(raw)
        if not isinstance(queries, list):
            raise ValueError("Queries not list")
        return queries
    except Exception:
        # fallback (system still works)
        return [
            f"{profile.desired_role} learning roadmap",
            f"best YouTube playlists for {profile.desired_role}",
            f"{profile.desired_role} free courses",
            f"{profile.desired_role} beginner to advanced"
        ]
if __name__ == "__main__":
    class Profile:
        desired_role = "Data Scientist"
        skills = "Python, Statistics"

    profile = Profile()
    queries = generate_search_queries(profile)
    for q in queries:
        print(q)    