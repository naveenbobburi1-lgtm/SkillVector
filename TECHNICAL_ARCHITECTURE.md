# SkillVector - Technical Architecture Guide

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Web Browser)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Next.js 16 React Application                │   │
│  │  - SkillUniverse 3D (Three.js visualization)        │   │
│  │  - Profile Wizard (5-step setup flow)               │   │
│  │  - Learning Path Display (timeline + resources)     │   │
│  │  - Market Insights Dashboard (role analytics)       │   │
│  └──────────────────────────────────────────────────────┘   │
│              ↓ (REST API via Fetch)                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│               API GATEWAY / LOAD BALANCING                   │
│  (Production: Nginx / AWS ALB)                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION SERVER LAYER                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         FastAPI + Uvicorn + Starlette               │   │
│  │                                                      │   │
│  │  ┌─ Auth Module ─┐                                 │   │
│  │  │ • Register    │                                 │   │
│  │  │ • Login       │                                 │   │
│  │  │ • JWT Token   │                                 │   │
│  │  │ • Password    │                                 │   │
│  │  │   Reset       │                                 │   │
│  │  └─────────────────┘                              │   │
│  │                                                    │   │
│  │  ┌─ Profile Module ─┐                            │   │
│  │  │ • User Profile   │                            │   │
│  │  │ • Skills         │                            │   │
│  │  │ • Goals          │                            │   │
│  │  │ • Certifications │                            │   │
│  │  └──────────────────┘                            │   │
│  │                                                    │   │
│  │  ┌─ RAG Pipeline ───────────────────────────┐     │   │
│  │  │ • Query Planner (LLM decomposition)      │     │   │
│  │  │ • Batch Retriever (Parallel fetching)    │     │   │
│  │  │ • LLM Synthesizer (Path generation)      │     │   │
│  │  │ • Source Attribution (URL tracking)      │     │   │
│  │  └───────────────────────────────────────────┘     │   │
│  │                                                    │   │
│  │  ┌─ Market Intelligence Module ──────────────┐   │   │
│  │  │ • Role Validator (O*NET lookup)           │   │   │
│  │  │ • Skills Extractor (Required skills)      │   │   │
│  │  │ • Market Insights Engine (Demand scoring) │   │   │
│  │  │ • Wage Analyzer (Salary trending)         │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                    │   │
│  │  ┌─ Middleware ─────────────────────────────────┐ │   │
│  │  │ • CORS Configuration                     │ │   │
│  │  │ • JWT Validation                         │ │   │
│  │  │ • Rate Limiting                          │ │   │
│  │  │ • Request/Response Logging               │ │   │
│  │  │ • Error Handling                         │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │                                                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│         (Async processing: 10k+ concurrent requests)     │
└─────────────────────────────────────────────────────────┘
              ↓ (SQL queries)    ↓ (HTTP requests)
┌───────────────────────┐     ┌──────────────────────────────┐
│  DATA PERSISTENCE     │     │   EXTERNAL AI & DATA SOURCES │
│                       │     │                              │
│  PostgreSQL           │     │  ┌─ Groq API ────────────┐  │
│  ┌───────────────────┐│     │  │ • Llama 3.3 70B       │  │
│  │ Users             ││     │  │ • Query Planning       │  │
│  │ Profiles          ││     │  │ • Path Generation      │  │
│  │ Skills            ││     │  │ • Market Analysis      │  │
│  │ Career Goals      ││     │  └────────────────────────┘  │
│  │ Learning Paths    ││     │                              │
│  │ Password Tokens   ││     │  ┌─ Tavily API ──────────┐  │
│  │ Certifications    ││     │  │ • Web Search           │  │
│  │                   ││     │  │ • Learning Resources   │  │
│  │ (Encrypted JSONB  ││     │  │ • Job Postings         │  │
│  │  for paths)       ││     │  └────────────────────────┘  │
│  └───────────────────┘│     │                              │
│                       │     │  ┌─ O*NET Data ──────────┐   │
│  Connection Pool: 5-10│     │  │ • Occupations          │   │
│  Indexes: 8          │     │  │ • Skills Required      │   │
│  Replicas: 1 (prod)  │     │  │ • Wage Data            │   │
│                       │     │  │ • Job Growth Trends    │   │
└───────────────────────┘     │  └────────────────────────┘   │
                              │                               │
                              └──────────────────────────────┘
