# SkillVector - Developer Setup Guide

## Quick Start (5 minutes)

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16
- Git
- VS Code (optional but recommended)

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/skillvector.git
cd skillvector
```

### Step 2: Backend Setup

```bash
# Navigate to server directory
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/skillvector
SECRET_KEY=your-secret-key-here-change-in-production

# APIs
GROQ_API_KEY=your-groq-api-key
TAVILY_API_KEY=your-tavily-api-key

# Email (for password reset)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-email-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
EOF

# Start server
uvicorn main:app --reload --port 8000
```

**Server is running at**: `http://localhost:8000`
**Auto-generated API docs**: `http://localhost:8000/docs`

---

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
EOF

# Start development server
npm run dev
```

**Frontend is running at**: `http://localhost:3000`

---

## Detailed Setup Instructions

### Database Setup

**1. Install PostgreSQL**

On Windows:
```powershell
# Using Chocolatey
choco install postgresql
```

On macOS:
```bash
brew install postgresql
```

**2. Start PostgreSQL Service**

```bash
# Windows
net start postgresql-x64-16

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

**3. Create Database & User**

```bash
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL CLI
postgres=# CREATE DATABASE skillvector;
postgres=# CREATE USER skillvector WITH PASSWORD 'dev_password';
postgres=# ALTER ROLE skillvector SET client_encoding TO 'utf8';
postgres=# ALTER ROLE skillvector SET default_transaction_isolation TO 'read committed';
postgres=# ALTER ROLE skillvector SET default_transaction_deferrable TO on;
postgres=# ALTER ROLE skillvector SET default_time_zone TO 'UTC';
postgres=# GRANT ALL PRIVILEGES ON DATABASE skillvector TO skillvector;
postgres=# \q
```

**4. Verify Connection**

```bash
psql -U skillvector -d skillvector -h localhost
# Should connect successfully
skillvector=# \dt
# Shows database tables once migrations are run
```

---

### Environment Variables

#### Backend (.env in `/server`)

```env
# Database Connection
DATABASE_URL=postgresql://skillvector:dev_password@localhost:5432/skillvector

# Security
SECRET_KEY=dev-secret-key-only-for-development-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 hours

# External APIs
GROQ_API_KEY=gsk_xxxxxxxxxxxxx  # Get from https://console.groq.com
TAVILY_API_KEY=tvly_xxxxxxxxxxxxx  # Get from https://tavily.com

# Email Configuration (for password reset)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SENDER_EMAIL=noreply@skillvector.com

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Logging
LOG_LEVEL=INFO
```

**Note**: For Gmail SMTP, [enable 2FA](https://support.google.com/accounts/answer/185833) and [generate app password](https://support.google.com/accounts/answer/185833).

#### Frontend (.env.local in `/frontend`)

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=SkillVector
NEXT_PUBLIC_APP_VERSION=1.0.0

# Analytics (optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G_XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxxxxx
```

---

## Getting API Keys

### 1. Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for free account
3. Navigate to API Keys section
4. Create new API key
5. Copy and paste into `.env` as `GROQ_API_KEY`

### 2. Tavily API Key

