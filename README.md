# SkillVector

> **AI-Powered Career Intelligence Platform** — Personalized learning paths generated through a RAG pipeline, real-time labor market analytics via O\*NET, and adaptive skill gap analysis powered by Llama 3.3 70B.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/FastAPI-0.134-009688?logo=fastapi" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql" />
  <img src="https://img.shields.io/badge/Llama%203.3-70B-purple" />
  <img src="https://img.shields.io/badge/O*NET-29.0-orange" />
  <img src="https://img.shields.io/badge/Three.js-0.182-black?logo=three.js" />
  <img src="https://img.shields.io/badge/Tests-48%20passing-brightgreen" />
</p>

---

## What is SkillVector?

SkillVector is a full-stack AI career intelligence system that bridges the gap between a user's current skill set and their target role. It goes beyond generic course recommendations by combining **Retrieval-Augmented Generation (RAG)**, **U.S. Department of Labor occupational data (O\*NET)**, and **LLM-powered analysis** to deliver:

- **Personalized, multi-phase learning roadmaps** — week-by-week plans with curated resources, projects, and milestones, grounded in real web sources (not hallucinated)
- **Real-time skill gap analysis** — fuzzy-matched against 1,000+ O\*NET occupations with Hot Technology prioritization
- **Adaptive progression** — phase-locked learning with LLM-generated tests; passing auto-updates your skill profile and recalculates market positioning
- **Anti-cheat video assignments** — heartbeat-verified watching with seek-skip detection
- **AI career assistant** — context-aware chatbot with web search that knows your learning path, skills, and current progress

---

## System Architecture

![System Architecture](assets/system_architecture_diagram.png)

The platform follows a three-tier architecture:

- **Frontend (Next.js 16)** — React 19 SPA with 3D landing experience, profile dashboard, learning path viewer, market insights, and admin panel
- **Backend (FastAPI)** — RESTful API with JWT auth, RAG pipeline, O\*NET integration, LLM orchestration, and anti-cheat systems
- **Data Layer** — PostgreSQL (10 tables), in-memory O\*NET cache (5 datasets), TTL-based market insights cache

---

## Core Features

### 1. RAG-Enhanced Learning Path Generation

![RAG Pipeline](assets/rag_pipeline.png)

A three-stage pipeline that generates grounded, source-attributed learning paths:

| Stage | Component | What it does |
|-------|-----------|-------------|
| **Query Planning** | `query_planner.py` | LLM generates 8–10 targeted search queries from the user's profile (role, skills, industries, preferred language) |
| **Web Retrieval** | `retriever.py` | Tavily Search API fetches 5 results per query, deduplicates by URL |
| **Batch Assembly** | `batch_retriever.py` | Runs all queries concurrently, deduplicates, caps at 40 sources / 12,000 chars |

The assembled web context is injected into the LLM prompt alongside O\*NET occupational data to produce a multi-phase roadmap with:
- Weekly breakdowns with specific topics
- Curated resources (courses, docs, videos) attributed to real sources
- Hands-on projects per phase
- Skill prerequisites and learning objectives

### 2. O\*NET Market Intelligence

![Market Insights Engine](assets/market_insights.png)

Real-time labor market analysis using the U.S. Department of Labor's O\*NET database (5 datasets loaded at startup):

| Dataset | Records | Usage |
|---------|---------|-------|
| Occupation Data | 1,000+ occupations | SOC code matching via fuzzy search + known tech role mappings |
| Technology Skills | Thousands | Hot Technology & In Demand skill extraction |
| Skills | Core competencies | Skill gap computation |
| Knowledge | Domain knowledge | Knowledge area requirements |
| Work Activities | Task descriptions | Activity-level matching |

**Pipeline:** User's desired role → fuzzy match to SOC code (with confidence thresholds: 0.7 high, 0.55 medium + cross-domain validation) → extract required tech skills (Hot Technology prioritized) → compute skill gap → LLM generates salary/demand/growth scores + trending analysis → results cached with 24h TTL.

For roles not in O\*NET, the system falls back to LLM-based skill extraction.

### 3. Adaptive Test & Progression System

- LLM generates **15 MCQs per phase** (5 Easy / 5 Medium / 5 Hard)
- **Server-side answer storage** — correct answers are never sent to the frontend; scoring happens on the backend
- **70% passing threshold** — passing unlocks the next phase
- **Auto-skill integration** — on pass, phase skills are automatically added to the user's profile
- **Cache invalidation** — market insights are recalculated after new skills are added
- Multiple attempts allowed; test history tracked per user

