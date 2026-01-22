import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def generate_search_queries(profile) -> list[str]:
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    prompt = f"""
Generate 8–10 focused web search queries to find learning resources.

Target role: {profile.desired_role}
Existing skills: {profile.skills}

Rules:
- Include YouTube queries
- Include beginner and advanced queries
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