1. Go to [tavily.com](https://tavily.com)
2. Sign up for free account
3. Get API key from dashboard
4. Copy and paste into `.env` as `TAVILY_API_KEY`

### 3. O*NET Data Files

The project includes O*NET data files:
- `server/data/Occupation Data.txt`
- `server/data/Skills.txt`

These are pre-loaded at application startup and cached in memory.

---

## Running the Application

### Start Backend

```bash
cd server
source venv/bin/activate  # or: venv\Scripts\activate on Windows
uvicorn main:app --reload --port 8000
```

**Expected output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
INFO:     ✅ O*NET data loaded
```

### Start Frontend

```bash
cd frontend
npm run dev
```

**Expected output**:
```
  ▲ Next.js 16.1.1
  
  ✓ Ready in 2.1s

Local:        http://localhost:3000
```

### Test API Endpoints

**Using curl**:
```bash
# Test health endpoint
curl http://localhost:8000/

# Register user
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'

# Login
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

**Using Swagger UI** (auto-generated):
```
http://localhost:8000/docs
```

Explore all endpoints interactively in the browser!

---

## Project Structure

```
skillvector/
├── server/                          # FastAPI backend
│   ├── main.py                      # Application entry point
│   ├── auth.py                      # Authentication utilities
│   ├── requirements.txt             # Python dependencies
│   ├── .env                         # Environment variables (gitignored)
│   │
│   ├── db/
│   │   ├── database.py              # PostgreSQL connection
│   │   └── models.py                # SQLAlchemy ORM models
│   │
│   ├── schemas/
│   │   ├── UserSchemas.py           # Pydantic request/response models
│   │   └── ProfileSchemas.py        # Profile schemas
│   │
│   ├── rag/                         # Retrieval-Augmented Generation
│   │   ├── query_planner.py         # LLM query decomposition
│   │   ├── batch_retriever.py       # Parallel data fetching
│   │   ├── retriever.py             # Web search integration
│   │   └── __init__.py
│   │
│   ├── market/                      # Market intelligence engine
│   │   ├── load_onet.py             # Load O*NET occupational data
│   │   ├── role_matcher.py          # Match user goals to O*NET roles
│   │   ├── skill_extractor.py       # Extract required skills
│   │   ├── insights_engine.py       # Generate market insights
│   │   └── __init__.py
│   │
│   ├── data/                        # Data files
│   │   ├── Occupation Data.txt      # O*NET occupations
│   │   └── Skills.txt               # O*NET skills
│   │
│   └── __pycache__/                 # Python cache (gitignored)
│
├── frontend/                        # Next.js React application
│   ├── package.json                 # npm dependencies
│   ├── next.config.ts               # Next.js configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── .env.local                   # Environment variables (gitignored)
│   │
│   ├── app/                         # Next.js pages (App Router)
│   │   ├── page.tsx                 # Home page (SkillUniverse 3D)
│   │   ├── layout.tsx               # Root layout
│   │   ├── login/page.tsx           # Login page
│   │   ├── signup/page.tsx          # Registration page
│   │   ├── forgot-password/         # Password reset flow
│   │   ├── profile-setup/           # 5-step wizard
│   │   │   ├── page.tsx
│   │   │   ├── types.ts
│   │   │   └── [step]/page.tsx
│   │   ├── learning-path/           # Learning path display
│   │   │   ├── page.tsx
│   │   │   └── types.ts
│   │   └── market-insights/         # Market insights dashboard
│   │
│   ├── components/                  # Reusable React components
│   │   ├── Navbar.tsx               # Navigation bar
│   │   ├── UserMenu.tsx             # User profile dropdown
│   │   ├── profile/                 # Profile-related components
│   │   ├── market/                  # Market insights components
│   │   └── SkillUniverse/           # 3D visualization
│   │       ├── Experience.tsx       # Three.js scene
│   │       ├── Overlay.tsx          # UI overlay
│   │       └── store.ts             # Zustand state
│   │
│   ├── lib/                         # Utility functions
│   │   ├── auth.ts                  # Auth utilities (token handling)
│   │   ├── market.ts                # Market API calls
│   │   └── types.ts                 # TypeScript type definitions
│   │
│   ├── public/                      # Static assets
│   │   └── assets/                  # Images, icons
│   │
│   └── node_modules/                # npm packages (gitignored)
│
├── DOCUMENTATION.md                 # Main project documentation
├── TECHNICAL_ARCHITECTURE.md        # Architecture deep-dive
├── DEVELOPER_SETUP.md               # This file
├── README.md                        # Quick overview
├── .gitignore                       # Git ignore rules
└── LICENSE                          # Project license
```

---

## Common Development Tasks

### Adding a New API Endpoint

**1. Create Pydantic schema** (request/response model)

```python
# server/schemas/UserSchemas.py
from pydantic import BaseModel, EmailStr

class SkillCreate(BaseModel):
    name: str
    category: str = "Primary"
    
class SkillResponse(SkillCreate):
    id: int
    class Config:
        from_attributes = True
```

**2. Create database model** (if needed)

```python
# server/db/models.py
class SkillDB(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"))
    name = Column(String, nullable=False)
    category = Column(String)
```

**3. Create endpoint**

```python
# server/main.py
@app.post("/user-skills", response_model=SkillResponse)
async def add_skill(
    skill: SkillCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new skill to user's profile."""
    
    # Get user profile
    profile = db.query(ProfileDB).filter(
        ProfileDB.user_id == current_user["user_id"]
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Create skill
    new_skill = SkillDB(
        profile_id=profile.id,
        name=skill.name,
        category=skill.category
    )
    
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    
    return new_skill
```

**4. Test the endpoint**

Use Swagger UI: http://localhost:8000/docs

Or use curl:
```bash
curl -X POST http://localhost:8000/user-skills \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Python", "category": "Primary"}'
```

### Adding a React Component

**1. Create component file**

```tsx
// frontend/components/SkillCard.tsx
import React from 'react';

interface SkillCardProps {
  name: string;
  category: string;
  onDelete: () => void;
}

export default function SkillCard({ name, category, onDelete }: SkillCardProps) {
  return (
    <div className="p-4 border rounded-lg hover:shadow-lg transition">
      <h3 className="font-bold">{name}</h3>
      <p className="text-sm text-gray-600">{category}</p>
      <button
        onClick={onDelete}
        className="mt-2 text-red-500 hover:text-red-700"
      >
        Remove
      </button>
    </div>
  );
}
```

**2. Use in page**

```tsx
// frontend/app/profile/page.tsx
import SkillCard from '@/components/SkillCard';

export default function ProfilePage() {
  const [skills, setSkills] = React.useState([]);
  
  const handleDelete = (id: number) => {
    setSkills(skills.filter(s => s.id !== id));
  };
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {skills.map(skill => (
        <SkillCard
          key={skill.id}
          name={skill.name}
          category={skill.category}
          onDelete={() => handleDelete(skill.id)}
        />
      ))}
    </div>
  );
}
```

### Running Tests

**Backend Tests**:
```bash
cd server

# Install test dependencies
pip install pytest pytest-cov

# Run all tests
pytest tests/

# Run with coverage
pytest tests/ --cov=. --cov-report=html

# Run specific test
pytest tests/test_auth.py::test_login_success
```

**Frontend Tests**:
```bash
cd frontend

# Install test dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# Run tests
npm run test

# Watch mode (auto-rerun on changes)
npm run test -- --watch

# Coverage report
npm run test -- --coverage
```

---

## Debugging

### Backend Debugging

**1. Using print statements**:
```python
@app.post("/generate-path")
async def generate_path(goal_id: int, db: Session = Depends(get_db)):
    print(f"DEBUG: Generating path for goal_id={goal_id}")  # Will appear in terminal
    path = db.query(LearningPath).filter_by(goal_id=goal_id).first()
    print(f"DEBUG: Found path: {path}")
    return path
```

**2. Using Python debugger (pdb)**:
```python
@app.post("/generate-path")
async def generate_path(goal_id: int):
    import pdb; pdb.set_trace()  # Execution stops here, enter debug mode
    # Now in interactive debugger:
    # > l  (list code)
    # > n  (next line)
    # > c  (continue)
    # > p goal_id  (print variable)
```

**3. Using VS Code debugger**:

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["main:app", "--reload"],
      "jinja": true,
      "cwd": "${workspaceFolder}/server"
    }
  ]
}
```

Then press F5 to start debugging.

### Frontend Debugging

**1. Browser DevTools**:
- F12 to open developer tools
- Console tab to see logs
- Network tab to inspect API calls
- React tab (install React Developer Tools extension)

**2. VS Code debugger**:

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend"
    }
  ]
}
```

