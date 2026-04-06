<div align="center">

# SkillVector

### AI-Powered Career Intelligence Platform

*Personalized learning paths through a production RAG pipeline, hybrid vector search, real-time O\*NET labor market analytics, and multi-model LLM orchestration.*

<br/>

<img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" />
<img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
<img src="https://img.shields.io/badge/FastAPI-0.134-009688?logo=fastapi" />
<img src="https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?logo=postgresql" />
<img src="https://img.shields.io/badge/Llama%203.3-70B-purple" />
<img src="https://img.shields.io/badge/Mistral-Embed-FF7000" />
<img src="https://img.shields.io/badge/O*NET-29.0-orange" />
<img src="https://img.shields.io/badge/Three.js-0.182-black?logo=three.js" />

</div>

---

## What is SkillVector?

SkillVector is not another course recommendation engine. It is a **full-stack AI career intelligence system** that analyzes a user's current skill set, maps it against real labor market data from the U.S. Department of Labor, and generates a deeply personalized, multi-phase learning roadmap — grounded in real web sources, not hallucinated content.

**The core differentiator:** Every learning path is built through a **production RAG pipeline** that retrieves, caches, and ranks live web resources using **hybrid vector search** (pgvector HNSW + metadata filtering), then orchestrates multiple LLM providers to produce week-by-week plans calibrated to the user's proficiency levels, time constraints, and preferred language.

---

## System Architecture

![System Architecture](assets/system_architecture_diagram.png)

| Layer | Stack | Role |
|-------|-------|------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind v4, React Three Fiber | SPA with 3D landing, profile dashboard, learning viewer, market insights, admin panel |
| **Backend** | FastAPI, Python 3.13, SQLAlchemy 2.0, Pydantic v2 | REST API with JWT auth, RAG pipeline, LLM orchestration, O\*NET integration |
| **Data** | PostgreSQL + pgvector (Supabase), HNSW indexes | 12 tables, hybrid vector search, TTL-based caching, advisory locks |
| **AI / LLM** | Groq (Llama 3.3 70B), Mistral (embeddings), Tavily (web search) | Multi-model orchestration with intelligent fallbacks |
| **Market Data** | O\*NET 29.0 (5 datasets, 1000+ occupations) | SOC code matching, Hot Technology extraction, skill gap analysis |

---

## Core Features

### 1. RAG-Enhanced Learning Path Generation

![RAG Pipeline](assets/rag_pipeline.png)

A **three-layer retrieval system** that prioritizes speed and avoids redundant API calls:

```
L0  In-Memory Cache     →  ~0ms    (dict keyed by role + sorted queries)
L1  pgvector Hybrid Search  →  1 DB round-trip  (HNSW cosine + B-tree metadata filter)
L2  Tavily Live Fetch    →  only for cache misses  (parallelized via asyncio.gather)
```

| Stage | Component | What it does |
|-------|-----------|-------------|
| **Query Planning** | `query_planner.py` | LLM generates 8–10 targeted search queries from user profile, cached for 30 days per role+industries+language hash |
| **Embedding** | `vector_cache.py` | Batched Mistral `mistral-embed` (1024-dim) with in-process cache — single API call for N queries |
| **Hybrid Search** | `vector_cache.py` | `WHERE target_role = :role AND cosine_similarity >= 0.90` — HNSW index + B-tree filter in ONE `UNION ALL` query |
| **Web Retrieval** | `batch_retriever.py` | Tavily fetch only for misses, with language-aware cache bypass for non-English queries |
| **Storage** | `vector_cache.py` | New sources persisted with role partitioning, 30-day TTL |

The assembled web context is injected into the LLM prompt alongside O\*NET occupational data to produce:
- **Week-by-week breakdowns** with specific learning objectives and practice tasks
- **Curated resources** (courses, articles, videos) attributed to real sources — never hallucinated
- **Hands-on projects** per phase with difficulty progression (Easy → Medium → Hard)
- **Proficiency-calibrated depth** — skips fundamentals for advanced skills, deep-dives for beginner skills

**Concurrency Safety:** `pg_try_advisory_xact_lock()` prevents duplicate path generation when React StrictMode double-fires requests.

---

### 2. O\*NET Market Intelligence Engine

![Market Insights](assets/market_insights.png)

Real-time labor market analysis using 5 U.S. Department of Labor datasets loaded at startup:

| Dataset | Usage |
|---------|-------|
| Occupation Data (1,000+ occupations) | SOC code matching via fuzzy search + known tech role mappings |
| Technology Skills | Hot Technology & In Demand skill extraction, autocomplete suggestions |
| Core Skills | Skill gap computation |
| Knowledge Domains | Knowledge area requirements for role context |
| Work Activities | Activity-level matching for LLM prompt enrichment |

