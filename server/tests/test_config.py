"""
Tests for config constants and cache service logic.
"""
import pytest
from config import (
    MARKET_INSIGHTS_TTL_HOURS,
    RAG_MAX_SOURCES,
    RAG_CONTEXT_CHAR_LIMIT,
    LLM_MODEL,
    LLM_TEMPERATURE,
    TEST_PASSING_SCORE,
    TEST_QUESTIONS_COUNT,
    VIDEO_HEARTBEAT_INTERVAL_SECONDS,
    VIDEO_MAX_SEEK_TOLERANCE_SECONDS,
)


class TestConfigConstants:
    def test_ttl_is_positive(self):
        assert MARKET_INSIGHTS_TTL_HOURS > 0

    def test_rag_limits_are_positive(self):
        assert RAG_MAX_SOURCES > 0
        assert RAG_CONTEXT_CHAR_LIMIT > 0

    def test_llm_model_is_set(self):
        assert isinstance(LLM_MODEL, str)
        assert len(LLM_MODEL) > 0

    def test_temperature_in_range(self):
        assert 0.0 <= LLM_TEMPERATURE <= 2.0

    def test_passing_score_valid(self):
        assert 0 < TEST_PASSING_SCORE <= 100

    def test_test_questions_count_positive(self):
        assert TEST_QUESTIONS_COUNT > 0

    def test_video_heartbeat_positive(self):
        assert VIDEO_HEARTBEAT_INTERVAL_SECONDS > 0

    def test_video_seek_tolerance_positive(self):
        assert VIDEO_MAX_SEEK_TOLERANCE_SECONDS > 0
