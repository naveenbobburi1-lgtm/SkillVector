from difflib import get_close_matches

def match_role_to_soc(user_role: str, occupations_df):
    titles = occupations_df["Title"].tolist()
    match = get_close_matches(user_role, titles, n=1, cutoff=0.4)

    if not match:
        return None

    row = occupations_df[occupations_df["Title"] == match[0]].iloc[0]
    return row["O*NET-SOC Code"], row["Title"]
