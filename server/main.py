from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import init_db
from market.load_onet import load_onet_data
from config import ONET_CACHE
from dotenv import load_dotenv
import os

# Route imports
from routes.auth import router as auth_router
from routes.profile import router as profile_router
from routes.learning_path import router as learning_path_router
from routes.market_insights import router as market_insights_router
from routes.ai_assistant import router as ai_assistant_router
from routes.admin import router as admin_router
from routes.assignments import router as assignments_router

load_dotenv()
init_db()

app = FastAPI()
print(os.getenv("SECRET_KEY"))


@app.on_event("startup")
def load_onet():
    try:
        occupations_df, skills_df, tech_skills_df, knowledge_df, activities_df = load_onet_data()
        ONET_CACHE["occupations"] = occupations_df
        ONET_CACHE["skills"] = skills_df
        ONET_CACHE["tech_skills"] = tech_skills_df
        ONET_CACHE["knowledge"] = knowledge_df
        ONET_CACHE["activities"] = activities_df
        print(f"✅ O*NET data loaded ({len(tech_skills_df)} tech skills, {len(knowledge_df)} knowledge, {len(activities_df)} activities)")
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

# Include all routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(learning_path_router)
app.include_router(market_insights_router)
app.include_router(ai_assistant_router)
app.include_router(admin_router)
app.include_router(assignments_router)


@app.get("/")
async def read_root():
    return "ai learning path generator"
