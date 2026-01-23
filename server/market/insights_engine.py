def generate_market_insights(user_skills, market_skills):
    user_skills_lower = set(s.lower() for s in user_skills)

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