### 4. Anti-Cheat Video Assignment System

- Admin creates YouTube video assignments (duration, category)
- Assigns to specific users or broadcasts to all (with due dates, mandatory flags)
- **Heartbeat verification** — frontend sends heartbeat every 5 seconds during playback
- **Seek-skip detection** — any jump >15 seconds beyond `max_position` triggers a cheat flag
- **Legitimate time tracking** — caps at 8s credit per 5s heartbeat interval
- Tracks `max_position`, `total_pauses`, `cheat_flags`
- Auto-completes at 90% legitimate watch time
- Admin dashboard shows per-user cheat flags and completion stats

### 5. AI Career Assistant

- Powered by **Groq Compound** model (built-in web search capability)
- **Context-aware** — injected with user's learning path phases, current skills, desired role, and active phase
- Maintains **conversation history** (last 10 messages)
- Returns answers with **web source citations**
- **Graceful fallback** — auto-switches to Llama 3.3 70B if Compound model fails
- Strict prompting: concise answers (6–8 sentences), beginner-friendly, always includes 3–5 resource links

### 6. 3D Interactive Landing Page

- Built with **Three.js** via React Three Fiber + Drei + Postprocessing
- **Framer Motion** animated storytelling overlay (5-scene auto-advancing sequence)
- **Zustand** state management for scene transitions
- Responsive design with progressive enhancement

---

## Authentication Flow

![Authentication Flow](assets/auth_flow.png)

| Method | Description |
|--------|-------------|
| **Google OAuth 2.0** | Primary auth — exchanges Google access token for SkillVector JWT, auto-creates account on first login |
| **Email/Password** | Traditional registration with bcrypt hashing |
| **JWT Sessions** | 7-day token expiry, `HS256` algorithm |

![Forgot Password Flow](assets/forgot_password_flow.png)

---

## Profile System

![Profile Setup Wizard](assets/profile_wizard.png)

**5-Step Profile Wizard:**

1. **Basic Info** — Name, age, education level
2. **Skills & Certifications** — Current technical skills, certifications held
3. **Career Goals** — Desired role, target industries, career timeline
4. **Learning Preferences** — Pace (slow/medium/fast), weekly hours, budget, preferred language
5. **Review & Submit** — Final confirmation before path generation

**Profile Dashboard ("Mission Control"):**

| Widget | Purpose |
|--------|---------|
| Career North Star | Overall career target score |
| Role Radar | 4-axis chart: salary, demand, skill match, growth potential |
| Skill DNA Matrix | Visual grid of current skills |
| Reality Gap Bridge | Missing skills visualization with priority ranking |
| Action Command | Floating command bar for quick actions (add skill, regenerate path) |

---

## Database Schema

![Database Schema](assets/database_schema.png)

**10 tables** designed for the full user lifecycle:

| Table | Purpose |
|-------|---------|
| `users` | Account data (email, hashed password, admin flag, active status) |
| `user_profiles` | 20+ fields: demographics, skills (JSON), certifications, career goals, learning preferences |
| `learning_paths` | AI-generated roadmaps stored as structured JSON |
| `phase_progress` | Per-phase unlock/completion/test tracking |
| `test_attempts` | Full test history (score, answers, pass/fail, timestamp) |
| `active_tests` | Server-side test question storage (anti-cheat) |
| `video_assignments` | Admin-created video content (YouTube URL, duration, category) |
| `user_video_assignments` | User-video mapping (due date, mandatory flag) |
| `video_progress` | Anti-cheat tracking (watched_seconds, max_position, cheat_flags, heartbeats) |
| `admin_activity_log` | Full audit trail of all admin actions |
| `market_insights_cache` | TTL-based cache (24h) for market analysis per user+role |

---

## Admin Panel

A full-featured admin dashboard with:

**Analytics Dashboard**
- KPI cards with animated counters and ring charts (total users, profiles, paths, tests, videos)
- 30-day registration trend chart
- Profile completion rate, path generation rate, test pass rate, average score
- Top desired roles and skills frequency analysis
- Phase completion distribution

**User Management**
- Paginated user list with search
- Per-user deep-dive: profile, learning path, phase progress, test history, video progress
- Activate/deactivate accounts, grant/revoke admin privileges

**Video Management**
- CRUD for video assignments
- Assign to individual users or broadcast to all
- Per-video progress tracking with cheat detection stats

