from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from db.database import get_db
from db.models import UserDB, UserProfile, LearningPath, PhaseProgress, TestAttempt, ActiveTest, MarketInsightsCache
from auth import get_current_user
from rag.retriever import clean_llm_json
from rag.query_planner import generate_search_queries
from rag.batch_retriever import batch_retrieve
from market.role_matcher import match_role_to_soc
from market.skill_extractor import extract_top_skills, extract_top_knowledge, extract_top_activities
from services.cache_service import invalidate_market_insights_cache
from config import ONET_CACHE, RAG_MAX_SOURCES, RAG_CONTEXT_CHAR_LIMIT, LLM_MODEL, LLM_TEMPERATURE, TEST_PASSING_SCORE
from groq import Groq
import os
import json
import time

router = APIRouter()


@router.get("/generate-path")
async def generate_learning_path(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    if not profile:
        raise HTTPException(status_code=400, detail="User profile not found. Please complete your profile first.")

    # Return cached path if exists
    t_cache = time.time()
    existing_path = db.query(LearningPath).filter(LearningPath.user_id == current_user.id).first()
    if existing_path:
        print(f"[generate-path] DB cache HIT for user {current_user.id} in {time.time() - t_cache:.3f}s")
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

    t_total = time.time()
    print(f"[generate-path] no cached path for user {current_user.id} — starting full generation")
    # concurrent requests (e.g. React StrictMode double-fires useEffect).
    # pg_try_advisory_xact_lock is transaction-scoped — auto-released at
    # commit or rollback, so no explicit unlock is needed and it is safe
    # with connection pooling.
    lock_acquired = db.execute(
        text("SELECT pg_try_advisory_xact_lock(:uid)"),
        {"uid": current_user.id}
    ).scalar()

    if not lock_acquired:
        # Another request is already generating this path — wait for it then
        # return the result once it commits (poll with a short back-off).
        import asyncio
        for _ in range(60):               # max ~30s wait
            await asyncio.sleep(0.5)
            db.expire_all()               # force re-read from DB
            ready = db.query(LearningPath).filter(
                LearningPath.user_id == current_user.id
            ).first()
            if ready:
                path_json = json.loads(ready.path_data)
                existing_progress = db.query(PhaseProgress).filter(
                    PhaseProgress.user_id == current_user.id
                ).count()
                if existing_progress == 0:
                    from utils.test_generator import initialize_phase_progress
                    num_phases = len(path_json.get("learning_path", []))
                    if num_phases > 0:
                        initialize_phase_progress(current_user.id, num_phases, db)
                return path_json
        raise HTTPException(status_code=503, detail="Path generation in progress, please retry.")

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # Parse JSON fields safely
    raw_skills = json.loads(profile.skills) if profile.skills else []
    # Normalize skills: extract names for backward compatibility
    skills = [s["name"] if isinstance(s, dict) else s for s in raw_skills]
    # Build proficiency-aware skill descriptions for the LLM
    skills_with_proficiency = []
    for s in raw_skills:
        if isinstance(s, dict):
            skills_with_proficiency.append(f"{s['name']} ({s.get('proficiency', 'beginner')})")
        else:
            skills_with_proficiency.append(f"{s} (beginner)")
    industries = json.loads(profile.preferred_industries) if profile.preferred_industries else []
    learning_formats = json.loads(profile.learning_format) if profile.learning_format else []
    instruction_language = profile.language or "English"

    # ==================================================
    # RAG PIPELINE
    # ==================================================

    t_rag = time.time()
    try:
        search_queries = generate_search_queries(profile)
        web_context = await batch_retrieve(search_queries, max_sources=RAG_MAX_SOURCES)
    except Exception as e:
        print("RAG FAILED:", e)
        web_context = ""
    print(f"[generate-path] RAG pipeline:  {time.time() - t_rag:.3f}s")

    web_context = web_context[:RAG_CONTEXT_CHAR_LIMIT]

    # ==================================================
    # O*NET ROLE CONTEXT
    # ==================================================
    t_onet = time.time()
    role_context = ""
    onet_required_skills = []
    if "occupations" in ONET_CACHE:
        onet_match = match_role_to_soc(profile.desired_role, ONET_CACHE["occupations"])
        if onet_match:
            matched_soc, matched_title = onet_match
            knowledge_list = extract_top_knowledge(matched_soc, ONET_CACHE["knowledge"], top_n=8)
            activity_list = extract_top_activities(matched_soc, ONET_CACHE["activities"], top_n=8)
            onet_required_skills = extract_top_skills(matched_soc, ONET_CACHE["tech_skills"], top_n=15)
            parts = [f"O*NET Occupational Profile for \"{matched_title}\" (SOC {matched_soc}):"]
            if knowledge_list:
                parts.append("Key Knowledge Domains: " + "; ".join(knowledge_list))
            if activity_list:
                parts.append("Core Work Activities: " + "; ".join(activity_list))
            if onet_required_skills:
                parts.append("Required Technologies: " + ", ".join(onet_required_skills))
            role_context = "\n".join(parts)
    print(f"[generate-path] O*NET lookup:  {time.time() - t_onet:.3f}s")

    # Prompt Construction

    prompt = f"""
You are an AI system that generates structured learning paths.

CRITICAL INSTRUCTIONS:
- SKILL PROFICIENCY CALIBRATION: Each of the user's existing skills has a proficiency level (beginner, intermediate, advanced). Use these levels to calibrate the learning path depth per skill — skip fundamentals for advanced skills, provide deeper coverage for beginner skills, and bridge gaps for intermediate skills. Do NOT re-teach topics the user is already advanced in. Instead, focus on applying those advanced skills in the target role context.
- The generated path MUST fit exactly within the 'Target Timeline' specified by the user (e.g., if target is 3 months, total duration must be approx 3 months). Adjust the scope and depth of modules to fit this constraint.
- EDUCATION CALIBRATION: Use the user's education level to set the starting depth of the path. High School → include all fundamentals, assume no prior domain knowledge, explain concepts from scratch. Diploma → assume basic technical awareness, skip absolute beginner material. Undergraduate → assume solid domain foundations, skip fundamentals entirely, begin at intermediate. Postgraduate/PhD → assume deep theoretical knowledge, focus on advanced specialization and application. The meta.level field must reflect this (Beginner / Intermediate / Advanced).
- CAREER TRANSITION: If the user is currently employed or self-employed and their current role differs from the target role, this is a CAREER TRANSITION. Analyze the user's current role and industry to identify TRANSFERABLE SKILLS (e.g., project management, communication, domain knowledge, analytical thinking) that can accelerate the transition. Start the learning path by bridging from what they already know in their current role. Acknowledge their professional experience and leverage it — do NOT treat them as absolute beginners. In the first phase, explicitly connect their existing professional skills to the target role. For example, a Business Development Manager transitioning to DevOps already has stakeholder management, process optimization, and cross-team collaboration skills that map to DevOps culture and CI/CD pipeline management.
- RESOURCE LANGUAGE: The user prefers learning resources in '{instruction_language}'. When selecting from SOURCES, prioritize courses, videos, articles, and tutorials that are in {instruction_language} or have {instruction_language} subtitles/dubbing available. If {instruction_language} resources are unavailable in SOURCES, fall back to English. All learning path structure text (phase names, why_this_phase, topics, objectives, tasks, project descriptions) must stay in English.
- CONTENT FORMAT: The user prefers these learning formats: {', '.join(learning_formats) if learning_formats else 'Any'}. Prioritize resources that match — if 'Video / Online' is preferred, favor video courses and YouTube playlists; if 'Text / Reading', favor articles and books; if 'Hands-on', favor interactive platforms and project-based resources; if 'Interactive / Labs', favor coding playgrounds, sandbox environments, and lab-based tutorials.
- INDUSTRY CONTEXT: The user is targeting the {', '.join(industries) if industries else 'general'} industry/industries. Tailor examples, projects, and use cases to these industries wherever relevant.
- INCOME TARGET: The user targets {profile.expected_income or 'unspecified'} annual income. Recommend resources and career milestones appropriate for that salary bracket.

IMPORTANT INSTRUCTIONS (STRICT):
- Use ONLY the resources provided in the SOURCES section.
- Do NOT invent links, platforms, or book names.
- If a resource is not present in SOURCES, do NOT include it.
- YouTube videos or playlists from SOURCES are allowed for Courses.
- NEVER repeat the same resource across different phases. Each phase MUST have unique resources that are not used in any other phase. If the same URL or title appears in Phase 1, it must NOT appear in Phase 2, Phase 3, etc. Distribute the available sources so each phase gets different, phase-appropriate resources.

SOURCES:
{web_context}

TASK:
Generate a highly personalized, comprehensive learning path for the following user.
Establish a clear logical progression.
{f'''
ROLE REQUIREMENTS (from O*NET occupational data — use this to calibrate which topics, skills, and knowledge areas the path must cover):
{role_context}
''' if role_context else ""}
{f'''MANDATORY SKILLS DISTRIBUTION:
The following is the official list of market-required technologies for this role. You MUST distribute ALL of these across the phases using their EXACT names in each phase's "skills" array. Every skill below must appear in at least one phase. You may also add other relevant skills, but these are required:
{json.dumps(onet_required_skills)}
''' if onet_required_skills else ""}
USER DETAILS:
- Target Role: {profile.desired_role}
- Current Education: {profile.education_level}
- Current Status: {profile.current_status}
{f'- Current Role: {profile.current_role}' if profile.current_role else ''}
{f'- Current Industry: {profile.current_industry}' if profile.current_industry else ''}
- Location: {profile.location}
- Existing Skills (with proficiency): {', '.join(skills_with_proficiency) if skills_with_proficiency else 'None'}
- Preferred Industries: {', '.join(industries) if industries else 'Not specified'}
- Expected Income: {profile.expected_income}
- Willing to Relocate: {profile.relocation}
- Learning Pace: {profile.learning_pace}
- Hours per Week: {profile.hours_per_week}
- Content Format Preference: {', '.join(learning_formats) if learning_formats else 'Not specified'}
- Instruction Language: {instruction_language}
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
3. "skills": Technologies/tools the user will learn in this phase. If MANDATORY SKILLS DISTRIBUTION was provided above, use those EXACT names (copy-paste). Distribute ALL mandatory skills across phases so that completing the entire path covers every one. You may add extra skills too.
4. "weekly_breakdown": Break down each phase into weekly focused goals (duration_weeks number of weeks). Each week should have specific learning objectives and practice tasks.
5. "resources": EXACTLY 6-8 per phase. Match the user's preferred content format ({', '.join(learning_formats) if learning_formats else 'any format'}):
   - 2-3 Courses (Coursera / Udemy / edX / YouTube) — prioritize if user prefers Video / Online
   - 2-3 Articles or Blogs — prioritize if user prefers Text / Reading
   - 1-2 Books — include if user prefers Text / Reading
6. "projects": MINIMUM 3-5 hands-on projects per phase with varying difficulty levels (Easy/Medium/Hard). Tie projects to the user's target industries: {', '.join(industries) if industries else 'general domain'}.
"""

    t_llm = time.time()
    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=LLM_TEMPERATURE,
        response_format={"type": "json_object"}
    )
    print(f"[generate-path] Groq LLM:      {time.time() - t_llm:.3f}s")

    content = response.choices[0].message.content
    content = clean_llm_json(content)

    try:
        path_json = json.loads(content)

        # Post-process: ensure O*NET required skills are distributed across phases
        if onet_required_skills and path_json.get("learning_path"):
            phases = path_json["learning_path"]
            # Collect all skills already present (lowercased for comparison)
            all_phase_skills_lower = set()
            for phase in phases:
                for sk in phase.get("skills", []):
                    all_phase_skills_lower.add(sk.lower().strip())

            # Find which O*NET skills are missing
            missing = [sk for sk in onet_required_skills if sk.lower().strip() not in all_phase_skills_lower]

            if missing:
                # Distribute missing skills evenly across phases
                for i, sk in enumerate(missing):
                    target_phase = phases[i % len(phases)]
                    if "skills" not in target_phase:
                        target_phase["skills"] = []
                    target_phase["skills"].append(sk)

            # Re-serialize with the patched skills
            content = json.dumps(path_json)

        # Upsert: another concurrent request may have already inserted a path
        # for this user during the long RAG pipeline. Use merge instead of add
        # so we always update rather than crash on the unique constraint.
        existing_path = db.query(LearningPath).filter(
            LearningPath.user_id == current_user.id
        ).first()
        if existing_path:
            existing_path.path_data = content
        else:
            db.add(LearningPath(user_id=current_user.id, path_data=content))
        db.commit()

        # Re-fetch the saved path to get the canonical version
        saved_path = db.query(LearningPath).filter(
            LearningPath.user_id == current_user.id
        ).first()
        path_json = json.loads(saved_path.path_data)

        # Initialize phase progress tracking
        num_phases = len(path_json.get("learning_path", []))
        if num_phases > 0:
            from utils.test_generator import initialize_phase_progress
            initialize_phase_progress(current_user.id, num_phases, db)

        print(f"[generate-path] TOTAL time:    {time.time() - t_total:.3f}s")
        return path_json

    except json.JSONDecodeError:
        return {
            "error": "Model returned invalid JSON",
            "raw_output": content
        }