**Pipeline:** User's desired role → fuzzy match to SOC code (confidence thresholds: 0.7 high, 0.55 medium + cross-domain validation) → extract required tech skills (Hot Technology prioritized) → compute skill gap → LLM generates salary/demand/growth analysis → results cached with TTL.

For roles not in O\*NET, the system falls back to LLM-based skill extraction.

---

### 3. Adaptive Test & Progression System

- LLM generates **15 MCQs per phase** (5 Easy / 5 Medium / 5 Hard)
- **Server-side answer storage** — correct answers never sent to the frontend; scoring happens on the backend
- **70% passing threshold** — passing unlocks the next phase
- **Auto-skill integration** — on pass, phase skills are automatically added to the user's profile
- **Cache invalidation cascade** — market insights are recalculated after new skills are added
- Multiple attempts allowed; full test history tracked per user

---

### 4. Anti-Cheat Video Assignment System

- **Heartbeat verification** — frontend sends heartbeat every 5 seconds during playback
- **Seek-skip detection** — any jump >15 seconds beyond `max_position` triggers a cheat flag
- **Legitimate time tracking** — caps at 8s credit per 5s heartbeat interval
- Auto-completes at 90% legitimate watch time
- Admin dashboard shows per-user cheat flags and completion stats

---

### 5. AI Career Assistant

- Powered by **Groq Compound** model (built-in web search)
- **Context-aware** — injected with learning path phases, current skills, desired role, and active progress
- Maintains **conversation history** (last 10 messages)
- Returns answers with **web source citations**
- **Graceful fallback** — auto-switches to Llama 3.3 70B if Compound model fails

---

### 6. 3D Interactive Landing (SkillUniverse)

- Built with **React Three Fiber** + Drei + Postprocessing (WebGL)
- **Framer Motion** animated storytelling overlay (5-scene auto-advancing sequence)
- **Zustand** state management for scene transitions
- Responsive design with progressive enhancement

---

## Authentication

![Authentication Flow](assets/auth_flow.png)

| Method | Description |
|--------|-------------|
| **Google OAuth 2.0** | Primary auth — server-side token verification via Google userinfo API, auto-creates account on first login |
| **Email/Password** | Traditional registration with bcrypt hashing |
| **JWT Sessions** | 7-day token expiry, `HS256` algorithm |

---

## Profile System

![Profile Setup Wizard](assets/profile_wizard.png)

**3-Step Streamlined Wizard:**

| Step | Name | Fields |
|------|------|--------|
| 1 | **Career Profile** | Desired role (with O\*NET autocomplete), target industries, education level, current status, current role/industry, location |
| 2 | **Competence Matrix** | Skills with proficiency levels (beginner/intermediate/advanced), real-time autocomplete from O\*NET Technology Skills |
| 3 | **Learning Preferences** | Timeline, learning velocity, hours per week, instruction language |

**Profile Dashboard ("Mission Control"):**

| Widget | Purpose |
|--------|---------|
| Career North Star | Overall career readiness score |
| Role Radar | 4-axis chart: salary, demand, skill match, growth potential |
| Skill DNA Matrix | Visual grid of current skills with proficiency |
| Reality Gap Bridge | Missing skills visualization with priority ranking |
| Action Command | Floating command bar for quick actions |

---

## Database Schema

![Database Schema](assets/database_schema.png)

**12 tables** with production-grade indexing:

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `users` | Accounts (email, hashed password, admin flag) | B-tree on email, username |
| `user_profiles` | Skills (JSON), career goals, learning preferences | B-tree on user_id |
| `learning_paths` | AI-generated roadmaps (structured JSON) | B-tree on user_id |
| `rag_source_cache` | Vector cache of web sources per query | **HNSW on query_embedding**, B-tree on target_role, created_at |
| `query_plan_cache` | Cached LLM-generated search query plans | B-tree on cache_key (SHA-256 hash) |
| `market_insights_cache` | TTL-based market analysis cache | Composite on (user_id, role) |
| `phase_progress` | Per-phase unlock/completion/test tracking | Composite on (user_id, phase_index) |
| `test_attempts` | Full test history (score, answers, pass/fail) | Composite on (user_id, phase_index) |
| `active_tests` | Server-side question storage (anti-cheat) | Composite on (user_id, phase_index) |
| `video_assignments` | Admin-created video content | B-tree on id |
| `video_progress` | Anti-cheat tracking (heartbeats, cheat flags) | Composite on (user_id, video_id) |
| `admin_activity_log` | Full audit trail of admin actions | B-tree on admin_id, created_at |

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | Next.js, React, TypeScript | 16.1, 19, 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **3D / Animation** | Three.js, React Three Fiber, Framer Motion | 0.182, 9.5, 12.x |
| **State** | Zustand | 5.x |
| **Backend** | FastAPI, Python | 0.134, 3.13 |
| **ORM** | SQLAlchemy, Pydantic v2 | 2.0, 2.12 |
| **Database** | PostgreSQL + pgvector(Supabase) | 16 |
| **Vector Search** | pgvector with HNSW indexes | 0.3.6 |
| **Embeddings** | Mistral Embed (1024-dim) | 1.12 |
| **LLM** | Groq — Llama 3.3 70B, Groq Compound | 1.0 |
| **Web Search** | Tavily Search API | — |
| **Auth** | Google OAuth 2.0, JWT (python-jose), bcrypt | — |
| **Market Data** | O\*NET (U.S. Dept. of Labor) | 29.0 |
| **PDF Export** | jsPDF + jspdf-autotable | 4.2, 5.0 |
| **Observability** | OpenTelemetry | 1.39 |

