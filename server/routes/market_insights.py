from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import UserDB, UserProfile, MarketInsightsCache
from auth import get_current_user
from services.cache_service import get_valid_cache
from config import ONET_CACHE
from market.role_matcher import match_role_to_soc
from market.skill_extractor import extract_top_skills, extract_skills_with_llm
from market.insights_engine import generate_market_insights
from market.live_skills import fetch_live_skills
from datetime import datetime, timezone
import json

router = APIRouter()


@router.get("/market-insights-test")
async def market_insights(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    try:
        if "occupations" not in ONET_CACHE:
            raise HTTPException(status_code=500, detail="O*NET data not loaded")

        occupations_df = ONET_CACHE["occupations"]
        tech_skills_df = ONET_CACHE["tech_skills"]

        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        if not profile:
            raise HTTPException(status_code=400, detail="Profile not found")

        user_role = profile.desired_role
        user_skills_raw = json.loads(profile.skills) if profile.skills else []
        user_skills = [s["name"] if isinstance(s, dict) else s for s in user_skills_raw]

        # Check cache first
        cache = get_valid_cache(current_user.id, user_role, db)
        if cache:
            cached_gap = json.loads(cache.gap_analysis)
            if cached_gap and cached_gap.get("insights"):
                print(f"[Cache HIT] market-insights-test for user {current_user.id}")
                return cached_gap

        # Cache miss — generate fresh data
        print(f"[Cache MISS] market-insights-test for user {current_user.id}")

        # Run O*NET match and Adzuna live fetch concurrently
        import asyncio
        onet_task = asyncio.to_thread(_get_onet_skills, user_role, occupations_df, tech_skills_df)
        live_task  = fetch_live_skills(user_role, top_n=20)
        (soc_code, canonical_role, market_skills), live_skills_data = await asyncio.gather(
            onet_task, live_task
        )

        # Ensure market_skills is not empty
        if not market_skills:
            market_skills = [
                "Communication", "Problem Solving", "Critical Thinking",
                "Teamwork", "Leadership", "Technical Proficiency",
                "Data Analysis", "Project Management"
            ]

        # Merge live skills into market_skills list.
        # Live skills (from real job postings) take priority — prepend them,
        # then append O*NET skills that aren't already represented.
        live_skill_names = [s["skill"] for s in live_skills_data]
        live_lower = {s.lower() for s in live_skill_names}
        merged_market_skills = live_skill_names + [
            s for s in market_skills if s.lower() not in live_lower
        ]

        insights = generate_market_insights(user_skills, merged_market_skills)

        gap_result = {
            "role": canonical_role,
            "soc_code": soc_code,
            "insights": insights,
            "onet_skills": market_skills,          # raw O*NET skills (before merge)
            "live_skills": live_skills_data,        # [{"skill": str, "listing_count": int}]
        }

        # Store in cache (profile_insights will be filled by /profile-insights)
        existing_cache = db.query(MarketInsightsCache).filter(
            MarketInsightsCache.user_id == current_user.id
        ).first()
        if existing_cache:
            existing_cache.role = user_role
            existing_cache.gap_analysis = json.dumps(gap_result)
            existing_cache.created_at = datetime.now(timezone.utc)
        else:
            new_cache = MarketInsightsCache(
                user_id=current_user.id,
                role=user_role,
                gap_analysis=json.dumps(gap_result),
                profile_insights=json.dumps({})  # placeholder until /profile-insights fills it
            )
            db.add(new_cache)
        db.commit()

        return gap_result

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in market insights: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate market insights: {str(e)}")


def _get_onet_skills(user_role: str, occupations_df, tech_skills_df) -> tuple:
    """Synchronous O*NET lookup — runs in a thread via asyncio.to_thread."""
    match = match_role_to_soc(user_role, occupations_df)
    if match:
        soc_code, canonical_role = match
        market_skills = extract_top_skills(soc_code, tech_skills_df)
    else:
        print(f"No O*NET match for '{user_role}', using LLM fallback")
        soc_code = "99-9999.00"
        canonical_role = user_role
        market_skills = extract_skills_with_llm(user_role, top_n=15)
    return soc_code, canonical_role, market_skills