**3. Console logging**:
```tsx
useEffect(() => {
  console.log("Component mounted");
  console.log("Props:", { name, age });
  
  return () => {
    console.log("Component unmounted");
  };
}, [name, age]);
```

---

## Database Migrations

### Create Migration

```bash
cd server

# Install Alembic
pip install alembic

# Initialize Alembic (first time only)
alembic init alembic

# Auto-generate migration
alembic revision --autogenerate -m "Add new_field to users table"

# Review generated migration in alembic/versions/xxxx_add_new_field.py

# Apply migration
alembic upgrade head
```

### Rollback Migration

```bash
# Show current version
alembic current

# Show history
alembic history

# Rollback one version
alembic downgrade -1

# Rollback to specific version
alembic downgrade ae1027a6acf
```

---

## Troubleshooting

### Problem: "ModuleNotFoundError: No module named 'groq'"

**Solution**: Ensure virtual environment is activated and dependencies installed:
```bash
cd server
source venv/bin/activate
pip install -r requirements.txt
```

### Problem: "CORS error: Access to XMLHttpRequest blocked"

**Solution**: Check CORS configuration in `server/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Problem: "PostgreSQL connection refused"

**Solution**: Ensure PostgreSQL is running:
```bash
# Windows
net start postgresql-x64-16

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Verify connection
psql -U skillvector -d skillvector
```

### Problem: "API returns 401 Unauthorized"

**Solution**: Include JWT token in request:
```bash
curl -X GET http://localhost:8000/user-profile \
  -H "Authorization: Bearer {your-token-here}"
```

### Problem: "Frontend can't find API"

**Solution**: Check `.env.local` has correct API URL:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

And ensure backend is running on port 8000.

---

## Contributing Guidelines

### Before Pushing Code

1. **Run tests**:
   ```bash
   # Backend
   cd server
   pytest tests/
   
   # Frontend
   cd frontend
   npm run lint
   ```

2. **Format code**:
   ```bash
   # Backend
   cd server
   pip install black
   black . --line-length=100
   
   # Frontend
   cd frontend
   npm run format  # or: npx prettier --write .
   ```

3. **Create feature branch**:
   ```bash
   git checkout -b feature/add-new-feature
   ```

4. **Commit with descriptive message**:
   ```bash
   git commit -m "feat: Add new learning path visualization"
   ```

5. **Push and create Pull Request**:
   ```bash
   git push origin feature/add-new-feature
   ```

---

## Additional Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Next.js Docs**: https://nextjs.org/docs
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Groq API**: https://console.groq.com/docs
- **Tavily API**: https://tavily.com/api-docs

---

Happy coding! 🚀