@router.get("/phase-progress")
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


@router.get("/phase-test/{phase_index}")
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
        "passing_score": TEST_PASSING_SCORE
    }


@router.post("/submit-test")
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
    passed = score >= TEST_PASSING_SCORE

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

            # Add phase skills to user profile
            try:
                path = db.query(LearningPath).filter(LearningPath.user_id == current_user.id).first()
                if path:
                    path_data = json.loads(path.path_data)
                    learning_path = path_data.get("learning_path", [])
                    if phase_index < len(learning_path):
                        phase_skills = learning_path[phase_index].get("skills", [])
                        if phase_skills:
                            profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
                            if profile:
                                current_skills = json.loads(profile.skills) if profile.skills else []
                                # Normalize to extract names for comparison
                                current_skills_lower = [(s["name"] if isinstance(s, dict) else s).lower() for s in current_skills]
                                # Ensure all existing skills are in object format
                                normalized = [{"name": s, "proficiency": "beginner"} if isinstance(s, str) else s for s in current_skills]
                                new_skills_added = False
                                for skill in phase_skills:
                                    if skill.strip() and skill.lower() not in current_skills_lower:
                                        normalized.append({"name": skill.strip(), "proficiency": "beginner"})
                                        current_skills_lower.append(skill.lower())
                                        new_skills_added = True
                                if new_skills_added:
                                    profile.skills = json.dumps(normalized)
                                    # Invalidate market insights cache since skills changed
                                    invalidate_market_insights_cache(current_user.id, db)
                                    print(f"[Phase {phase_index} passed] Added {len(phase_skills)} skills to user {current_user.id} profile")
            except Exception as skill_err:
                print(f"Warning: Failed to add phase skills to profile: {skill_err}")

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


