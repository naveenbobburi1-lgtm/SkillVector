from difflib import get_close_matches, SequenceMatcher

def match_role_to_soc(user_role: str, occupations_df):
    """
    Match user's desired role to O*NET SOC code using intelligent fuzzy matching.
    Returns: (soc_code, title) tuple if high-quality match found, None otherwise.
    
    Strategy:
    1. Check for known tech role mappings
    2. Try exact/close matches (high confidence)
    3. Try keyword matching with strict validation
    4. If no good match, return None to trigger LLM fallback
    """
    titles = occupations_df["Title"].tolist()
    user_role_lower = user_role.lower()
    
    # Known mappings for common tech roles that don't match well
    tech_role_mappings = {
        'software engineer': 'Software Developers',
        'software developer': 'Software Developers',
        'full stack developer': 'Software Developers',
        'frontend developer': 'Web Developers',
        'front end developer': 'Web Developers',
        'backend developer': 'Software Developers',
        'back end developer': 'Software Developers',
        'web developer': 'Web Developers',
        'machine learning engineer': 'Data Scientists',
        'ml engineer': 'Data Scientists',
        'ai engineer': 'Data Scientists',
        'devops engineer': 'Software Developers',
    }
    
    # Check if we have a known mapping
    if user_role_lower in tech_role_mappings:
        target_title = tech_role_mappings[user_role_lower]
        # Find exact match in O*NET
        found = occupations_df[occupations_df["Title"].str.contains(target_title, case=False, na=False)]
        if not found.empty:
            row = found.iloc[0]
            return row["O*NET-SOC Code"], row["Title"]
    
    # Try high-confidence fuzzy matching (cutoff 0.7)
    match = get_close_matches(user_role, titles, n=1, cutoff=0.7)
    
    if match:
        # High confidence match found
        row = occupations_df[occupations_df["Title"] == match[0]].iloc[0]
        return row["O*NET-SOC Code"], row["Title"]
    
    # Try medium-confidence fuzzy matching (cutoff 0.55) with validation
    match = get_close_matches(user_role, titles, n=1, cutoff=0.55)
    
    if match:
        matched_title = match[0]
        matched_title_lower = matched_title.lower()
        
        # Extract meaningful words (filter out common words)
        common_words = {'and', 'the', 'or', 'of', 'in', 'a', 'to', 'for'}
        user_words = set(w for w in user_role_lower.split() if len(w) > 3 and w not in common_words)
        match_words = set(w for w in matched_title_lower.split() if len(w) > 3 and w not in common_words)
        
        # Check for problematic cross-domain matches
        tech_keywords = {'software', 'data', 'engineer', 'developer', 'programmer', 'analyst', 'scientist', 'devops', 'machine', 'learning'}
        non_tech_keywords = {'food', 'floral', 'sales', 'biofuel', 'manufacturing', 'production'}
        
        user_is_tech = bool(tech_keywords.intersection(user_words))
        match_is_tech = bool(tech_keywords.intersection(match_words))
        match_is_non_tech = bool(non_tech_keywords.intersection(match_words))
        
        # Reject cross-domain matches (tech role matching to non-tech and vice versa)
        if user_is_tech and match_is_non_tech:
            return None
        
        # Calculate meaningful word overlap
        common = user_words.intersection(match_words)
        
        # Require at least 1 significant word match for tech roles, 2 for others
        min_overlap = 1 if user_is_tech else 2
        
        if len(common) >= min_overlap:
            row = occupations_df[occupations_df["Title"] == matched_title].iloc[0]
            return row["O*NET-SOC Code"], row["Title"]
    
    # No good match found - return None to trigger LLM fallback
    return None
