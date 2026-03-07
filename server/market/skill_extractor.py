def extract_top_skills(soc_code: str, tech_skills_df, top_n=15):
    """
    Extract top technology skills for a given SOC code from O*NET Technology Skills data.
    Prioritises 'Hot Technology' items, then 'In Demand', then alphabetical.
    Returns a deduplicated list of concrete tool / technology names.
    """
    filtered = tech_skills_df[tech_skills_df["O*NET-SOC Code"] == soc_code]

    if filtered.empty:
        # Try partial SOC match (e.g. "15-1252" matches "15-1252.00")
        soc_prefix = soc_code.split(".")[0]
        filtered = tech_skills_df[tech_skills_df["O*NET-SOC Code"].str.startswith(soc_prefix)]

    if filtered.empty:
        return []

    # Sort: Hot Technology first, then In Demand, then alphabetical
    sort_key = filtered.assign(
        _hot=filtered["Hot Technology"].map({"Y": 0, "N": 1}).fillna(1),
        _demand=filtered["In Demand"].map({"Y": 0, "N": 1}).fillna(1),
    )
    sort_key = sort_key.sort_values(["_hot", "_demand", "Example"])

    # Deduplicate by lowercased Example (keep first / highest priority)
    seen = set()
    skills = []
    for name in sort_key["Example"]:
        key = name.strip().lower()
        if key not in seen:
            seen.add(key)
            skills.append(name.strip())
        if len(skills) >= top_n:
            break

    return skills


def extract_top_knowledge(soc_code: str, knowledge_df, top_n=8):
    """Extract top knowledge domains for a SOC code, ranked by importance."""
    filtered = knowledge_df[
        (knowledge_df["O*NET-SOC Code"] == soc_code) &
        (knowledge_df["Scale ID"] == "IM")
    ]
    if filtered.empty:
        soc_prefix = soc_code.split(".")[0]
        filtered = knowledge_df[
            (knowledge_df["O*NET-SOC Code"].str.startswith(soc_prefix)) &
            (knowledge_df["Scale ID"] == "IM")
        ]
    if filtered.empty:
        return []
    filtered = filtered.sort_values("Data Value", ascending=False).drop_duplicates("Element Name").head(top_n)
    return [f"{row['Element Name']} (importance: {row['Data Value']:.1f}/5)" for _, row in filtered.iterrows()]


def extract_top_activities(soc_code: str, activities_df, top_n=8):
    """Extract top work activities for a SOC code, ranked by importance."""
    filtered = activities_df[
        (activities_df["O*NET-SOC Code"] == soc_code) &
        (activities_df["Scale ID"] == "IM")
    ]
    if filtered.empty:
        soc_prefix = soc_code.split(".")[0]
        filtered = activities_df[
            (activities_df["O*NET-SOC Code"].str.startswith(soc_prefix)) &
            (activities_df["Scale ID"] == "IM")
        ]
    if filtered.empty:
        return []
    filtered = filtered.sort_values("Data Value", ascending=False).drop_duplicates("Element Name").head(top_n)
    return [f"{row['Element Name']} (importance: {row['Data Value']:.1f}/5)" for _, row in filtered.iterrows()]


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
    from config import LLM_MODEL
    
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
            model=LLM_MODEL,
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
