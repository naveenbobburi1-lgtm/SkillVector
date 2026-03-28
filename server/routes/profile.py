from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import UserDB, UserProfile, MarketInsightsCache
from auth import get_current_user
import schemas.UserSchemas as schemas
import schemas.ProfileSchemas as profile_schemas
from services.cache_service import invalidate_learning_path, invalidate_market_insights_cache
from config import ONET_CACHE
from market.load_onet import load_onet_data
from market.skill_extractor import extract_top_skills, extract_skills_with_llm
import market.role_matcher as role_matcher
import market.insights_engine as insights_engine
from services.exa_market_service import fetch_realtime_market_data
import json
import re as _re

router = APIRouter()

# ── Suggestion / autocomplete endpoints (public O*NET data) ──────────

@router.get("/suggestions/skills")
async def suggest_skills(q: str = Query("", min_length=1, max_length=100)):
    """Return up to 15 skill names from O*NET Technology Skills matching the query."""
    tech_skills_df = ONET_CACHE.get("tech_skills")
    if tech_skills_df is None:
        return []

    query_lower = _re.escape(q.lower())
    col = "Example"  # column holding the tool/technology name
    matches = tech_skills_df[tech_skills_df[col].str.lower().str.contains(query_lower, na=False)]

    # Deduplicate and sort: prioritise Hot Technology, then In Demand, then alpha
    matches = matches.drop_duplicates(subset=[col])
    matches = matches.sort_values(
        by=["Hot Technology", "In Demand", col],
        ascending=[False, False, True],
    )
    return matches[col].head(15).tolist()


@router.get("/suggestions/roles")
async def suggest_roles(q: str = Query("", min_length=1, max_length=100)):
    """Return up to 15 occupation titles from O*NET matching the query."""
    occupations_df = ONET_CACHE.get("occupations")
    if occupations_df is None:
        return []

    query_lower = _re.escape(q.lower())
    col = "Title"
    matches = occupations_df[occupations_df[col].str.lower().str.contains(query_lower, na=False)]
    return matches[col].head(15).tolist()


