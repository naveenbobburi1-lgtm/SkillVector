"""
Tests for RAG pipeline utilities: query planning, retrieval, and JSON cleaning.
"""
import pytest
from rag.retriever import clean_llm_json


class TestCleanLLMJson:
    def test_strips_markdown_fences(self):
        raw = '```json\n{"key": "value"}\n```'
        assert clean_llm_json(raw) == '{"key": "value"}'

    def test_strips_whitespace(self):
        raw = '  {"key": "value"}  '
        assert clean_llm_json(raw) == '{"key": "value"}'

    def test_plain_json_unchanged(self):
        raw = '{"key": "value"}'
        assert clean_llm_json(raw) == '{"key": "value"}'

    def test_markdown_fence_with_language(self):
        raw = '```json\n["a", "b"]\n```'
        result = clean_llm_json(raw)
        assert result.startswith("[")

    def test_empty_string(self):
        assert clean_llm_json("") == ""
