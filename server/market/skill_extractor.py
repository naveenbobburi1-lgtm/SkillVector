def extract_top_skills(soc_code: str, skills_df, top_n=10):
    filtered = skills_df[
        (skills_df["O*NET-SOC Code"] == soc_code) &
        (skills_df["Scale ID"] == "IM")  # Importance
    ]

    filtered = filtered.sort_values("Data Value", ascending=False)

    skills = filtered["Element Name"].head(top_n).tolist()
    return skills