---

## API Reference

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Create account (email/password) | No |
| POST | `/login` | Login, returns JWT | No |
| POST | `/auth/google` | Google OAuth token exchange | No |

### Profile & Market Analysis
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/userdetails` | Create/update user profile | JWT |
| GET | `/user-profile` | Get current user's profile | JWT |
| GET | `/profile/analysis` | O\*NET matching + skill gap + LLM market outlook | JWT |
| POST | `/profile-insights` | LLM-powered trending skills, salary, growth (TTL-cached) | JWT |
| GET | `/suggestions/skills` | O\*NET Technology Skills autocomplete | JWT |
| GET | `/suggestions/roles` | O\*NET occupation title autocomplete | JWT |
| POST | `/add-skill` | Add skill to profile + invalidate caches | JWT |

### Learning Path
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/generate-path` | Generate AI learning path via RAG + O\*NET + LLM (advisory-locked) | JWT |
| GET | `/phase-progress` | Get unlock/completion status for all phases | JWT |
| GET | `/phase-test/{idx}` | Generate 15 MCQs (answers stored server-side) | JWT |
| POST | `/submit-test` | Submit answers, score, unlock next phase on pass (≥70%) | JWT |

### AI Assistant & Assignments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/ai-assistant` | Context-aware AI chat with web search citations | JWT |
| GET | `/my-assignments` | Get assigned videos with progress | JWT |
| POST | `/video-progress/heartbeat` | Anti-cheat heartbeat (5s interval) | JWT |

### Admin (13 endpoints)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/admin/login` | Admin login | No |
| GET | `/admin/analytics` | Full analytics dashboard data | Admin |
| GET | `/admin/users` | Paginated user list with search | Admin |
| GET | `/admin/users/{id}` | User deep-dive (profile, path, tests, videos) | Admin |
| PATCH | `/admin/users/{id}/toggle-active` | Activate/deactivate user | Admin |
| PATCH | `/admin/users/{id}/toggle-admin` | Grant/revoke admin role | Admin |
| POST | `/admin/videos` | Create video assignment | Admin |
| GET | `/admin/videos` | List all videos with stats | Admin |
| POST | `/admin/videos/{id}/assign` | Assign video to users | Admin |
| DELETE | `/admin/videos/{id}` | Delete video (cascade) | Admin |
| GET | `/admin/activity-log` | Paginated admin audit log | Admin |

---

## Project Structure