@router.get("/user-profile")
async def user_profile(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    if not profile:
        return {
            "username": current_user.username,
            "email": current_user.email,
            "is_complete": False
        }

    return {
        "username": current_user.username,
        "email": current_user.email,
        "is_complete": True,
        "id": profile.id,
        "skills": [{"name": s, "proficiency": "beginner"} if isinstance(s, str) else s for s in (json.loads(profile.skills) if profile.skills else [])],
        "desired_role": profile.desired_role,
        "preferred_industries": json.loads(profile.preferred_industries) if profile.preferred_industries else [],
        "language": profile.language,
        "learning_pace": profile.learning_pace,
        "hours_per_week": profile.hours_per_week,
        "budget_sensitivity": profile.budget_sensitivity,
        "timeline": profile.timeline
    }


@router.get("/profile/analysis")
async def profile_analysis(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        if not profile or not profile.desired_role:
            return {"status": "incomplete", "message": "Profile or Target Role missing"}

        # Load Data
        if "occupations" not in ONET_CACHE:
             occupations, skills_df, tech_skills_df, knowledge_df, activities_df = load_onet_data()
             ONET_CACHE["occupations"] = occupations
             ONET_CACHE["skills"] = skills_df
             ONET_CACHE["tech_skills"] = tech_skills_df
             ONET_CACHE["knowledge"] = knowledge_df
             ONET_CACHE["activities"] = activities_df
        else:
             occupations = ONET_CACHE["occupations"]
             tech_skills_df = ONET_CACHE["tech_skills"]

        # 1. Match Role to SOC
        match = role_matcher.match_role_to_soc(profile.desired_role, occupations)

        if match:
            soc_code, soc_title = match
            # 2. Get Market Skills from Technology Skills data
            top_market_skills = extract_top_skills(soc_code, tech_skills_df, top_n=20)
        else:
            print(f"No O*NET match for '{profile.desired_role}' in profile analysis, using LLM fallback")
            soc_code = "99-9999.00"
            soc_title = profile.desired_role
            top_market_skills = extract_skills_with_llm(profile.desired_role, top_n=20)

        # Ensure market_skills is not empty
        if not top_market_skills:
            top_market_skills = [
                "Communication", "Problem Solving", "Critical Thinking",
                "Teamwork", "Leadership", "Technical Proficiency",
                "Data Analysis", "Project Management"
            ]

        # 3. Analyze Gap
        user_skills_raw = json.loads(profile.skills) if profile.skills else []
        user_skills = [s["name"] if isinstance(s, dict) else s for s in user_skills_raw]
        insights = insights_engine.generate_market_insights(user_skills, top_market_skills)
        coverage = insights["skill_coverage_percent"]

        # 4. LLM Market Analysis (with fallback)
        try:
            market_outlook = insights_engine.analyze_role_outlook(profile.desired_role)
        except Exception as llm_err:
            print(f"LLM market outlook failed: {llm_err}")
            market_outlook = {
                "salary": 75,
                "demand": 75,
                "growth": 75,
                "trending_skills": [],
                "summary": "Market analysis currently unavailable"
            }

        # 5. Calculate Scores
        north_star_score = min(int(coverage * 1.2) + 20, 100)

        # Dynamic Radar Dimensions from LLM
        salary_match = market_outlook.get("salary", 75)
        demand_match = market_outlook.get("demand", 75)
        future_growth = market_outlook.get("growth", 75)
        skill_match = coverage

        # Combine O*NET skills with LLM Trending Skills
        combined_missing = insights["missing_skills"]
        if market_outlook.get("trending_skills"):
             # Add top 3 trending skills to suggestions if not present
             for trend in market_outlook["trending_skills"][:3]:
                 if trend.lower() not in [s.lower() for s in user_skills] and trend not in combined_missing:
                     combined_missing.insert(0, trend + " (Trending)")

        return {
            "status": "success",
            "soc_code": soc_code,
            "soc_title": soc_title,
            "north_star": {
                "score": north_star_score,
                "velocity": profile.learning_pace or "Moderate",
                "market_summary": market_outlook.get("summary", "")
            },
            "radar": {
                "salary": salary_match,
                "demand": demand_match,
                "skill": skill_match,
                "growth": future_growth
            },
            "gap_analysis": {
                "missing_skills": combined_missing,
                "market_skills": top_market_skills
            }
        }

    except Exception as e:
        print(f"Error in profile analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate profile analysis: {str(e)}")


@router.post("/userdetails")
async def create_user_details(
    details: schemas.UserProfileCreate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        # Check if profile exists
        existing_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

        # Serialize complex fields
        skills_str = json.dumps(details.skills) if details.skills else None
        preferred_industries_str = json.dumps(details.preferred_industries) if details.preferred_industries else None

        profile_data = {
            "education_level": details.education_level,
            "current_status": details.current_status,
            "current_role": details.current_role,
            "current_industry": details.current_industry,
            "location": details.location,
            "skills": skills_str,
            "desired_role": details.desired_role,
            "preferred_industries": preferred_industries_str,
            "language": details.language,
            "learning_pace": details.learning_pace,
            "hours_per_week": details.hours_per_week,
            "budget_sensitivity": details.budget_sensitivity,
            "timeline": details.timeline
        }

        # Fields that affect learning path generation — only invalidate if these change
        PATH_FIELDS = (
            "desired_role", "skills", "preferred_industries",
            "language", "learning_pace", "hours_per_week", "timeline",
        )
        # Fields that affect market insights
        MARKET_FIELDS = ("desired_role", "skills")

        path_changed = False
        market_changed = False

        if existing_profile:
            # Compare path-affecting fields before and after
            for field in PATH_FIELDS:
                old_val = getattr(existing_profile, field, None)
                new_val = profile_data.get(field)
                if old_val != new_val:
                    path_changed = True
                    if field in MARKET_FIELDS:
                        market_changed = True
                    break
            # If path fields didn't trigger market check, also check market-only fields
            if not market_changed:
                for field in MARKET_FIELDS:
                    old_val = getattr(existing_profile, field, None)
                    new_val = profile_data.get(field)
                    if old_val != new_val:
                        market_changed = True
                        break

            # Update existing profile
            for key, value in profile_data.items():
                setattr(existing_profile, key, value)
        else:
            # Create new profile — always generate fresh path
            new_profile = UserProfile(user_id=current_user.id, **profile_data)
            db.add(new_profile)
            path_changed = True
            market_changed = True

        db.commit()

        # Only invalidate if path-affecting fields actually changed
        if path_changed:
            invalidate_learning_path(current_user.id, db)
            print(f"[userdetails] Learning path invalidated for user {current_user.id}")
        else:
            print(f"[userdetails] No path-affecting changes for user {current_user.id} — keeping cached path")

        if market_changed:
            invalidate_market_insights_cache(current_user.id, db)

        return {"message": "User profile saved successfully"}

    except Exception as e:
        print(f"Error saving profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/profile-insights")
async def get_profile_insights(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

        if not profile:
            raise HTTPException(status_code=400, detail="Profile not found")

        role = profile.desired_role or "General Technology"

        # Check cache first
        from services.cache_service import get_valid_cache
        cache = get_valid_cache(current_user.id, role, db)
        if cache:
            cached_insights = json.loads(cache.profile_insights)
            # Only return if actually populated (not empty placeholder)
            if cached_insights and cached_insights.get("trending_skills"):
                print(f"[Cache HIT] profile-insights for user {current_user.id}")
                return cached_insights

        print(f"[Cache MISS] profile-insights for user {current_user.id}")

        # Use analyze_role_outlook for static LLM-powered market data
        outlook = insights_engine.analyze_role_outlook(role)

        # Fetch real-time market data via Exa API (web search + extraction)
        realtime_data = fetch_realtime_market_data(role)

        # Transform analyze_role_outlook output to the frontend-expected format
        growth_score = outlook.get("growth", 75)
        salary_score = outlook.get("salary", 75)
        demand_score = outlook.get("demand", 75)

        # Convert numeric growth score to percentage string
        if growth_score >= 80:
            role_growth = f"+{growth_score // 5}%"
        elif growth_score >= 50:
            role_growth = f"+{growth_score // 8}%"
        else:
            role_growth = f"+{max(1, growth_score // 10)}%"

        # Convert numeric salary score to insight string
        if salary_score >= 80:
            salary_insight = "Above market average — top-tier compensation"
        elif salary_score >= 60:
            salary_insight = "Competitive — at or above market median"
        elif salary_score >= 40:
            salary_insight = "Market average — room for negotiation"
        else:
            salary_insight = "Below market average — upskilling can help"

        # Derive hot sectors from demand + role context
        hot_sectors = ["Technology", "Finance", "Healthcare"]
        if demand_score >= 70:
            hot_sectors = ["Technology", "AI & Automation", "Cloud Services"]

        result = {
            "trending_skills": outlook.get("trending_skills", [])[:5],
            "role_growth": role_growth,
            "salary_insight": salary_insight,
            "market_outlook": outlook.get("summary", "Steady demand with growth opportunities."),
            "hot_sectors": hot_sectors,
            "data_sources": {"static": True, "realtime": realtime_data.get("data_source") == "realtime"},
            "realtime": realtime_data,
        }

        # Store in cache
        existing_cache = db.query(MarketInsightsCache).filter(
            MarketInsightsCache.user_id == current_user.id
        ).first()
        if existing_cache:
            existing_cache.profile_insights = json.dumps(result)
        else:
            new_cache = MarketInsightsCache(
                user_id=current_user.id,
                role=role,
                gap_analysis=json.dumps({}),  # placeholder
                profile_insights=json.dumps(result)
            )
            db.add(new_cache)
        db.commit()

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in profile insights: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return fallback instead of throwing error
        return {
             "trending_skills": ["Cloud Architecture", "AI Integration", "Data Security"],
             "role_growth": "+8%",
             "salary_insight": "Market competitive",
             "market_outlook": "Steady demand with growth opportunities.",
             "hot_sectors": ["Technology", "Finance", "Healthcare"],
             "data_sources": {"static": True, "realtime": False},
             "realtime": {
                 "training_skills": [],
                 "growth_rate": "N/A",
                 "total_jobs": "N/A",
                 "starting_salary": "N/A",
                 "average_salary": "N/A",
                 "max_salary": "N/A",
                 "data_source": "static",
             },
        }


@router.post("/add-skill")
async def add_skill(
    skill_data: profile_schemas.SkillAdd,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")

    try:
        current_skills = json.loads(profile.skills) if profile.skills else []

        # Normalize existing skills to object format
        normalized = []
        for s in current_skills:
            if isinstance(s, str):
                normalized.append({"name": s, "proficiency": "beginner"})
            else:
                normalized.append(s)

        # Case insensitive check
        if any(s["name"].lower() == skill_data.skill.lower() for s in normalized):
            return {"message": "Skill already exists", "skills": normalized}

        proficiency = skill_data.proficiency if skill_data.proficiency in ("beginner", "intermediate", "advanced") else "beginner"
        normalized.append({"name": skill_data.skill, "proficiency": proficiency})
        profile.skills = json.dumps(normalized)
        db.commit()

        # Invalidate learning path
        invalidate_learning_path(current_user.id, db)
        # Invalidate market insights cache (skills changed)
        invalidate_market_insights_cache(current_user.id, db)

        return {"message": "Skill added", "skills": normalized}

    except Exception as e:
        print(f"Error adding skill: {e}")
        raise HTTPException(status_code=500, detail="Failed to add skill")