```

---

## Data Flow Diagram

### User Registration & Login Flow

```
┌─────────────────────┐
│ User Submits Form   │
│ Email + Password    │
└──────────┬──────────┘
           │ (HTTPS POST)
           ▼
┌─────────────────────────────────────────┐
│ Backend: POST /register                 │
├─────────────────────────────────────────┤
│ 1. Validate email format                │
│ 2. Check for existing email             │
│ 3. Hash password (bcrypt, 10 rounds)    │
│ 4. Create user record in DB             │
│ 5. Return user_id + success message     │
└──────────────┬──────────────────────────┘
               │ (JSON response)
               ▼
┌─────────────────────┐
│ Frontend: Store ID  │
│ Ready for login     │
└─────────────────────┘
```

### Learning Path Generation Flow

```
┌─────────────────────────────────────────┐
│ User Completes Profile Wizard           │
│ • Skills (current)                      │
│ • Goal (desired role)                   │
│ • Constraints (time, budget)            │
└──────────────┬──────────────────────────┘
               │ (POST /generate-path with JWT)
               ▼
┌─────────────────────────────────────────┐
│ Backend Step 1: Goal Validation         │
├─────────────────────────────────────────┤
│ • Lookup goal in O*NET data             │
│ • Extract SOC code                      │
│ • Verify role exists & get metadata     │
│ • Return role_id + required_skills      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Backend Step 2: Query Planner (LLM)     │
├─────────────────────────────────────────┤
│ Input: Goal + user context              │
│ Process: Decompose into sub-queries     │
│ Output: ["What skills needed?",         │
│          "Best free resources?",        │
│          "Learning timeline?", ...]     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Backend Step 3: Batch Retriever         │
├─────────────────────────────────────────┤
│ Parallel async calls:                   │
│ • ├─ O*NET: Fetch role skills           │
│ • ├─ O*NET: Wage data + growth          │
│ • ├─ Tavily: Search for resources       │
│ • ├─ Tavily: Job market trends          │
│ • └─ Cache: Lookup similar paths        │
│                                         │
│ Combine all results into context dict   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Backend Step 4: LLM Synthesis (Groq)    │
├─────────────────────────────────────────┤
│ Prompt Template:                        │
│ "Generate 12-week learning path.        │
│  User context: {context}                │
│  O*NET data: {skills}                   │
│  Resources: {web_results}               │
│  Format: JSON with weeks/tasks/URLs"    │
│                                         │
│ Response: Structured JSON roadmap       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Backend Step 5: Validation & Storage    │
├─────────────────────────────────────────┤
│ • Validate JSON structure               │
│ • Check all URLs are working (async)    │
│ • Store in DB (learning_paths table)    │
│ • Return path_id + metadata             │
└──────────────┬──────────────────────────┘
               │ (JSON with learning path)
               ▼
┌─────────────────────────────────────────┐
│ Frontend: Display Learning Path         │
│ • Timeline visualization                │
│ • Milestone cards (week-by-week)        │
│ • Task details + resource links         │
│ • Mark complete / sync progress         │
└─────────────────────────────────────────┘
```

---

## API Communication Protocol

### Request/Response Structure

**All API requests include**:
```
Headers:
  Authorization: Bearer {JWT_TOKEN}
  Content-Type: application/json

Request Body:
  {
    "field1": "value",
    "field2": 123
  }
