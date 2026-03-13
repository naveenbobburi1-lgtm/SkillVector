"""
Real-time market data via Exa API.
Uses Exa's answer API to fetch job market data from the web.
"""

import os
import json
from rag.retriever import clean_llm_json


def fetch_realtime_market_data(role_name: str) -> dict:
    """
    Fetches real-time job market data for a role using Exa API.

    Returns:
        {
            "training_skills": [...],
            "growth_rate": str,
            "total_jobs": str,
            "starting_salary": str,
            "average_salary": str,
            "max_salary": str,
            "data_source": "realtime",
        }
    """
    exa_key = os.getenv("EXA_API_KEY")
    if not exa_key:
        return _fallback_realtime_data(role_name, "EXA_API_KEY not configured")

    try:
        from exa_py import Exa
        exa = Exa(api_key=exa_key)
    except ImportError:
        return _fallback_realtime_data(role_name, "exa-py not installed")
    except Exception as e:
        return _fallback_realtime_data(role_name, str(e))

    try:
        question = (
            f"For the job role '{role_name}', provide current US market data. "
            "Return ONLY valid JSON with these exact keys (use numbers from BLS, Indeed, Glassdoor, Payscale): "
            '{"training_skills": ["skill1", "skill2", ...], "growth_rate": "e.g. 8%", '
            '"total_jobs": "e.g. 500,000", "starting_salary": "e.g. $55,000", '
            '"average_salary": "e.g. $95,000", "max_salary": "e.g. $180,000"}'
        )
        results = exa.answer(question)
        answer_text = getattr(results, "answer", None) or str(results)
        if not answer_text:
            return _fallback_realtime_data(role_name, "Exa answer returned empty")

        data = json.loads(clean_llm_json(answer_text))
        data["data_source"] = "realtime"
        return data
    except json.JSONDecodeError as e:
        return _fallback_realtime_data(role_name, f"Invalid JSON from Exa: {e}")
    except Exception as e:
        return _fallback_realtime_data(role_name, str(e))


def _fallback_realtime_data(role_name: str, reason: str) -> dict:
    """Fallback when Exa/LLM fails - use reasonable defaults based on role."""
    return {
        "training_skills": [
            "Communication", "Problem Solving", "Technical Skills",
            "Data Analysis", "Project Management", "Continuous Learning"
        ],
        "growth_rate": "N/A",
        "total_jobs": "N/A",
        "starting_salary": "N/A",
        "average_salary": "N/A",
        "max_salary": "N/A",
        "data_source": "static",
        "fallback_reason": reason,
    }