@router.post("/add-skill-and-regenerate-path")
async def add_skill_and_regenerate_path(
    skill_data: dict,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    """Add a new skill to profile and regenerate learning path"""
    skill = skill_data.get("skill", "").strip()
    proficiency = skill_data.get("proficiency", "beginner").strip()

    if not skill:
        raise HTTPException(status_code=400, detail="Skill name required")

    if proficiency not in ("beginner", "intermediate", "advanced"):
        proficiency = "beginner"

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile not found")

    # Add skill to profile
    current_skills = json.loads(profile.skills) if profile.skills else []
    # Normalize to object format
    normalized = []
    for s in current_skills:
        if isinstance(s, str):
            normalized.append({"name": s, "proficiency": "beginner"})
        else:
            normalized.append(s)

    if skill.lower() not in [s["name"].lower() for s in normalized]:
        normalized.append({"name": skill, "proficiency": proficiency})
        profile.skills = json.dumps(normalized)
        db.commit()

    # Delete existing learning path to force regeneration
    db.query(LearningPath).filter(LearningPath.user_id == current_user.id).delete()
    # Invalidate market insights cache (skills changed)
    db.query(MarketInsightsCache).filter(MarketInsightsCache.user_id == current_user.id).delete()
    db.commit()

    return {
        "message": "Skill added and path regeneration triggered",
        "skills": normalized,
        "regenerate_path": True
    }
