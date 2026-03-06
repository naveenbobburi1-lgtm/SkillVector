"""
Tests for the O*NET role matching logic and skill extraction.
"""
import pytest
import pandas as pd
from market.role_matcher import match_role_to_soc
from market.skill_extractor import extract_top_skills, extract_top_knowledge, extract_top_activities
from market.insights_engine import generate_market_insights, _normalise, _user_covers_skill


# ---- Fixtures ----

@pytest.fixture
def sample_occupations_df():
    return pd.DataFrame({
        "O*NET-SOC Code": [
            "15-1252.00", "15-2051.00", "15-1254.00",
            "11-2021.00", "15-1251.00"
        ],
        "Title": [
            "Software Developers", "Data Scientists", "Web Developers",
            "Marketing Managers", "Computer Programmers"
        ],
    })


@pytest.fixture
def sample_tech_skills_df():
    return pd.DataFrame({
        "O*NET-SOC Code": [
            "15-1252.00", "15-1252.00", "15-1252.00",
            "15-2051.00", "15-2051.00",
        ],
        "Example": ["Python", "JavaScript", "Git", "Python", "R"],
        "Hot Technology": ["Y", "Y", "N", "Y", "N"],
        "In Demand": ["Y", "Y", "Y", "Y", "N"],
    })


@pytest.fixture
def sample_knowledge_df():
    return pd.DataFrame({
        "O*NET-SOC Code": ["15-1252.00", "15-1252.00"],
        "Element Name": ["Computers and Electronics", "Mathematics"],
        "Scale ID": ["IM", "IM"],
        "Data Value": [4.5, 3.8],
    })


@pytest.fixture
def sample_activities_df():
    return pd.DataFrame({
        "O*NET-SOC Code": ["15-1252.00", "15-1252.00"],
        "Element Name": ["Interacting With Computers", "Analyzing Data"],
        "Scale ID": ["IM", "IM"],
        "Data Value": [4.8, 4.2],
    })


# ---- Role Matching Tests ----

class TestRoleMatching:
    def test_exact_known_mapping(self, sample_occupations_df):
        result = match_role_to_soc("software engineer", sample_occupations_df)
        assert result is not None
        soc_code, title = result
        assert "15-1252" in soc_code
        assert "Software" in title

    def test_known_mapping_full_stack(self, sample_occupations_df):
        result = match_role_to_soc("full stack developer", sample_occupations_df)
        assert result is not None
        assert "Software" in result[1]

    def test_known_mapping_frontend(self, sample_occupations_df):
        result = match_role_to_soc("frontend developer", sample_occupations_df)
        assert result is not None
        assert "Web" in result[1]

    def test_fuzzy_match_data_scientist(self, sample_occupations_df):
        result = match_role_to_soc("Data Scientist", sample_occupations_df)
        assert result is not None
        assert "Data" in result[1]

    def test_no_match_returns_none(self, sample_occupations_df):
        result = match_role_to_soc("Underwater Basket Weaver", sample_occupations_df)
        assert result is None

    def test_case_insensitive(self, sample_occupations_df):
        result = match_role_to_soc("SOFTWARE ENGINEER", sample_occupations_df)
        assert result is not None


# ---- Skill Extraction Tests ----

class TestSkillExtraction:
    def test_extract_top_skills_basic(self, sample_tech_skills_df):
        skills = extract_top_skills("15-1252.00", sample_tech_skills_df, top_n=5)
        assert isinstance(skills, list)
        assert len(skills) > 0
        assert "Python" in skills

    def test_hot_tech_prioritized(self, sample_tech_skills_df):
        skills = extract_top_skills("15-1252.00", sample_tech_skills_df, top_n=3)
        # Hot Technology items should come first
        assert skills[0] in ["Python", "JavaScript"]

    def test_empty_soc_returns_empty(self, sample_tech_skills_df):
        skills = extract_top_skills("99-9999.00", sample_tech_skills_df)
        assert skills == []

    def test_partial_soc_match(self, sample_tech_skills_df):
        skills = extract_top_skills("15-1252", sample_tech_skills_df)
        assert len(skills) > 0

    def test_extract_knowledge(self, sample_knowledge_df):
        knowledge = extract_top_knowledge("15-1252.00", sample_knowledge_df)
        assert len(knowledge) == 2
        assert "Computers and Electronics" in knowledge[0]

    def test_extract_activities(self, sample_activities_df):
        activities = extract_top_activities("15-1252.00", sample_activities_df)
        assert len(activities) == 2
        assert "Interacting With Computers" in activities[0]


# ---- Market Insights Tests ----

class TestMarketInsights:
    def test_normalise(self):
        assert _normalise("  Python  ") == "python"
        assert _normalise("Machine  Learning") == "machine learning"

    def test_user_covers_skill_exact(self):
        user_tokens = {"python", "javascript"}
        assert _user_covers_skill(user_tokens, "Python") is True

    def test_user_covers_skill_substring(self):
        user_tokens = {"microsoft excel"}
        assert _user_covers_skill(user_tokens, "Excel") is True

    def test_user_missing_skill(self):
        user_tokens = {"python"}
        assert _user_covers_skill(user_tokens, "Kubernetes") is False

    def test_generate_insights_full_coverage(self):
        result = generate_market_insights(
            ["Python", "JavaScript", "Git"],
            ["Python", "JavaScript", "Git"]
        )
        assert result["skill_coverage_percent"] == 100
        assert result["missing_skills"] == []

    def test_generate_insights_partial_coverage(self):
        result = generate_market_insights(
            ["Python"],
            ["Python", "JavaScript", "Git"]
        )
        assert result["skill_coverage_percent"] < 100
        assert "JavaScript" in result["missing_skills"]
        assert "Git" in result["missing_skills"]

    def test_generate_insights_no_skills(self):
        result = generate_market_insights([], ["Python"])
        assert result["skill_coverage_percent"] == 0
        assert result["missing_skills"] == ["Python"]

    def test_generate_insights_empty_market(self):
        result = generate_market_insights(["Python"], [])
        assert result["skill_coverage_percent"] == 0
        assert result["missing_skills"] == []
