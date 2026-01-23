from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from db.database import get_db,init_db
from db.models import UserDB, UserProfile, ProfileDB, SkillDB, CertificationDB, CareerGoalDB, LearningPath
import schemas.UserSchemas as schemas
import schemas.ProfileSchemas as profile_schemas
from rag.retriever import clean_llm_json
from sqlalchemy.orm import Session
import os
from groq import Groq
import json
from dotenv import load_dotenv
from auth import hash_password,verify_password,create_access_token,get_current_user
from rag.query_planner import generate_search_queries
from rag.batch_retriever import batch_retrieve
from market.load_onet import load_onet_data
from market.role_matcher import match_role_to_soc
from market.skill_extractor import extract_top_skills
from market.insights_engine import generate_market_insights
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
async def read_root():
    return "ai learning path generator"  

@app.post("/register")
async def register_user(user:schemas.UserCreate,db:Session=Depends(get_db)):
    try:
        db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
        if db_user:
            return {"error": "Email already registered"}
        new_user = UserDB(
            username=user.username,
            email=user.email,
            hashed_password=hash_password(user.password)  
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e :
        print(str(e))
        return {"error": str(e)}
    return {"message": "User registered successfully", "user_id": new_user.id}

@app.post("/login")
async def login_user(user:schemas.UserLogin,db:Session=Depends(get_db)):
    db_user=db.query(UserDB).filter(UserDB.email==user.email).first()
    if not db_user or verify_password(user.password,db_user.hashed_password) == False:
        raise HTTPException(status_code=401,detail="Invalid credentials")
    access_token=create_access_token(data={"sub":db_user.email})   
    return {"access_token":access_token,"token_type":"bearer","user_id":db_user.id}

@app.get("/market-insights-test")
async def market_insights(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    if "occupations" not in ONET_CACHE:
        raise HTTPException(status_code=500, detail="O*NET data not loaded")

    occupations_df = ONET_CACHE["occupations"]
    skills_df = ONET_CACHE["skills"]

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")

    user_role = profile.desired_role
    user_skills = json.loads(profile.skills) if profile.skills else []

    match = match_role_to_soc(user_role, occupations_df)
    if not match:
        raise HTTPException(status_code=404, detail="Role not found in O*NET")

    soc_code, canonical_role = match
    market_skills = extract_top_skills(soc_code, skills_df)
    insights = generate_market_insights(user_skills, market_skills)

    return {
        "role": canonical_role,
        "soc_code": soc_code,
        "insights": insights
    }

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
        return json.loads(existing_path.path_data)

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
      "stage": string,
      "duration_months": number,
      "why_this_module": string,
      "topics": [string],
      "focus": [string],
      "skills": [string],
      "resources": [
        {{
          "type": "Course" | "Article" | "Book",
          "title": string,
          "platform": string,
          "link": string
        }}
      ],
      "projects": [
        {{
          "title": string,
          "description": string
        }}
      ]
    }}
  ]
}}

CRITICAL CONTENT REQUIREMENTS:
1. "why_this_module": Explain why this module is important and correctly placed.
2. "topics": 5–8 detailed sub-topics per module.
3. "resources": EXACTLY 5 per module:
   - 2 Courses (Coursera / Udemy / edX / YouTube)
   - 2 Articles or Blogs
   - 1 Book
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

        return path_json

    except json.JSONDecodeError:
        return {
            "error": "Model returned invalid JSON",
            "raw_output": content
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
        "budget_sensitivity": profile.budget_sensitivity
    }



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
            "budget_sensitivity": details.budget_sensitivity
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
    Their current skills are: {', '.join(skills)}.
    
    Provide a JSON response with the following market insights:
    1. "trending_skills": A list of 3-5 top trending skills they should learn next for this role.
    2. "role_growth": A percentage string (e.g. "+12%") representing estimated annual hiring growth for this role.
    3. "salary_insight": A short string comparing their target income of {profile.expected_income} to the market average (e.g. "Within market range" or "Above average").
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
            model="llama3-8b-8192",
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        content = completion.choices[0].message.content
        return json.loads(content)
        
    except Exception as e:
        print(f"Error generating insights: {e}")
        # Fallback data if AI fails
        return {
             "trending_skills": ["Cloud Architecture", "AI Integration", "Data Security"],
             "role_growth": "+8%",
             "salary_insight": "Market competitive",
             "market_outlook": "Steady demand with a shift towards hybrid specializations.",
             "hot_sectors": ["Fintech", "Healthcare"]
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
