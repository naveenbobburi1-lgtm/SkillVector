# MCQ Test Generation and Management Functions
# These endpoints handle phase testing and progression

from sqlalchemy.orm import Session
from db.models import PhaseProgress
from config import LLM_MODEL

def generate_phase_mcqs(phase_data: dict, phase_index: int):
    """
    Generate 15 MCQs (5 easy, 5 medium, 5 hard) for a given phase using LLM.
    Returns list of MCQ objects with questions, options, correct_answer, difficulty.
    """
    from groq import Groq
    import os
    import json
    from rag.retriever import clean_llm_json
    
    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        topics = ", ".join(phase_data.get("topics", []))
        skills = ", ".join(phase_data.get("skills", []))
        phase_name = phase_data.get("phase", f"Phase {phase_index + 1}")
        
        prompt = f"""
        Generate 15 multiple-choice questions to test knowledge of the following learning phase:
        
        Phase: {phase_name}
        Topics: {topics}
        Skills: {skills}
        
        Create EXACTLY 15 questions:
        - 5 Easy: Basic concepts, definitions, simple recall
        - 5 Medium: Application of concepts, moderate analysis
        - 5 Hard: Advanced synthesis, problem-solving, deep understanding
        
        Return ONLY valid JSON with this structure:
        {{
          "questions": [
            {{
              "question": "Question text here?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct_answer": 0,
              "difficulty": "Easy",
              "explanation": "Brief explanation of the correct answer"
            }}
          ]
        }}
        
        IMPORTANT:
        - Make questions comprehensive and relevant to the topics
        - correct_answer should be the index (0-3) of the correct option
        - Ensure all 4 options are plausible
        - Mix up which option is correct (don't always use index 0)
        """
        
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        data = json.loads(clean_llm_json(content))
        
        return data.get("questions", [])
    
    except Exception as e:
        print(f"MCQ Generation Failed: {e}")
        # Fallback sample questions
        return [
            {
                "question": "This is a sample question for testing purposes?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": 0,
                "difficulty": "Easy",
                "explanation": "Test mode - questions will be generated when the system is fully configured."
            }
        ] * 15


def initialize_phase_progress(user_id: int, num_phases: int, db: Session):
    """
    Initialize phase progress tracking for a user.
    Only phase 0 is unlocked initially.
    """
    # Clear existing progress
    db.query(PhaseProgress).filter(PhaseProgress.user_id == user_id).delete()
    
    for i in range(num_phases):
        progress = PhaseProgress(
            user_id=user_id,
            phase_index=i,
            is_unlocked=(i == 0),  # Only first phase unlocked
            is_completed=False,
            test_passed=False
        )
        db.add(progress)
    
    db.commit()
