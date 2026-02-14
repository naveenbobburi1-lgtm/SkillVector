def extract_top_skills(soc_code: str, skills_df, top_n=10):
    filtered = skills_df[
        (skills_df["O*NET-SOC Code"] == soc_code) &
        (skills_df["Scale ID"] == "IM")  # Importance
    ]

    filtered = filtered.sort_values("Data Value", ascending=False)

    skills = filtered["Element Name"].head(top_n).tolist()
    
    # If no skills found for this SOC code, return fallback skills
    if not skills:
        skills = [
            "Communication", "Problem Solving", "Critical Thinking",
            "Teamwork", "Leadership", "Technical Proficiency",
            "Data Analysis", "Project Management"
        ][:top_n]
    
    return skills


def extract_skills_with_llm(role_name: str, top_n=10):
    """
    Uses LLM to generate market-required skills for roles not in O*NET.
    Fallback mechanism for modern/non-traditional roles.
    Returns: List of skill names
    """
    from groq import Groq
    import os
    import json
    from rag.retriever import clean_llm_json
    
    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        prompt = f"""
        You are an expert job market analyst. Analyze the role: "{role_name}"
        
        List the top {top_n} most important technical and professional skills required for this role in 2025/2026.
        Focus on:
        - Technical skills (tools, languages, platforms)
        - Professional skills (methodologies, soft skills)
        - Industry-standard requirements
        
        Return ONLY a JSON object with this structure:
        {{
            "skills": ["Skill 1", "Skill 2", "Skill 3", ...]
        }}
        
        Keep skill names concise (1-3 words). Be specific and practical.
        """

        response = client.chat.completions.create(
            model="groq/compound",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        data = json.loads(clean_llm_json(content))
        return data.get("skills", [])[:top_n]
    
    except Exception as e:
        print(f"LLM Skill Extraction Failed: {e}")
        # Fallback to generic skills
        return [
            "Communication",
            "Problem Solving",
            "Critical Thinking",
            "Teamwork",
            "Leadership",
            "Technical Proficiency",
            "Data Analysis",
            "Project Management"
        ][:top_n]