```
SkillVector/
├── frontend/                         # Next.js 16 + React 19
│   ├── app/
│   │   ├── page.tsx                  # 3D landing page (React Three Fiber)
│   │   ├── login/                    # Google OAuth + email login
│   │   ├── signup/                   # Registration with onboarding
│   │   ├── profile/
│   │   │   ├── page.tsx              # Mission Control dashboard
│   │   │   └── setup/               # 3-step profile wizard
│   │   ├── learning-path/            # AI learning path viewer + phase tests
│   │   ├── market-insights/          # O*NET market intelligence + PDF export
│   │   ├── assignments/              # Video assignments with anti-cheat player
│   │   └── admin/                    # Admin panel (analytics, users, videos, logs)
│   ├── components/
│   │   ├── SkillUniverse/            # Three.js 3D experience
│   │   ├── profile/                  # Dashboard widgets (North Star, Radar, DNA, Gap)
│   │   ├── profile-setup/            # Wizard steps (Step1Basic, Step2Skills, Step3Learning)
│   │   ├── market/                   # Skill gap charts, insight cards
│   │   ├── AIAssistant.tsx           # Floating AI chatbot
│   │   ├── TestModal.tsx             # MCQ test-taking modal
│   │   └── VideoPlayer.tsx           # YouTube player with heartbeat
│   └── lib/
│       ├── auth.ts                   # Auth utilities + token management
│       ├── types.ts                  # TypeScript interfaces
│       └── exportReport.ts           # PDF report generation (jsPDF)
│
├── server/                            # FastAPI backend
│   ├── main.py                       # App entry point + lifespan (O*NET loading)
│   ├── config.py                     # Centralized constants
│   ├── auth.py                       # Password hashing + JWT
│   ├── routes/
│   │   ├── auth.py                   # Registration, login, Google OAuth
│   │   ├── profile.py                # Profile CRUD, O*NET analysis, skill management
│   │   ├── learning_path.py          # Path generation, phase tests, skill progression
│   │   ├── market_insights.py        # O*NET skill gap analysis
│   │   ├── ai_assistant.py           # Context-aware AI chatbot
│   │   ├── assignments.py            # Video assignments + anti-cheat
│   │   └── admin.py                  # Admin panel (analytics, users, videos, audit)
│   ├── rag/
│   │   ├── query_planner.py          # LLM-generated search query planning
│   │   ├── retriever.py              # Tavily web search + JSON cleaning
│   │   ├── batch_retriever.py        # 3-layer retrieval (L0/L1/L2) + dedup
│   │   └── vector_cache.py           # pgvector hybrid search + Mistral embeddings
│   ├── market/
│   │   ├── load_onet.py              # O*NET dataset loader (5 TSV → pandas)
│   │   ├── role_matcher.py           # Fuzzy role → SOC code matching
│   │   ├── skill_extractor.py        # O*NET skill extraction (Hot Tech priority)
│   │   └── insights_engine.py        # Skill gap computation + LLM market outlook
│   ├── db/
│   │   ├── database.py               # SQLAlchemy engine + session factory
│   │   └── models.py                 # 12 ORM models (including pgvector)
│   ├── services/
│   │   ├── admin_service.py          # Admin business logic
│   │   └── cache_service.py          # TTL-based cache invalidation
│   ├── schemas/                      # Pydantic v2 request/response schemas
│   ├── utils/
│   │   └── test_generator.py         # LLM-powered MCQ generation
│   └── data/                         # O*NET dataset files (5 TSV files)
│
└── assets/                            # Architecture & flow diagrams
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16 with pgvector extension (or Supabase)
- API keys: [Groq](https://console.groq.com/), [Mistral](https://console.mistral.ai/), [Tavily](https://tavily.com/), [Google OAuth](https://console.cloud.google.com/)

### Backend Setup
```bash
cd server
python -m venv venv
.\venv\Scripts\activate          # Windows
source venv/bin/activate         # macOS/Linux
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, SECRET_KEY, GROQ_API_KEY, MISTRAL_API_KEY, TAVILY_API_KEY

# Run
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with NEXT_PUBLIC_API_URL and NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Run
npm run dev
```

---

## Environment Variables

### Backend (`server/.env`)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (with pgvector) |
| `SECRET_KEY` | JWT signing secret |
| `GROQ_API_KEY` | Groq API key for Llama 3.3 70B |
| `MISTRAL_API_KEY` | Mistral API key for embeddings |
| `TAVILY_API_KEY` | Tavily Search API key |
| `FRONTEND_URL` | Frontend origin for CORS |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID |

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **RAG over fine-tuning** | Learning resources change daily; RAG ensures freshness without retraining costs |
| **pgvector over Pinecone/Weaviate** | Cost efficiency, ACID compliance, relational + vector data colocated — no network egress to external vector DB |
| **Hybrid search (HNSW + B-tree)** | Metadata filtering (target_role) partitions the vector search space; standard production pattern for role-scoped retrieval |
| **3-layer cache (L0/L1/L2)** | In-memory → pgvector → Tavily. Eliminates redundant API calls; L0 hits return in ~0ms |
| **Advisory locks** | `pg_try_advisory_xact_lock()` prevents duplicate path generation from concurrent requests (React StrictMode double-fires) |
| **Language-aware cache bypass** | Non-English queries always hit Tavily because cached results are English content; prevents cross-language pollution |
| **O\*NET over custom datasets** | Government-maintained, 1,000+ occupations, free, updated quarterly |
| **Server-side test answers** | Anti-cheat: answers revealed only after submission |
| **OpenTelemetry tracing** | Production observability for LLM latency and RAG pipeline performance |
| **Multi-model orchestration** | Groq for generation (speed), Mistral for embeddings (quality), with automatic fallbacks |

---

<p align="center">
  <strong>Built for career transformation — not course recommendations.</strong>
</p>
