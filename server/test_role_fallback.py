"""
Test script to demonstrate the O*NET role matching fallback mechanism.
This script tests various roles including those not in O*NET database.
"""

from market.load_onet import load_onet_data
from market.role_matcher import match_role_to_soc
from market.skill_extractor import extract_top_skills, extract_skills_with_llm
import os
from dotenv import load_dotenv

load_dotenv()

def test_role_matching():
    print("=" * 70)
    print("TESTING O*NET ROLE MATCHING WITH FALLBACK MECHANISM")
    print("=" * 70)
    
    # Load O*NET data
    print("\n📊 Loading O*NET database...")
    occupations, skills_df, tech_skills_df, knowledge_df, activities_df = load_onet_data()
    print(f"✅ Loaded {len(occupations)} occupations, {len(tech_skills_df)} technology skill rows")
    
    # Test cases: mix of roles that exist in O*NET and modern roles that don't
    test_roles = [
        "Software Engineer",           # Should match in O*NET
        "Data Scientist",             # Should match in O*NET
        "Product Manager",            # Might not match exactly
        "DevOps Engineer",            # Modern role, might not be in O*NET
        "Growth Hacker",              # Definitely not in O*NET
        "UX Designer",                # Might match to something similar
        "Blockchain Developer",       # Modern role, likely not in O*NET
        "Machine Learning Engineer"   # Modern role
    ]
    
    print("\n" + "=" * 70)
    for role in test_roles:
        print(f"\n🔍 Testing Role: '{role}'")
        print("-" * 70)
        
        # Try to match with O*NET
        match = match_role_to_soc(role, occupations)
        
        if match:
            soc_code, canonical_role = match
            print(f"✅ O*NET MATCH FOUND")
            print(f"   SOC Code: {soc_code}")
            print(f"   Canonical Title: {canonical_role}")
            
            # Get skills from O*NET Technology Skills
            market_skills = extract_top_skills(soc_code, tech_skills_df, top_n=5)
            print(f"   Top Skills (O*NET Tech): {', '.join(market_skills)}")
        else:
            print(f"❌ NO O*NET MATCH - Using LLM Fallback")
            soc_code = "99-9999.00"
            canonical_role = role
            print(f"   SOC Code: {soc_code} (Generic)")
            print(f"   Role: {canonical_role}")
            
            # Get skills from LLM
            print(f"   🤖 Generating skills using AI...")
            market_skills = extract_skills_with_llm(role, top_n=5)
            print(f"   Top Skills (LLM): {', '.join(market_skills)}")
    
    print("\n" + "=" * 70)
    print("✅ TEST COMPLETE - All roles handled gracefully!")
    print("=" * 70)

if __name__ == "__main__":
    test_role_matching()
