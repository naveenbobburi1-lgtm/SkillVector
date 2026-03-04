from fastapi import Body, Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from db.database import get_db,init_db
from db.models import UserDB, UserProfile, ProfileDB, SkillDB, CertificationDB, CareerGoalDB, LearningPath, PhaseProgress, TestAttempt, ActiveTest, VideoAssignment, UserVideoAssignment, VideoProgress, AdminActivityLog
import schemas.UserSchemas as schemas
import schemas.ProfileSchemas as profile_schemas
from rag.retriever import clean_llm_json
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, case
from typing import Optional, List
import os
import secrets
import re
from datetime import datetime, timedelta, timezone
from groq import Groq
import json
from dotenv import load_dotenv
from auth import hash_password,verify_password,create_access_token,get_current_user
from rag.query_planner import generate_search_queries
from rag.batch_retriever import batch_retrieve
from market.load_onet import load_onet_data
from market.role_matcher import match_role_to_soc
from market.skill_extractor import extract_top_skills, extract_skills_with_llm
from market.insights_engine import generate_market_insights
import market.role_matcher as role_matcher
import market.insights_engine as insights_engine
import market.load_onet as load_onet
load_dotenv()
init_db()

def invalidate_learning_path(user_id: int, db: Session):
    """Deletes the existing learning path for a user to force regeneration."""
    db.query(LearningPath).filter(LearningPath.user_id == user_id).delete()
    db.commit()

app = FastAPI()
print(os.getenv("SECRET_KEY"))
ONET_CACHE = {}