```

**All API responses follow**:
```json
{
  "status": "success" | "error",
  "data": { /* actual payload */ },
  "message": "Human-readable message",
  "timestamp": "2025-02-13T10:30:00Z"
}
```

### Error Responses

```json
{
  "status": "error",
  "error_code": "INVALID_ROLE",
  "message": "Specified career role not found in O*NET database",
  "suggestion": "Did you mean: 'Data Scientist'? (SOC: 15-2051.01)"
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: Missing or invalid JWT token
- `INVALID_INPUT`: Pydantic validation failed
- `ROLE_NOT_FOUND`: Career goal doesn't exist on O*NET
- `MISSING_PROFILE`: User hasn't completed wizard
- `RATE_LIMIT`: Too many requests (429)
- `INTERNAL_ERROR`: Server error with error ID for debugging

---

## Caching Strategy

### Cache Layers

**1. Frontend Cache** (Browser LocalStorage)
- User JWT token (30-minute expiry)
- User profile (with invalidation on update)
- Learning paths (invalidate on goal change)

**2. Backend Cache** (In-memory with TTL)
- O*NET occupations (24-hour TTL) — Load at startup
- O*NET skills (24-hour TTL) — Load at startup
- Top 100 careers (12-hour TTL) — Frequently accessed
- Web search results (6-hour TTL) — Avoid duplicate searches

**3. Database Optimization**
- Indexes on: users(email), profiles(user_id), career_goals(profile_id)
- JSONB column for path storage (faster than separate tables)
- Connection pooling (min: 5, max: 10)

---

## Security Architecture

### 1. Authentication

**JWT Token Lifecycle**:
```
1. User logs in → Credentials validated
2. Backend generates JWT token (HS256 algorithm)
3. Token structure:
   {
     "sub": "user@example.com",
     "user_id": 123,
     "exp": 1735689600,
     "iat": 1735603200
   }
4. Frontend stores in localStorage
5. Sent with every request in Authorization header
6. Backend validates signature (checks not tampered)
7. Token expires after 24 hours
```

**Password Reset Process**:
```
1. User clicks "Forgot Password"
2. Enters email → Backend sends OTP (one-time password)
3. Email contains magic link: /reset-password?token={otp}
4. OTP expires after 15 minutes (stored in DB)
5. User sets new password
6. Backend invalidates OTP (delete from DB)
7. Password hashed again with bcrypt
```

### 2. Authorization

**Role-Based Access Control**:
- Currently: All authenticated users have same access
- Future: Could add ADMIN, MENTOR roles

**Endpoint Protection**:
```python
@app.get("/user-profile")
async def get_profile(current_user = Depends(get_current_user)):
    # get_current_user validates JWT, raises 401 if invalid
    return {"profile": current_user}
```

### 3. Data Protection

**Password Hashing**:
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hashing
hashed = pwd_context.hash(plain_password)  # 10 rounds default

# Verification
is_valid = pwd_context.verify(plain_password, hash)
```

**HTTPS Enforcement**:
- All API communication over HTTPS (TLS 1.2+)
- HSTS header set to force HTTPS for 1 year

**CORS Policy**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://skillvector.com", "https://www.skillvector.com"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=True,
    max_age=3600
)
```

---

## Performance Optimization

### Frontend Optimization

**Code Splitting**:
- Next.js automatic route-based splitting
- Learn path visualization only loads when navigating to /learning-path

**Image Optimization**:
- Next.js Image component with lazy loading
- Automatic format conversion (WebP if supported)

**State Management**:
- Zustand (minimal bundle size: 2KB)
- Prevents unnecessary re-renders with selective subscriptions

### Backend Optimization

**Async Processing**:
```python
async def batch_retrieve(queries: list[str]):
    # Execute all searches in parallel
    tasks = [
        asyncio.create_task(fetch_onet()),
        asyncio.create_task(fetch_from_tavily(q1)),
        asyncio.create_task(fetch_from_tavily(q2)),
        # ... more tasks
    ]
    
    results = await asyncio.gather(*tasks)
    # Total time = max(task time), not sum
```

**Database Optimization**:
- Eager loading (avoid N+1 queries)
- Connection pooling
- Index usage for frequent queries

**Groq API Optimization**:
- Batch requests where possible
- Cache model results for common queries
- Implement request timeout (30 seconds)

---

## Deployment Architecture

### Local Development

```bash
# Terminal 1: Backend
cd server
virtualenv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev  # http://localhost:3000
```

### Production Deployment (AWS Example)

```
┌─────────────────────────────────────────────┐
│       CloudFront (CDN)                      │
│  Caches static assets (JS, CSS, images)    │
│  Origin: S3 bucket                         │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│       Application Load Balancer (ALB)       │
│  Routes based on path:                     │
│  • /api/* → FastAPI backend (port 8000)    │
│  • /* → Next.js frontend (port 3000)       │
└──────────────┬──────────────────────────────┘
        ┌──────┴──────┐
        │             │
   ┌────▼────┐   ┌────▼────┐
   │ Backend  │   │ Frontend │
   │ Instance │   │ Instance │
   │ (EC2)    │   │ (EC2)    │
   └────┬────┘   └────┬────┘
        │             │
        └──────┬──────┘
               │
        ┌──────▼──────────┐
        │   PostgreSQL    │
        │   RDS Multi-AZ  │
        │   (Replicated)  │
        └─────────────────┘
```

### CI/CD Pipeline (GitHub Actions)

```yaml
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Backend Tests
      - name: Test Backend
        run: |
          cd server
          pip install -r requirements.txt
          pytest tests/ --cov
      
      # Frontend Tests
      - name: Test Frontend
        run: |
          cd frontend
          npm install
          npm run lint
          npm run test
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS
        run: ./scripts/deploy.sh
```

---

## Monitoring & Logging

### Logging Strategy

**Frontend Logging**:
- Error tracking: Sentry.io integration
- Performance monitoring: Web Vitals
- User analytics: Google Analytics

**Backend Logging**:
```python
import logging

logger = logging.getLogger(__name__)

@app.post("/generate-path")
async def generate_path(user_id: int):
    logger.info(f"Generating path for user {user_id}")
    try:
        # ... process
        logger.info(f"Path generated successfully, {len(milestones)} milestones")
    except Exception as e:
        logger.error(f"Path generation failed: {str(e)}", exc_info=True)
        raise
```

### Key Metrics to Monitor

**Backend**:
- API response times (p50, p95, p99)
- Error rates (4xx, 5xx)
- RAG pipeline latency (query planning, retrieval, synthesis)
- Database query latency
- Groq API response times

**Frontend**:
- Page load time (First Contentful Paint)
- Time to Interactive
- Largest Contentful Paint
- Cumulative Layout Shift

---

## Scalability Considerations

### Current Limits (Single Server)

- **Concurrent users**: ~10,000
- **Daily active users**: ~100,000
- **Learning paths generated/day**: 50,000

### Scaling Strategies

**Horizontal Scaling**:
1. Run multiple FastAPI instances behind load balancer
2. Use connection pooling for PostgreSQL
3. Add Redis cache for frequently accessed data
4. Queue long-running tasks (Celery + RabbitMQ)

**Vertical Scaling**:
1. Upgrade server hardware (CPU, RAM)
2. Optimize database queries (add indexes)
3. Implement caching more aggressively

**Data Scaling**:
1. Archive old learning paths (>1 year)
2. Partition user data by geography/signup date
3. Read replicas for analytics queries

---

## Testing Strategy

### Unit Tests (Backend)

```python
# tests/test_auth.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_register_success():
    response = client.post("/register", json={
        "username": "john_doe",
        "email": "john@example.com",
        "password": "SecurePass123!"
    })
    assert response.status_code == 200
    assert "user_id" in response.json()

def test_register_duplicate_email():
    # First registration
    client.post("/register", json={...})
    # Duplicate attempt
    response = client.post("/register", json={...})
    assert response.status_code == 400
    assert "already registered" in response.text
```

### Integration Tests

```python
# tests/test_learning_path.py
def test_learning_path_generation():
    # Register user
    user = register_user("test@example.com")
    
    # Complete profile
    complete_profile(user["id"], {"goal": "Data Scientist"})
    
    # Generate path
    response = get_learning_path(user["id"])
    
    assert response.status_code == 200
    assert "milestones" in response.json()
    assert len(response.json()["milestones"]) > 0
```

### Frontend Tests (React Testing Library)

```tsx
// tests/LearningPath.test.tsx
import { render, screen } from '@testing-library/react';
import LearningPathPage from '@/app/learning-path/page';

test('displays loading state', () => {
  render(<LearningPathPage />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});

test('displays learning path after loading', async () => {
  render(<LearningPathPage />);
  const title = await screen.findByText(/Machine Learning/i);
  expect(title).toBeInTheDocument();
});
```

---

This architecture document provides the technical foundation for understanding, maintaining, and scaling SkillVector. For specific implementation questions, refer to the main DOCUMENTATION.md file.