**Activity Audit Log**
- Timestamped record of every admin action (actor, target, action type, details)

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | Next.js, React, TypeScript | 16.1, 19, 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **3D / Animation** | Three.js, React Three Fiber, Framer Motion | 0.182, 9.5, 12.x |
| **State Management** | Zustand | 5.x |
| **Backend** | FastAPI, Python | 0.134, 3.13 |
| **ORM** | SQLAlchemy, Pydantic v2 | 2.0, 2.12 |
| **Database** | PostgreSQL (Supabase) | 16 |
| **Auth** | Google OAuth 2.0, JWT (python-jose), bcrypt | — |
| **LLM** | Groq API — Llama 3.3 70B Versatile, Groq Compound | 1.0 |
| **Web Search** | Tavily Search API | — |
| **Market Data** | O\*NET (U.S. Dept. of Labor) | 29.0 |
| **PDF Export** | jsPDF + jspdf-autotable | 4.2, 5.0 |
| **Testing** | pytest | 9.0 |

---

## API Reference

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Create account (email/password) | No |
| POST | `/login` | Login, returns JWT | No |
| POST | `/auth/google` | Google OAuth token exchange | No |

### Profile
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/userdetails` | Create/update profile (20+ fields) | JWT |
| GET | `/user-profile` | Get current user's profile | JWT |
| GET | `/profile/analysis` | Full market analysis — O\*NET matching, skill gap, LLM outlook, Career North Star score | JWT |
| POST | `/profile-insights` | LLM-powered market insights (trending skills, salary, growth, sectors). TTL-cached | JWT |

### Learning Path
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/generate-path` | Generate (or return cached) AI learning path via RAG + O\*NET + LLM | JWT |
| GET | `/phase-progress` | Get unlock/completion status for all phases | JWT |
| GET | `/phase-test/{phase_index}` | Generate 15 MCQs for a phase (answers stored server-side) | JWT |
| POST | `/submit-test` | Submit answers, score, unlock next phase on pass (≥70%) | JWT |
| POST | `/add-skill-and-regenerate-path` | Add skill and trigger path regeneration | JWT |

### Market Insights
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/market-insights-test` | O\*NET skill gap analysis with TTL cache | JWT |

### AI Assistant
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/ai-assistant` | Context-aware AI chat with web search and source citations | JWT |

### Video Assignments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/my-assignments` | Get assigned videos with progress | JWT |
| POST | `/video-progress/heartbeat` | Anti-cheat heartbeat (5s interval) | JWT |

### Admin (13 endpoints)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/admin/login` | Admin login | No |
| GET | `/admin/me` | Current admin info | Admin |
| GET | `/admin/analytics` | Full analytics dashboard data | Admin |
| GET | `/admin/users` | Paginated user list with search | Admin |
| GET | `/admin/users/{id}` | User deep-dive (profile, path, tests, videos) | Admin |
| PATCH | `/admin/users/{id}/toggle-active` | Activate/deactivate user | Admin |
| PATCH | `/admin/users/{id}/toggle-admin` | Grant/revoke admin role | Admin |
| POST | `/admin/videos` | Create video assignment | Admin |
| GET | `/admin/videos` | List all videos with stats | Admin |
| POST | `/admin/videos/{id}/assign` | Assign video to users | Admin |
| GET | `/admin/videos/{id}/progress` | Per-user video progress + cheat flags | Admin |
| DELETE | `/admin/videos/{id}` | Delete video (cascade) | Admin |
| GET | `/admin/activity-log` | Paginated admin audit log | Admin |

---

## Testing

**48 tests** across 5 test modules:

```
tests/
├── test_auth.py           # 9 tests — bcrypt hashing, JWT creation/verification, token expiry
├── test_market.py         # 18 tests — role matching (exact, fuzzy, case-insensitive), skill extraction, gap analysis
├── test_rag.py            # 5 tests — LLM JSON cleaning (markdown fences, language identifiers)
├── test_config.py         # 8 tests — config constants validation
└── test_admin_service.py  # 6 tests — YouTube URL extraction (standard, short, embed, v/ format)
```

Run tests:
```bash
cd server
.\venv\Scripts\activate
pytest tests/ -v
```

---

## Project Structure

