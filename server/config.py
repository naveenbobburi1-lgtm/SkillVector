# Shared application state and constants

ONET_CACHE = {}

MARKET_INSIGHTS_TTL_HOURS = 24  # Cache market insights for 24 hours

# RAG pipeline limits
RAG_MAX_SOURCES = 40
RAG_CONTEXT_CHAR_LIMIT = 12000

# LLM defaults
LLM_MODEL = "llama-3.3-70b-versatile"
LLM_TEMPERATURE = 0.2

# Test configuration
TEST_PASSING_SCORE = 70  # percent
TEST_QUESTIONS_COUNT = 15

# Video anti-cheat
VIDEO_HEARTBEAT_INTERVAL_SECONDS = 5
VIDEO_MAX_SEEK_TOLERANCE_SECONDS = 15