@app.on_event("startup")
def load_onet():
    try:
        occupations_df, skills_df = load_onet_data()
        ONET_CACHE["occupations"] = occupations_df
        ONET_CACHE["skills"] = skills_df
        print("✅ O*NET data loaded")
    except Exception as e:
        print("❌ Failed to load O*NET:", e)

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]
frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url:
    for url in frontend_url.split(","):
        url = url.strip()
        if url:
            allowed_origins.append(url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
async def read_root():
    return "ai learning path generator"  

@app.post("/register")
async def register_user(user:schemas.UserCreate,db:Session=Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    try:
        new_user = UserDB(
            username=user.username,
            email=user.email,
            hashed_password=hash_password(user.password)  
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed")
    return {"message": "User registered successfully", "user_id": new_user.id}

@app.post("/login")
async def login_user(user:schemas.UserLogin,db:Session=Depends(get_db)):
    db_user=db.query(UserDB).filter(UserDB.email==user.email).first()
    if not db_user:
        raise HTTPException(status_code=401,detail="Invalid credentials")
    if not db_user.hashed_password or db_user.hashed_password == "google_oauth_user":
        raise HTTPException(status_code=400,detail="This account uses Google Sign-In. Please sign in with Google.")
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401,detail="Invalid credentials")
    if not db_user.is_active:
        raise HTTPException(status_code=403,detail="Your account has been suspended. Contact an administrator.")
    access_token=create_access_token(data={"sub":db_user.email})   
    return {"access_token":access_token,"token_type":"bearer","user_id":db_user.id}

@app.post("/auth/google")
async def google_auth(request: Request, db: Session = Depends(get_db)):
    """
    Accept a Google OAuth2 access_token from the frontend (@react-oauth/google),
    verify it by calling Google's userinfo endpoint, then create/find the user
    and return a Skillvector JWT.
    """
    import httpx
    body = await request.json()
    access_token = body.get("credential")   # access_token passed as 'credential'
    if not access_token:
        raise HTTPException(status_code=400, detail="Missing Google access token")

    # Verify token by fetching userinfo from Google (server-side validation)
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10,
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired Google token")
        idinfo = resp.json()
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Could not reach Google servers")

    email: str = idinfo.get("email", "")
    name: str = idinfo.get("name") or email.split("@")[0]
    picture: str = idinfo.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google token")

    # Find or create user
    user = db.query(UserDB).filter(UserDB.email == email).first()
    is_new_user = False
    if not user:
        is_new_user = True
        base_username = name[:50]
        username = base_username
        counter = 1
        while db.query(UserDB).filter(UserDB.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1
        user = UserDB(
            username=username,
            email=email,
            hashed_password="google_oauth_user",
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to create user")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been suspended. Contact an administrator.")

    skillvector_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": skillvector_token,
        "token_type": "bearer",
        "user_id": user.id,
        "is_new_user": is_new_user,
        "name": user.username,
        "picture": picture,
    }

@app.get("/market-insights-test")
async def market_insights(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    try:
        if "occupations" not in ONET_CACHE:
            raise HTTPException(status_code=500, detail="O*NET data not loaded")

        occupations_df = ONET_CACHE["occupations"]
        skills_df = ONET_CACHE["skills"]

        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        if not profile:
            raise HTTPException(status_code=400, detail="Profile not found")

        user_role = profile.desired_role
        user_skills = json.loads(profile.skills) if profile.skills else []

        # Try to match role to O*NET SOC code
        match = match_role_to_soc(user_role, occupations_df)
        
        if match:
            # O*NET match found - use traditional data
            soc_code, canonical_role = match
            market_skills = extract_top_skills(soc_code, skills_df)
        else:
            # No O*NET match - use LLM fallback for modern/non-traditional roles
            print(f"No O*NET match for '{user_role}', using LLM fallback")
            soc_code = "99-9999.00"  # Generic code for non-O*NET roles
            canonical_role = user_role  # Use user's original role name
            market_skills = extract_skills_with_llm(user_role, top_n=15)
        
        # Ensure market_skills is not empty
        if not market_skills:
            market_skills = [
                "Communication", "Problem Solving", "Critical Thinking",
                "Teamwork", "Leadership", "Technical Proficiency",
                "Data Analysis", "Project Management"
            ]
        
        insights = generate_market_insights(user_skills, market_skills)

        return {
            "role": canonical_role,
            "soc_code": soc_code,
            "insights": insights
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in market insights: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate market insights: {str(e)}")

@app.get("/generate-path")
async def generate_learning_path(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        raise HTTPException(status_code=400, detail="User profile not found. Please complete your profile first.")

    # Return cached path if exists
    existing_path = db.query(LearningPath).filter(LearningPath.user_id == current_user.id).first()
    if existing_path:
        path_json = json.loads(existing_path.path_data)
        
        # Ensure phase progress is initialized (even for cached paths)
        existing_progress = db.query(PhaseProgress).filter(
            PhaseProgress.user_id == current_user.id
        ).count()
        
        if existing_progress == 0:
            from utils.test_generator import initialize_phase_progress
            num_phases = len(path_json.get("learning_path", []))
            if num_phases > 0:
                initialize_phase_progress(current_user.id, num_phases, db)
        
        return path_json

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # Parse JSON fields safely
    skills = json.loads(profile.skills) if profile.skills else []
    industries = json.loads(profile.preferred_industries) if profile.preferred_industries else []

    # ==================================================
    # RAG PIPELINE 
    # ==================================================

    try:
        search_queries = generate_search_queries(profile)
        web_context = batch_retrieve(search_queries, max_sources=20)
    except Exception as e:
        print("RAG FAILED:", e)
        web_context = ""

    web_context = web_context[:6000]  # token limit safety
    # Prompt Construction 

    prompt = f"""
You are an AI system that generates structured learning paths.

CRITICAL INSTRUCTION:
- The generated path MUST fit exactly within the 'Target Timeline' specified by the user (e.g., if target is 3 months, total duration must be approx 3 months). Adjust the scope and depth of modules to fit this constraint.

IMPORTANT INSTRUCTIONS (STRICT):
- Use ONLY the resources provided in the SOURCES section.
- Do NOT invent links, platforms, or book names.
- If a resource is not present in SOURCES, do NOT include it.
- YouTube videos or playlists from SOURCES are allowed for Courses.

SOURCES:
{web_context}

TASK:
Generate a highly personalized, comprehensive learning path for the following user.
Establish a clear logical progression.

USER DETAILS:
- Target Role: {profile.desired_role}
- Current Education: {profile.education_level}
- Current Status: {profile.current_status}
- Location: {profile.location}
- Existing Skills: {', '.join(skills)}
- Preferred Industries: {', '.join(industries)}
- Expected Income: {profile.expected_income}
- Willing to Relocate: {profile.relocation}
- Learning Pace: {profile.learning_pace}
- Hours per Week: {profile.hours_per_week}
- Budget Sensitivity: {profile.budget_sensitivity}
- Target Timeline: {profile.timeline}
- User Email: {current_user.email}

OUTPUT RULES (STRICT):
- Respond ONLY in valid JSON
- Do NOT include explanations or markdown
- Follow EXACTLY this JSON structure:

{{
  "meta": {{
    "goal": string,
    "duration_months": number,
    "weekly_time_hours": number,
    "level": string
  }},
  "learning_path": [
    {{
      "phase": string,
      "duration_weeks": number,
      "why_this_phase": string,
      "topics": [string],
      "skills": [string],
      "weekly_breakdown": [
        {{
          "week": number,
          "focus": string,
          "learning_objectives": [string],
          "practice_tasks": [string]
        }}
      ],
      "resources": [
        {{
          "type": "Course" | "Article" | "Book" | "Video",
          "title": string,
          "platform": string,
          "link": string
        }}
      ],
      "projects": [
        {{
          "title": string,
          "description": string,
          "difficulty": "Easy" | "Medium" | "Hard"
        }}
      ]
    }}
  ]
}}

CRITICAL CONTENT REQUIREMENTS:
1. "why_this_phase": Explain why this phase is important and correctly placed.
2. "topics": 5–8 detailed sub-topics per phase.
3. "weekly_breakdown": Break down each phase into weekly focused goals (duration_weeks number of weeks). Each week should have specific learning objectives and practice tasks.
4. "resources": EXACTLY 6-8 per phase:
   - 2-3 Courses (Coursera / Udemy / edX / YouTube)
   - 2-3 Articles or Blogs
   - 1-2 Books
5. "projects": MINIMUM 3-5 hands-on projects per phase with varying difficulty levels (Easy/Medium/Hard)
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        response_format={"type": "json_object"}
    )


    content = response.choices[0].message.content
    content = clean_llm_json(content)

    try:
        path_json = json.loads(content)

        new_path = LearningPath(user_id=current_user.id, path_data=content)
        db.add(new_path)
        db.commit()

        # Initialize phase progress tracking
        num_phases = len(path_json.get("learning_path", []))
        if num_phases > 0:
            # Import here to avoid circular imports
            from utils.test_generator import initialize_phase_progress
            initialize_phase_progress(current_user.id, num_phases, db)

        return path_json

    except json.JSONDecodeError:
        return {
            "error": "Model returned invalid JSON",
            "raw_output": content
        }


@app.get("/phase-progress")
async def get_phase_progress(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    """Get progress tracking for all phases"""
    progress = db.query(PhaseProgress).filter(
        PhaseProgress.user_id == current_user.id
    ).order_by(PhaseProgress.phase_index).all()
    
    return {
        "progress": [
            {
                "phase_index": p.phase_index,
                "is_unlocked": p.is_unlocked,
                "is_completed": p.is_completed,
                "test_passed": p.test_passed,
                "best_score": p.best_score
            }
            for p in progress
        ]
    }


@app.get("/phase-test/{phase_index}")
async def get_phase_test(
    phase_index: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    """Generate MCQ test for a specific phase"""
    # Check if phase is unlocked
    progress = db.query(PhaseProgress).filter(
        PhaseProgress.user_id == current_user.id,
        PhaseProgress.phase_index == phase_index
    ).first()
    
    if not progress or not progress.is_unlocked:
        raise HTTPException(status_code=403, detail="Phase not unlocked yet")
    
    # Get learning path
    path = db.query(LearningPath).filter(LearningPath.user_id == current_user.id).first()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    path_data = json.loads(path.path_data)
    learning_path = path_data.get("learning_path", [])
    
    if phase_index >= len(learning_path):
        raise HTTPException(status_code=404, detail="Phase not found")
    
    phase_data = learning_path[phase_index]
    
    # Generate MCQs
    from utils.test_generator import generate_phase_mcqs
    questions = generate_phase_mcqs(phase_data, phase_index)
    
    # Store questions with correct answers in DB for later validation
    existing = db.query(ActiveTest).filter(
        ActiveTest.user_id == current_user.id,
        ActiveTest.phase_index == phase_index
    ).first()
    
    if existing:
        existing.questions_data = json.dumps(questions)
        existing.created_at = func.now()
    else:
        active_test = ActiveTest(
            user_id=current_user.id,
            phase_index=phase_index,
            questions_data=json.dumps(questions)
        )
        db.add(active_test)
    db.commit()
    
    # Don't send correct answers to frontend
    questions_without_answers = [
        {
            "question": q["question"],
            "options": q["options"],
            "difficulty": q.get("difficulty", "Medium")
        }
        for q in questions
    ]
    
    return {
        "phase_index": phase_index,
        "phase_name": phase_data.get("phase", f"Phase {phase_index + 1}"),
        "questions": questions_without_answers,
        "total_questions": len(questions),
        "passing_score": 70
    }


@app.post("/submit-test")
async def submit_test(
    test_data: dict,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    """Submit test answers and calculate score"""
    phase_index = test_data.get("phase_index")
    user_answers = test_data.get("answers", [])  # List of indices
    
    # Retrieve the SAME questions that were shown to the user
    active_test = db.query(ActiveTest).filter(
        ActiveTest.user_id == current_user.id,
        ActiveTest.phase_index == phase_index
    ).first()
    
    if not active_test:
        raise HTTPException(status_code=400, detail="No active test found. Please take the test first.")
    
    questions = json.loads(active_test.questions_data)
    
    if not questions or len(questions) == 0:
        raise HTTPException(status_code=500, detail="No test questions found")
    
    # Calculate score
    correct_count = 0
    for i, user_answer in enumerate(user_answers):
        if i < len(questions) and user_answer == questions[i]["correct_answer"]:
            correct_count += 1
    
    score = int((correct_count / len(questions)) * 100) if len(questions) > 0 else 0
    passed = score >= 70
    
    # Save attempt
    attempt = TestAttempt(
        user_id=current_user.id,
        phase_index=phase_index,
        score=score,
        answers=json.dumps(user_answers),
        passed=passed
    )
    db.add(attempt)
    
    # Update progress
    progress = db.query(PhaseProgress).filter(
        PhaseProgress.user_id == current_user.id,
        PhaseProgress.phase_index == phase_index
    ).first()
    
    if progress:
        if score > progress.best_score:
            progress.best_score = score
        
        if passed and not progress.test_passed:
            progress.test_passed = True
            progress.is_completed = True
            progress.updated_at = func.now()
            
            # Unlock next phase
            next_progress = db.query(PhaseProgress).filter(
                PhaseProgress.user_id == current_user.id,
                PhaseProgress.phase_index == phase_index + 1
            ).first()
            
            if next_progress:
                next_progress.is_unlocked = True
    
    db.commit()
    
    # Return results with explanations
    results = []
    for i, q in enumerate(questions):
        user_ans = user_answers[i] if i < len(user_answers) else -1
        is_correct = user_ans == q["correct_answer"]
        results.append({
            "question": q["question"],
            "user_answer": user_ans,
            "correct_answer": q["correct_answer"],
            "is_correct": is_correct,
            "explanation": q.get("explanation", "")
        })
    
    return {
        "score": score,
        "passed": passed,
        "correct_count": correct_count,
        "total_questions": len(questions),
        "results": results,
        "next_phase_unlocked": passed
    }


@app.post("/add-skill-and-regenerate-path")
async def add_skill_and_regenerate_path(
    skill_data: dict,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    """Add a new skill to profile and regenerate learning path"""
    skill = skill_data.get("skill", "").strip()
    
    if not skill:
        raise HTTPException(status_code=400, detail="Skill name required")
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")
    
    # Add skill to profile
    current_skills = json.loads(profile.skills) if profile.skills else []
    if skill.lower() not in [s.lower() for s in current_skills]:
        current_skills.append(skill)
        profile.skills = json.dumps(current_skills)
        db.commit()
    
    # Delete existing learning path to force regeneration
    db.query(LearningPath).filter(LearningPath.user_id == current_user.id).delete()
    db.commit()
    
    return {
        "message": "Skill added and path regeneration triggered",
        "skills": current_skills,
        "regenerate_path": True
    }


@app.get("/user-profile")
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
        "age": profile.age,
        "phone": profile.phone,
        "education_level": profile.education_level,
        "current_status": profile.current_status,
        "location": profile.location,
        "id": profile.id, 
        "skills": json.loads(profile.skills) if profile.skills else [],
        "certifications": json.loads(profile.certifications) if profile.certifications else [],
        "desired_role": profile.desired_role,
        "preferred_industries": json.loads(profile.preferred_industries) if profile.preferred_industries else [],
        "expected_income": profile.expected_income,
        "relocation": profile.relocation,
        "language": profile.language,
        "learning_pace": profile.learning_pace,
        "hours_per_week": profile.hours_per_week,
        "learning_format": json.loads(profile.learning_format) if profile.learning_format else [],
        "budget_sensitivity": profile.budget_sensitivity,
        "timeline": profile.timeline
    }

@app.get("/profile/analysis")
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
             occupations, skills_df = load_onet_data()
             ONET_CACHE["occupations"] = occupations
             ONET_CACHE["skills"] = skills_df
        else:
             occupations = ONET_CACHE["occupations"]
             skills_df = ONET_CACHE["skills"]
        
        # 1. Match Role to SOC
        match = role_matcher.match_role_to_soc(profile.desired_role, occupations)
        
        if match:
            # O*NET match found - use traditional data
            soc_code, soc_title = match
            # 2. Get Market Skills for SOC
            relevant_skills = skills_df[skills_df["O*NET-SOC Code"] == soc_code]
            top_market_skills = relevant_skills[relevant_skills["Scale ID"] == "IM"]
            top_market_skills = top_market_skills.sort_values("Data Value", ascending=False).head(20)["Element Name"].tolist()
        else:
            # No O*NET match - use LLM fallback
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
        user_skills = json.loads(profile.skills) if profile.skills else []
        insights = insights_engine.generate_market_insights(user_skills, top_market_skills)
        
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
        coverage = insights["skill_coverage_percent"]
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



@app.post("/profile", response_model=profile_schemas.ProfileResponse)
async def create_or_update_profile(
    profile: profile_schemas.ProfileCreate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    # Check if profile exists
    db_profile = db.query(ProfileDB).filter(ProfileDB.user_id == current_user.id).first()
    
    if not db_profile:
        db_profile = ProfileDB(user_id=current_user.id)
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)

    # Update basic fields
    db_profile.full_name = profile.full_name
    db_profile.age = profile.age
    db_profile.education = profile.education
    db_profile.current_status = profile.current_status
    db_profile.location = profile.location
    db_profile.total_experience = profile.total_experience

    # Update Skills (Full replacement strategy)
    # First, remove existing relations
    db.query(SkillDB).filter(SkillDB.profile_id == db_profile.id).delete()
    db.query(CertificationDB).filter(CertificationDB.profile_id == db_profile.id).delete()
    db.query(CareerGoalDB).filter(CareerGoalDB.profile_id == db_profile.id).delete()
    
    # Add new Skills
    for skill in profile.skills:
        new_skill = SkillDB(profile_id=db_profile.id, name=skill.name, category=skill.category)
        db.add(new_skill)

    # Add new Certifications
    for cert in profile.certifications:
        new_cert = CertificationDB(profile_id=db_profile.id, name=cert.name, issuer=cert.issuer)
        db.add(new_cert)

    # Add new Career Goals
    for goal in profile.career_goals:
        new_goal = CareerGoalDB(profile_id=db_profile.id, title=goal.title, description=goal.description)
        db.add(new_goal)

    db.commit()
    db.refresh(db_profile)
    
    # Invalidate learning path
    invalidate_learning_path(current_user.id, db)
    
    return db_profile

@app.get("/profile", response_model=profile_schemas.ProfileResponse)
async def get_profile(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    db_profile = db.query(ProfileDB).filter(ProfileDB.user_id == current_user.id).first()
    if not db_profile:
        # Return empty profile or 404. Returning 404 might be better if we expect one.
        # But for "review" page, maybe return empty structure or 404. 
        # Let's return 404 if not found, frontend can handle it.
        raise HTTPException(status_code=404, detail="Profile not found")
    return db_profile

@app.post("/userdetails")
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
        certifications_str = json.dumps(details.certifications) if details.certifications else None
        preferred_industries_str = json.dumps(details.preferred_industries) if details.preferred_industries else None
        learning_format_str = json.dumps(details.learning_format) if details.learning_format else None

        profile_data = {
            "age": details.age,
            "phone": details.phone,
            "education_level": details.education_level,
            "current_status": details.current_status,
            "location": details.location,
            "skills": skills_str,
            "certifications": certifications_str,
            "desired_role": details.desired_role,
            "preferred_industries": preferred_industries_str,
            "expected_income": details.expected_income,
            "relocation": details.relocation,
            "language": details.language,
            "learning_pace": details.learning_pace,
            "hours_per_week": details.hours_per_week,
            "learning_format": learning_format_str,
            "budget_sensitivity": details.budget_sensitivity,
            "timeline": details.timeline
        }

        if existing_profile:
            # Update existing profile
            for key, value in profile_data.items():
                setattr(existing_profile, key, value)
        else:
            # Create new profile
            new_profile = UserProfile(user_id=current_user.id, **profile_data)
            db.add(new_profile)
        
        db.commit()
        
        # Invalidate learning path
        invalidate_learning_path(current_user.id, db)
        
        return {"message": "User profile saved successfully"}

    except Exception as e:
        print(f"Error saving profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/profile-insights")
async def get_profile_insights(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    try:
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        
        if not profile:
            raise HTTPException(status_code=400, detail="Profile not found")

        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        # Construct context for the AI
        skills = json.loads(profile.skills) if profile.skills else []
        role = profile.desired_role or "General Technology"
        location = profile.location or "Global"
        
        prompt = f"""
        Analyze the career profile for a user targeting the role of '{role}' based in '{location}'.
        Their current skills are: {', '.join(skills) if skills else 'None listed'}.
        
        Provide a JSON response with the following market insights:
        1. "trending_skills": A list of 3-5 top trending skills they should learn next for this role.
        2. "role_growth": A percentage string (e.g. "+12%") representing estimated annual hiring growth for this role.
        3. "salary_insight": A short string comparing their target income to the market average.
        4. "market_outlook": A concise 1-sentence summary of the job market for this role.
        5. "hot_sectors": A list of 2-3 industries currently hiring aggressively for this role.
        
        Return ONLY valid JSON.
        """

        try:
            completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a career market analyst providing real-time data insights. Output distinct JSON only."},
                    {"role": "user", "content": prompt}
                ],
                model="groq/compound",
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            content = completion.choices[0].message.content
            result = json.loads(content)
            # Validate required fields exist
            if all(key in result for key in ["trending_skills", "role_growth", "salary_insight", "market_outlook", "hot_sectors"]):
                return result
        except Exception as llm_err:
            print(f"LLM error in profile-insights: {llm_err}")
        
        # Fallback data if AI fails
        print(f"Using fallback data for profile insights")
        return {
             "trending_skills": ["Cloud Architecture", "AI Integration", "Data Security"],
             "role_growth": "+8%",
             "salary_insight": "Market competitive",
             "market_outlook": "Steady demand with unique specializations.",
             "hot_sectors": ["Technology", "Finance", "Healthcare"]
        }
    
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
             "hot_sectors": ["Technology", "Finance", "Healthcare"]
        }

@app.post("/add-skill")
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
        
        # Case insensitive check
        if any(s.lower() == skill_data.skill.lower() for s in current_skills):
            return {"message": "Skill already exists", "skills": current_skills}

        current_skills.append(skill_data.skill)
        profile.skills = json.dumps(current_skills)
        profile.skills = json.dumps(current_skills)
        db.commit()
        
        # Invalidate learning path
        invalidate_learning_path(current_user.id, db)
        
        return {"message": "Skill added", "skills": current_skills}
        
    except Exception as e:
        print(f"Error adding skill: {e}")
        raise HTTPException(status_code=500, detail="Failed to add skill")

@app.post("/add-certification")
async def add_certification(
    cert_data: profile_schemas.CertificationAdd,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")

    try:
        current_certs = json.loads(profile.certifications) if profile.certifications else []
        
        # Check for duplicate certification (title + issuer)
        if any(c["title"].lower() == cert_data.name.lower() and c["issuer"].lower() == cert_data.issuer.lower() for c in current_certs):
             return {"message": "Certification already exists", "certifications": current_certs}

        new_cert = {"title": cert_data.name, "issuer": cert_data.issuer}
        current_certs.append(new_cert)
        
        profile.certifications = json.dumps(current_certs)
        profile.certifications = json.dumps(current_certs)
        db.commit()
        
        # Invalidate learning path
        invalidate_learning_path(current_user.id, db)
        
        return {"message": "Certification added", "certifications": current_certs}
        
    except Exception as e:
        print(f"Error adding certification: {e}")
        raise HTTPException(status_code=500, detail="Failed to add certification")


# ============================================================
# AI ASSISTANT - Learning Path Q&A with Sources
# ============================================================

@app.post("/ai-assistant")
async def ai_assistant(
    request: Request,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    """
    AI Assistant that answers user queries about learning path topics.
    Uses groq/compound model which can search the web and return sources.
    """
    payload = await request.json()
    question = payload.get("question", "").strip()
    phase_context = payload.get("phase_context", None)  # optional: current phase info
    conversation_history = payload.get("history", [])  # optional: previous messages

    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    # Get user's learning path for context
    path = db.query(LearningPath).filter(LearningPath.user_id == current_user.id).first()
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    learning_context = ""
    if path:
        try:
            path_data = json.loads(path.path_data)
            meta = path_data.get("meta", {})
            phases = path_data.get("learning_path", [])
            
            learning_context += f"User's Goal: {meta.get('goal', 'N/A')}\n"
            learning_context += f"Level: {meta.get('level', 'N/A')}\n"
            learning_context += f"Duration: {meta.get('duration_months', 'N/A')} months\n\n"
            
            learning_context += "Learning Path Phases:\n"
            for i, phase in enumerate(phases):
                phase_name = phase.get("phase", phase.get("stage", f"Phase {i+1}"))
                topics = phase.get("topics", [])
                skills = phase.get("skills", [])
                learning_context += f"  Phase {i+1}: {phase_name}\n"
                learning_context += f"    Topics: {', '.join(topics[:5])}\n"
                learning_context += f"    Skills: {', '.join(skills[:5])}\n"
        except Exception:
            learning_context = "Learning path data unavailable."

    if profile:
        user_skills = json.loads(profile.skills) if profile.skills else []
        learning_context += f"\nUser's Current Skills: {', '.join(user_skills)}\n"
        learning_context += f"Desired Role: {profile.desired_role or 'N/A'}\n"

    # If phase_context is provided, add specific phase details
    phase_detail = ""
    if phase_context and path:
        try:
            path_data = json.loads(path.path_data)
            phases = path_data.get("learning_path", [])
            idx = phase_context.get("phase_index")
            if idx is not None and idx < len(phases):
                p = phases[idx]
                phase_detail = f"\nUser is currently viewing Phase {idx+1}: {p.get('phase', p.get('stage', ''))}\n"
                phase_detail += f"Topics in this phase: {', '.join(p.get('topics', []))}\n"
                phase_detail += f"Skills: {', '.join(p.get('skills', []))}\n"
                if p.get("weekly_breakdown"):
                    phase_detail += "Weekly breakdown:\n"
                    for w in p["weekly_breakdown"]:
                        phase_detail += f"  Week {w.get('week')}: {w.get('focus', '')}\n"
        except Exception:
            pass

    system_prompt = f"""You are SkillVector AI — a concise, beginner-friendly learning assistant.

USER CONTEXT:
{learning_context}
{phase_detail}

RULES (MUST FOLLOW):
1. Keep answers SHORT — max 6-8 sentences for the explanation. No walls of text.
2. Use simple language. NO jargon. Explain like the user is a smart beginner.
3. Use bullet points for lists, never tables.
4. Only include a short code snippet if the user explicitly asks for code. Keep it under 15 lines.
5. At the END of every response, include a resources section in EXACTLY this format:

🔗 **Resources:**
- 🎬 [Video Title](youtube_url)
- 🎬 [Video Title](youtube_url)
- 📄 [Article/Doc Title](url)

6. Provide 3-5 resources max. Prioritize YouTube videos (use 🎬), then docs (📄), then courses (🎓).
7. Each resource link must be on its own line starting with the emoji + markdown link.
8. Do NOT include practice plans, weekly schedules, tracking systems, or lengthy step-by-step programs unless the user specifically asks.
9. Answer the specific question asked — don't over-expand into related topics.
10. Never use tables in your response. Use bullet points instead."""

    # Build messages for the API call
    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history (last 10 messages max)
    for msg in conversation_history[-10:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": question})

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        completion = client.chat.completions.create(
            messages=messages,
            model="groq/compound",
            temperature=0.7,
            max_tokens=1024,
        )

        assistant_reply = completion.choices[0].message.content

        # Extract sources from the executed_tools if available (compound model feature)
        sources = []
        if hasattr(completion, 'choices') and completion.choices:
            choice = completion.choices[0]
            if hasattr(choice.message, 'executed_tools') and choice.message.executed_tools:
                for tool in choice.message.executed_tools:
                    if hasattr(tool, 'type') and tool.type == 'web_search':
                        if hasattr(tool, 'results'):
                            for result in tool.results:
                                sources.append({
                                    "title": getattr(result, 'title', ''),
                                    "url": getattr(result, 'url', ''),
                                    "snippet": getattr(result, 'snippet', '')
                                })

        return {
            "answer": assistant_reply,
            "sources": sources,
            "model": "groq/compound"
        }

    except Exception as e:
        print(f"AI Assistant error: {e}")
        import traceback
        traceback.print_exc()
        
        # Fallback: try with a different model
        try:
            client = Groq(api_key=os.getenv("GROQ_API_KEY"))
            completion = client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=2048,
            )
            return {
                "answer": completion.choices[0].message.content,
                "sources": [],
                "model": "llama-3.3-70b-versatile (fallback)"
            }
        except Exception as fallback_err:
            print(f"Fallback model also failed: {fallback_err}")
            raise HTTPException(status_code=500, detail="AI Assistant is temporarily unavailable. Please try again.")


# ============================================================
# ADMIN PANEL - HELPER FUNCTIONS
# ============================================================

def require_admin(current_user: UserDB = Depends(get_current_user)):
    """Dependency that ensures the current user is an admin."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def extract_youtube_id(url: str) -> str:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})',
        r'(?:youtu\.be\/)([a-zA-Z0-9_-]{11})',
        r'(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
        r'(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("Invalid YouTube URL")


def log_admin_action(db: Session, admin_id: int, action: str, target_type: str = None, target_id: int = None, details: str = None):
    """Log an admin action for audit trail."""
    log = AdminActivityLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details
    )
    db.add(log)
    db.commit()


# ============================================================
# ADMIN AUTH
# ============================================================

@app.post("/admin/login")
async def admin_login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    """Admin-specific login that verifies admin privileges."""
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been suspended. Contact an administrator.")
    if not db_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    access_token = create_access_token(data={"sub": db_user.email, "is_admin": True})
    return {"access_token": access_token, "token_type": "bearer", "user_id": db_user.id, "is_admin": True}


@app.get("/admin/me")
async def admin_me(current_user: UserDB = Depends(require_admin)):
    """Get current admin info."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_admin": current_user.is_admin
    }


# ============================================================
# ADMIN - ANALYTICS DASHBOARD
# ============================================================

@app.get("/admin/analytics")
async def admin_analytics(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_admin)
):
    """Comprehensive analytics for the admin dashboard."""
    # Total counts
    total_users = db.query(func.count(UserDB.id)).scalar()
    total_profiles = db.query(func.count(UserProfile.id)).scalar()
    total_paths = db.query(func.count(LearningPath.id)).scalar()
    total_tests = db.query(func.count(TestAttempt.id)).scalar()
    total_videos = db.query(func.count(VideoAssignment.id)).filter(VideoAssignment.is_active == True).scalar()

    # Users registered in last 7 days
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    new_users_week = db.query(func.count(UserDB.id)).filter(UserDB.created_at >= week_ago).scalar()

    # Profile completion rate
    profile_completion_rate = round((total_profiles / total_users * 100), 1) if total_users > 0 else 0

    # Learning path generation rate
    path_generation_rate = round((total_paths / total_profiles * 100), 1) if total_profiles > 0 else 0

    # Test pass rate
    passed_tests = db.query(func.count(TestAttempt.id)).filter(TestAttempt.passed == True).scalar()
    test_pass_rate = round((passed_tests / total_tests * 100), 1) if total_tests > 0 else 0

    # Average test score
    avg_score = db.query(func.avg(TestAttempt.score)).scalar()
    avg_score = round(avg_score, 1) if avg_score else 0

    # Phase completion distribution
    phase_stats = db.query(
        PhaseProgress.phase_index,
        func.count(PhaseProgress.id).label("total"),
        func.sum(case((PhaseProgress.is_completed == True, 1), else_=0)).label("completed")
    ).group_by(PhaseProgress.phase_index).order_by(PhaseProgress.phase_index).all()

    phase_completion = [
        {"phase": p.phase_index + 1, "total": p.total, "completed": int(p.completed or 0)}
        for p in phase_stats
    ]

    # Top desired roles
    top_roles = db.query(
        UserProfile.desired_role,
        func.count(UserProfile.id).label("count")
    ).filter(UserProfile.desired_role != None).group_by(UserProfile.desired_role).order_by(desc("count")).limit(10).all()

    # Video assignment stats
    video_completions = db.query(func.count(VideoProgress.id)).filter(VideoProgress.is_completed == True).scalar()
    total_video_progress = db.query(func.count(VideoProgress.id)).scalar()
    video_completion_rate = round((video_completions / total_video_progress * 100), 1) if total_video_progress > 0 else 0

    # Users by registration date (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    daily_registrations = db.query(
        func.date(UserDB.created_at).label("date"),
        func.count(UserDB.id).label("count")
    ).filter(UserDB.created_at >= thirty_days_ago).group_by(func.date(UserDB.created_at)).order_by("date").all()

    # Skill frequency analysis
    all_profiles = db.query(UserProfile.skills).filter(UserProfile.skills != None).all()
    skill_counter = {}
    for p in all_profiles:
        try:
            skills = json.loads(p.skills)
            for s in skills:
                skill_counter[s] = skill_counter.get(s, 0) + 1
        except:
            pass
    top_skills = sorted(skill_counter.items(), key=lambda x: x[1], reverse=True)[:15]

    # Recent activity (last 20 admin actions)
    recent_logs = db.query(AdminActivityLog).order_by(desc(AdminActivityLog.created_at)).limit(20).all()

    return {
        "overview": {
            "total_users": total_users,
            "total_profiles": total_profiles,
            "total_paths": total_paths,
            "total_tests": total_tests,
            "total_videos": total_videos,
            "new_users_week": new_users_week,
            "profile_completion_rate": profile_completion_rate,
            "path_generation_rate": path_generation_rate,
            "test_pass_rate": test_pass_rate,
            "avg_test_score": avg_score,
            "video_completion_rate": video_completion_rate,
        },
        "phase_completion": phase_completion,
        "top_roles": [{"role": r.desired_role, "count": r.count} for r in top_roles],
        "top_skills": [{"skill": s[0], "count": s[1]} for s in top_skills],
        "daily_registrations": [{"date": str(d.date), "count": d.count} for d in daily_registrations],
        "recent_activity": [
            {
                "id": log.id,
                "action": log.action,
                "target_type": log.target_type,
                "target_id": log.target_id,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in recent_logs
        ]
    }


# ============================================================
# ADMIN - USER MANAGEMENT
# ============================================================

@app.get("/admin/users")
async def admin_list_users(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_admin)
):
    """List all users with detailed info including profiles, skills, goals, and progress."""
    query = db.query(UserDB)

    if search:
        query = query.filter(
            or_(
                UserDB.username.ilike(f"%{search}%"),
                UserDB.email.ilike(f"%{search}%")
            )
        )

    total = query.count()
    users = query.order_by(desc(UserDB.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for u in users:
        profile = db.query(UserProfile).filter(UserProfile.user_id == u.id).first()
        path = db.query(LearningPath).filter(LearningPath.user_id == u.id).first()

        # Phase progress
        phases = db.query(PhaseProgress).filter(PhaseProgress.user_id == u.id).order_by(PhaseProgress.phase_index).all()
        completed_phases = sum(1 for p in phases if p.is_completed)
        total_phases = len(phases)

        # Test stats
        test_attempts = db.query(TestAttempt).filter(TestAttempt.user_id == u.id).all()
        avg_test_score = round(sum(t.score for t in test_attempts) / len(test_attempts), 1) if test_attempts else 0
        tests_passed = sum(1 for t in test_attempts if t.passed)

        # Video progress
        video_progress = db.query(VideoProgress).filter(VideoProgress.user_id == u.id).all()
        videos_completed = sum(1 for v in video_progress if v.is_completed)
        videos_assigned = len(video_progress)

        user_data = {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_active": u.is_active,
            "is_admin": u.is_admin,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "has_profile": profile is not None,
            "has_learning_path": path is not None,
            "profile": None,
            "progress": {
                "completed_phases": completed_phases,
                "total_phases": total_phases,
                "completion_rate": round((completed_phases / total_phases * 100), 1) if total_phases > 0 else 0,
                "avg_test_score": avg_test_score,
                "tests_passed": tests_passed,
                "total_tests": len(test_attempts),
                "videos_completed": videos_completed,
                "videos_assigned": videos_assigned,
            }
        }

        if profile:
            user_data["profile"] = {
                "desired_role": profile.desired_role,
                "skills": json.loads(profile.skills) if profile.skills else [],
                "education_level": profile.education_level,
                "location": profile.location,
                "current_status": profile.current_status,
                "learning_pace": profile.learning_pace,
                "hours_per_week": profile.hours_per_week,
                "timeline": profile.timeline,
                "expected_income": profile.expected_income,
            }

        result.append(user_data)

    return {
        "users": result,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page
    }


@app.get("/admin/users/{user_id}")
async def admin_get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_admin)
):
    """Get detailed view of a single user including learning path, test history, and video progress."""
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    path = db.query(LearningPath).filter(LearningPath.user_id == user_id).first()
    phases = db.query(PhaseProgress).filter(PhaseProgress.user_id == user_id).order_by(PhaseProgress.phase_index).all()
    test_attempts = db.query(TestAttempt).filter(TestAttempt.user_id == user_id).order_by(desc(TestAttempt.created_at)).all()
    video_progress = db.query(VideoProgress).filter(VideoProgress.user_id == user_id).all()

    # Parse learning path
    learning_path_data = None
    if path:
        try:
            learning_path_data = json.loads(path.path_data)
        except:
            pass

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "is_admin": user.is_admin,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
        "profile": {
            "desired_role": profile.desired_role if profile else None,
            "skills": json.loads(profile.skills) if profile and profile.skills else [],
            "certifications": json.loads(profile.certifications) if profile and profile.certifications else [],
            "education_level": profile.education_level if profile else None,
            "location": profile.location if profile else None,
            "current_status": profile.current_status if profile else None,
            "learning_pace": profile.learning_pace if profile else None,
            "hours_per_week": profile.hours_per_week if profile else None,
            "timeline": profile.timeline if profile else None,
            "expected_income": profile.expected_income if profile else None,
            "preferred_industries": json.loads(profile.preferred_industries) if profile and profile.preferred_industries else [],
        } if profile else None,
        "learning_path": learning_path_data,
        "phase_progress": [
            {
                "phase_index": p.phase_index,
                "is_unlocked": p.is_unlocked,
                "is_completed": p.is_completed,
                "test_passed": p.test_passed,
                "best_score": p.best_score,
            }
            for p in phases
        ],
        "test_history": [
            {
                "phase_index": t.phase_index,
                "score": t.score,
                "passed": t.passed,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in test_attempts
        ],
        "video_progress": [
            {
                "video_id": v.video_id,
                "completion_percent": round(v.completion_percent, 1),
                "is_completed": v.is_completed,
                "watched_seconds": v.watched_seconds,
                "cheat_flags": v.cheat_flags,
                "started_at": v.started_at.isoformat() if v.started_at else None,
                "completed_at": v.completed_at.isoformat() if v.completed_at else None,
            }
            for v in video_progress
        ]
    }


@app.patch("/admin/users/{user_id}/toggle-active")
async def admin_toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_admin)
):
    """Activate or deactivate a user account."""
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    user.is_active = not user.is_active
    db.commit()
    log_admin_action(db, current_user.id, "toggle_user_active", "user", user_id,
                     json.dumps({"new_status": user.is_active}))
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}


@app.patch("/admin/users/{user_id}/toggle-admin")
async def admin_toggle_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_admin)
):
    """Grant or revoke admin privileges."""
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own admin status")

    user.is_admin = not user.is_admin
    db.commit()
    log_admin_action(db, current_user.id, "toggle_admin", "user", user_id,
                     json.dumps({"new_admin_status": user.is_admin}))
    return {"message": f"Admin {'granted' if user.is_admin else 'revoked'}", "is_admin": user.is_admin}


# ============================================================
# ADMIN - VIDEO ASSIGNMENT MANAGEMENT
# ============================================================

@app.post("/admin/videos")
async def admin_create_video(
    video_data: dict,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_admin)
):
    """Create a new video assignment."""
    title = video_data.get("title", "").strip()
    youtube_url = video_data.get("youtube_url", "").strip()
    description = video_data.get("description", "").strip()
    duration_seconds = video_data.get("duration_seconds", 0)
    category = video_data.get("category", "").strip()

    if not title or not youtube_url:
        raise HTTPException(status_code=400, detail="Title and YouTube URL are required")

    try:
        video_id = extract_youtube_id(youtube_url)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    video = VideoAssignment(
        title=title,
        youtube_url=youtube_url,
        youtube_video_id=video_id,
        description=description,
        duration_seconds=duration_seconds,
        category=category or None,
        assigned_by=current_user.id,
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    log_admin_action(db, current_user.id, "create_video", "video", video.id,
                     json.dumps({"title": title}))
    return {"message": "Video created", "video_id": video.id}


@app.get("/admin/videos")
async def admin_list_videos(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_admin)
):
    """List all video assignments with progress stats."""
    videos = db.query(VideoAssignment).order_by(desc(VideoAssignment.created_at)).all()

    result = []
    for v in videos:
        # Get progress stats
        progress_records = db.query(VideoProgress).filter(VideoProgress.video_id == v.id).all()
        total_assigned = len(progress_records)
        completed_count = sum(1 for p in progress_records if p.is_completed)
        avg_completion = round(sum(p.completion_percent for p in progress_records) / total_assigned, 1) if total_assigned > 0 else 0
        cheat_flags_total = sum(p.cheat_flags for p in progress_records)

        # Get assigned users count
        assignments = db.query(UserVideoAssignment).filter(UserVideoAssignment.video_id == v.id).count()

        result.append({
            "id": v.id,
            "title": v.title,
            "youtube_url": v.youtube_url,
            "youtube_video_id": v.youtube_video_id,
            "description": v.description,
            "duration_seconds": v.duration_seconds,
            "category": v.category,
            "is_active": v.is_active,
            "created_at": v.created_at.isoformat() if v.created_at else None,
            "stats": {
                "assigned_users": assignments,
                "started": total_assigned,
                "completed": completed_count,
                "avg_completion": avg_completion,
                "cheat_flags": cheat_flags_total,
            }
        })

    return {"videos": result}


@app.post("/admin/videos/{video_id}/assign")
async def admin_assign_video(
    video_id: int,
    assignment_data: dict,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_admin)
):
    """Assign a video to specific users or all users."""
    video = db.query(VideoAssignment).filter(VideoAssignment.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    user_ids = assignment_data.get("user_ids", [])  # Empty = assign to all
    due_date_str = assignment_data.get("due_date")
    is_mandatory = assignment_data.get("is_mandatory", True)

    due_date = None
    if due_date_str:
        try:
            due_date = datetime.fromisoformat(due_date_str)
        except:
            pass

    assigned_count = 0

    if not user_ids:
        # Assign to all non-admin users
        all_users = db.query(UserDB).filter(UserDB.is_admin == False).all()
        user_ids = [u.id for u in all_users]

    for uid in user_ids:
        # Check if already assigned
        existing = db.query(UserVideoAssignment).filter(
            UserVideoAssignment.video_id == video_id,
            UserVideoAssignment.user_id == uid
        ).first()
        if not existing:
            assignment = UserVideoAssignment(
                video_id=video_id,
                user_id=uid,
                due_date=due_date,
                is_mandatory=is_mandatory,
            )
            db.add(assignment)

            # Initialize progress record
            existing_progress = db.query(VideoProgress).filter(
                VideoProgress.video_id == video_id,
                VideoProgress.user_id == uid
            ).first()
            if not existing_progress:
                progress = VideoProgress(user_id=uid, video_id=video_id)
                db.add(progress)
            assigned_count += 1

    db.commit()
    log_admin_action(db, current_user.id, "assign_video", "video", video_id,
                     json.dumps({"user_ids": user_ids, "count": assigned_count}))
    return {"message": f"Video assigned to {assigned_count} users", "assigned_count": assigned_count}


@app.get("/admin/videos/{video_id}/progress")
async def admin_video_progress(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_admin)
):
    """Get detailed progress for a specific video across all users."""
    video = db.query(VideoAssignment).filter(VideoAssignment.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    progress_records = db.query(VideoProgress).filter(VideoProgress.video_id == video_id).all()

    user_progress = []
    for p in progress_records:
        user = db.query(UserDB).filter(UserDB.id == p.user_id).first()
        user_progress.append({
            "user_id": p.user_id,
            "username": user.username if user else "Unknown",
            "email": user.email if user else "",
            "watched_seconds": p.watched_seconds,
            "completion_percent": round(p.completion_percent, 1),
            "is_completed": p.is_completed,
            "cheat_flags": p.cheat_flags,
            "total_pauses": p.total_pauses,
            "started_at": p.started_at.isoformat() if p.started_at else None,
            "completed_at": p.completed_at.isoformat() if p.completed_at else None,
            "last_heartbeat": p.last_heartbeat.isoformat() if p.last_heartbeat else None,
        })

    return {
        "video": {
            "id": video.id,
            "title": video.title,
            "duration_seconds": video.duration_seconds,
        },
        "progress": user_progress
    }


@app.delete("/admin/videos/{video_id}")
async def admin_delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_admin)
):
    """Delete a video assignment."""
    video = db.query(VideoAssignment).filter(VideoAssignment.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    db.delete(video)
    db.commit()
    log_admin_action(db, current_user.id, "delete_video", "video", video_id,
                     json.dumps({"title": video.title}))
    return {"message": "Video deleted"}


# ============================================================
# STUDENT - VIDEO ASSIGNMENTS (accessed by regular users)
# ============================================================

@app.get("/my-assignments")
async def get_my_assignments(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    """Get videos assigned to the current user."""
    assignments = db.query(UserVideoAssignment).filter(
        UserVideoAssignment.user_id == current_user.id
    ).all()

    result = []
    for a in assignments:
        video = db.query(VideoAssignment).filter(VideoAssignment.id == a.video_id, VideoAssignment.is_active == True).first()
        if not video:
            continue

        progress = db.query(VideoProgress).filter(
            VideoProgress.user_id == current_user.id,
            VideoProgress.video_id == video.id
        ).first()

        result.append({
            "assignment_id": a.id,
            "video_id": video.id,
            "title": video.title,
            "youtube_url": video.youtube_url,
            "youtube_video_id": video.youtube_video_id,
            "description": video.description,
            "duration_seconds": video.duration_seconds,
            "category": video.category,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "is_mandatory": a.is_mandatory,
            "watched_seconds": progress.watched_seconds if progress else 0,
            "completion_percent": round(progress.completion_percent, 1) if progress else 0,
            "is_completed": progress.is_completed if progress else False,
        })

    return {"assignments": result}


@app.post("/video-progress/heartbeat")
async def video_heartbeat(
    request: Request,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    """
    Anti-cheat video watching heartbeat.
    Frontend sends this every 5 seconds while watching.
    Validates that watching is legitimate (no fast-forwarding beyond threshold).
    """
    payload = await request.json()
    video_id = payload.get("video_id")
    # Accept both field names for compatibility
    current_time = payload.get("current_time") or payload.get("current_position", 0)
    event_type = payload.get("event_type", "heartbeat")
    is_playing = payload.get("is_playing", event_type not in ("pause", "ended"))
    session_watched = payload.get("session_watched", 5 if is_playing else 0)  # Default ~5s per heartbeat interval

    if not video_id:
        raise HTTPException(status_code=400, detail="video_id required")

    video = db.query(VideoAssignment).filter(VideoAssignment.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    progress = db.query(VideoProgress).filter(
        VideoProgress.user_id == current_user.id,
        VideoProgress.video_id == video_id
    ).first()

    if not progress:
        progress = VideoProgress(user_id=current_user.id, video_id=video_id)
        db.add(progress)
        db.flush()

    now = datetime.now(timezone.utc)

    # Anti-cheat: detect if user jumped too far ahead (>15 seconds beyond max_position)
    if current_time > progress.max_position + 15:
        progress.cheat_flags += 1
        # Don't update max_position for cheated seeks
    else:
        # Legitimate watching - update max position
        if current_time > progress.max_position:
            progress.max_position = int(current_time)

    # Update watched seconds (only count legitimate time)
    if is_playing and session_watched > 0:
        # Sanity check: session_watched shouldn't be more than heartbeat interval + buffer
        legitimate_increment = min(session_watched, 8)  # Max 8s per 5s heartbeat (with tolerance)
        progress.watched_seconds = min(
            progress.watched_seconds + int(legitimate_increment),
            video.duration_seconds  # Can't exceed video length
        )

    if not is_playing:
        progress.total_pauses += 1

    # Calculate completion based on max legitimate position
    if video.duration_seconds > 0:
        progress.completion_percent = min(
            (progress.max_position / video.duration_seconds) * 100,
            100.0
        )

    # Mark as completed if >90% watched legitimately
    if progress.completion_percent >= 90 and not progress.is_completed:
        progress.is_completed = True
        progress.completed_at = now

    progress.last_heartbeat = now
    db.commit()

    return {
        "watched_seconds": progress.watched_seconds,
        "max_position": progress.max_position,
        "completion_percent": round(progress.completion_percent, 1),
        "is_completed": progress.is_completed,
        "cheat_flags": progress.cheat_flags,
    }


# ============================================================
# ADMIN - MAKE USER ADMIN (utility endpoint)
# ============================================================

@app.post("/make-admin")
async def make_first_admin(
    request: Request,
    db: Session = Depends(get_db)
):
    """One-time setup to make a user admin. Only works if no admins exist yet."""
    payload = await request.json()
    admin_count = db.query(func.count(UserDB.id)).filter(UserDB.is_admin == True).scalar()
    if admin_count > 0:
        raise HTTPException(status_code=403, detail="Admin already exists. Use admin panel to manage admins.")

    email = payload.get("email", "").strip()
    secret = payload.get("secret", "").strip()

    if secret != os.getenv("SECRET_KEY"):
        raise HTTPException(status_code=403, detail="Invalid secret")

    user = db.query(UserDB).filter(UserDB.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_admin = True
    db.commit()
    return {"message": f"User {user.username} is now an admin"}


@app.get("/admin/activity-log")
async def admin_activity_log(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_admin)
):
    """Get admin activity audit log."""
    total = db.query(func.count(AdminActivityLog.id)).scalar()
    logs = db.query(AdminActivityLog).order_by(desc(AdminActivityLog.created_at)).offset((page - 1) * per_page).limit(per_page).all()

    result = []
    for log in logs:
        admin = db.query(UserDB).filter(UserDB.id == log.admin_id).first()
        result.append({
            "id": log.id,
            "admin_name": admin.username if admin else "Unknown",
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "details": log.details,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        })

    return {"logs": result, "total": total, "page": page}


# ── DEV: one-time admin setup (remove in production) ──────────────────
@app.post("/dev/create-admin")
async def dev_create_admin(db: Session = Depends(get_db)):
    """Creates a default admin account. Only works if no admin exists."""
    from auth import hash_password
    from sqlalchemy import text, inspect as sa_inspect

    # Auto-add missing columns to existing tables
    inspector = sa_inspect(db.bind)
    user_cols = [c["name"] for c in inspector.get_columns("users")]
    if "is_admin" not in user_cols:
        db.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE"))
        db.commit()

    # Create new tables (video_assignments, etc.)
    from db.database import Base, engine
    Base.metadata.create_all(bind=engine)

    admin_count = db.query(func.count(UserDB.id)).filter(UserDB.is_admin == True).scalar()
    if admin_count > 0:
        raise HTTPException(status_code=403, detail="Admin already exists")
    existing = db.query(UserDB).filter(UserDB.email == "admin@skillvector.com").first()
    if existing:
        existing.is_admin = True
        db.commit()
        return {"email": "admin@skillvector.com", "password": "(your existing password)", "message": "Existing user promoted to admin"}
    hashed = hash_password("admin123")
    admin = UserDB(username="admin", email="admin@skillvector.com", hashed_password=hashed, is_admin=True, is_active=True)
    db.add(admin)
    db.commit()
    return {"email": "admin@skillvector.com", "password": "admin123", "message": "Admin user created"}