```
SkillVector/
├── frontend/                      # Next.js 16 + React 19 SPA
│   ├── app/
│   │   ├── page.tsx               # 3D landing page (Three.js)
│   │   ├── login/                 # Google OAuth login
│   │   ├── signup/                # Sign-up with onboarding flow
│   │   ├── profile/
│   │   │   ├── page.tsx           # Mission Control dashboard
│   │   │   └── setup/             # 5-step profile wizard
│   │   ├── learning-path/         # AI learning path viewer + tests
│   │   ├── market-insights/       # O*NET market intelligence + PDF export
│   │   ├── assignments/           # Video assignments with anti-cheat player
│   │   └── admin/                 # Admin panel (analytics, users, videos, logs)
│   ├── components/
│   │   ├── SkillUniverse/         # Three.js 3D experience components
│   │   ├── profile/               # Dashboard widgets (North Star, Radar, DNA Matrix, Gap Bridge)
│   │   ├── profile-setup/         # Wizard step components
│   │   ├── market/                # Skill gap chart, insight cards
│   │   ├── AIAssistant.tsx        # Floating chatbot UI
│   │   ├── TestModal.tsx          # MCQ test-taking modal
│   │   ├── TestResultModal.tsx    # Test results with explanations
│   │   └── VideoPlayer.tsx        # YouTube player with heartbeat integration
│   └── lib/
│       ├── auth.ts                # Auth utilities + token management
│       ├── types.ts               # TypeScript interfaces
│       ├── market.ts              # Market data utilities
│       └── exportReport.ts        # PDF report generation (jsPDF)
│
├── server/                        # FastAPI backend
│   ├── main.py                    # App entry point + lifespan (O*NET loading)
│   ├── config.py                  # Centralized constants (LLM model, thresholds, limits)
│   ├── auth.py                    # Password hashing + JWT management
│   ├── dependencies.py            # FastAPI dependency injection
│   ├── routes/
│   │   ├── auth.py                # Registration, login, Google OAuth
│   │   ├── profile.py             # Profile CRUD, analysis, skill/cert management
│   │   ├── learning_path.py       # Path generation, phase tests, skill progression
│   │   ├── market_insights.py     # O*NET skill gap analysis
│   │   ├── ai_assistant.py        # Context-aware AI chatbot
│   │   ├── assignments.py         # Video assignments + anti-cheat heartbeat
│   │   └── admin.py               # Full admin panel (analytics, users, videos, audit log)
│   ├── rag/
│   │   ├── query_planner.py       # LLM-generated search query planning
│   │   ├── retriever.py           # Tavily web search + JSON cleaning
│   │   └── batch_retriever.py     # Concurrent query execution + dedup
│   ├── market/
│   │   ├── load_onet.py           # O*NET dataset loader (5 TSV files → pandas DataFrames)
│   │   ├── role_matcher.py        # Fuzzy role → SOC code matching
│   │   ├── skill_extractor.py     # O*NET skill extraction (Hot Tech priority)
│   │   └── insights_engine.py     # Skill gap computation + LLM market outlook
│   ├── db/
│   │   ├── database.py            # SQLAlchemy engine + session factory
│   │   └── models.py              # 10 ORM models
│   ├── services/
│   │   ├── admin_service.py       # Admin business logic + YouTube ID extraction
│   │   └── cache_service.py       # TTL-based cache invalidation
│   ├── schemas/                   # Pydantic request/response schemas
│   ├── utils/
│   │   └── test_generator.py      # LLM-powered MCQ generation
│   ├── data/                      # O*NET dataset files (5 TSV files)
│   └── tests/                     # 48 pytest tests
│
└── assets/                        # Architecture & flow diagrams
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16
- API keys: [Groq](https://console.groq.com/), [Tavily](https://tavily.com/), [Google OAuth](https://console.cloud.google.com/)

### Backend Setup
```bash
cd server
python -m venv venv
.\venv\Scripts\activate          # Windows
source venv/bin/activate         # macOS/Linux
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, SECRET_KEY, GROQ_API_KEY, TAVILY_API_KEY

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

### Run Tests
```bash
cd server
.\venv\Scripts\activate
pytest tests/ -v
```

---

## Environment Variables

### Backend (`server/.env`)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `GROQ_API_KEY` | Groq API key for Llama 3.3 70B |
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
| **O\*NET over custom datasets** | Government-maintained, comprehensive (1,000+ occupations), free, updated quarterly |
| **Server-side test answers** | Prevents client-side cheating; answers only revealed after submission |
| **Heartbeat-based video tracking** | More reliable than event-based tracking; detects tab-switching and seek-skipping |
| **TTL cache for market insights** | Reduces LLM API costs; market data doesn't change minute-to-minute |
| **Lifespan context manager** | Modern FastAPI pattern; clean startup (O\*NET loading) and shutdown |
| **Centralized config constants** | Single source of truth for thresholds, model names, and limits |

---

<p align="center">Built for career transformation — not just course recommendations.</p>
