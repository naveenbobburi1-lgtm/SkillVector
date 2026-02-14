# SkillVector - API Documentation

**Base URL**: `http://localhost:8000` (development)  
**Production URL**: `https://api.skillvector.com` (production)

**API Version**: 1.0.0  
**Last Updated**: February 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [Profile Management](#profile-management)
3. [Learning Paths](#learning-paths)
4. [Market Intelligence](#market-intelligence)
5. [Skills Management](#skills-management)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Examples](#examples)

---

## Authentication

All endpoints (except `/register` and `/login`) require JWT authentication via the `Authorization` header.

### POST /register

Register a new user account.

**Request**:
```http
POST /register HTTP/1.1
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Parameters**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `username` | string | Yes | 3-32 characters, alphanumeric + underscore |
| `email` | string | Yes | Valid email format, must be unique |
| `password` | string | Yes | Min 8 chars, at least 1 uppercase, 1 number |

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "user_id": 42,
    "email": "john@example.com",
    "message": "User registered successfully"
  },
  "timestamp": "2025-02-13T10:30:00Z"
}
```

**Error Responses**:

400 Bad Request:
```json
{
  "status": "error",
  "error_code": "INVALID_INPUT",
  "message": "Password must contain at least 1 uppercase letter",
  "field": "password"
}
```

409 Conflict:
```json
{
  "status": "error",
  "error_code": "EMAIL_EXISTS",
  "message": "Email already registered"
}
```

---

### POST /login

Authenticate user and receive JWT token.

**Request**:
```http
POST /login HTTP/1.1
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Parameters**:
| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huQGV4YW1wbGUuY29tIiwidXNlcl9pZCI6NDIsImV4cCI6MTczNTY4OTYwMCwiaWF0IjoxNzM1NjAzMjAwfQ.4a9qL5k8zXmQpRsT",
    "token_type": "bearer",
    "expires_in": 86400,
    "user_id": 42
  },
  "timestamp": "2025-02-13T10:30:00Z"
}
```

**Storage** (Frontend):
```javascript
// Store token in localStorage
localStorage.setItem('token', response.data.access_token);

// Include in all subsequent requests
fetch('/user-profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

**Error Responses**:

401 Unauthorized:
```json
{
  "status": "error",
  "error_code": "INVALID_CREDENTIALS",
  "message": "Email or password is incorrect"
}
```

---

### POST /forgot-password

Request password reset via email OTP.

**Request**:
```http
POST /forgot-password HTTP/1.1
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "message": "Password reset email sent",
    "note": "Check your email for reset link (expires in 15 minutes)"
  }
}
```

---

### POST /reset-password

Complete password reset with OTP token.

**Request**:
```http
POST /reset-password HTTP/1.1
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "new_password": "NewSecurePassword456!"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "message": "Password reset successful. Please login with new password."
  }
}
```

---

## Profile Management

### GET /user-profile

Retrieve current logged-in user's profile.

**Request**:
```http
GET /user-profile HTTP/1.1
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": 42,
    "user_id": 42,
    "full_name": "John Doe",
    "age": 28,
    "education": "Bachelor's in Computer Science",
    "current_status": "Working",
    "location": "San Francisco, CA",
    "total_experience": "5 years",
    "skills": [
      {
        "id": 1,
        "name": "Python",
        "category": "Primary",
        "proficiency_level": "Advanced"
      },
      {
        "id": 2,
        "name": "SQL",
        "category": "Primary",
        "proficiency_level": "Intermediate"
      }
    ],
    "certifications": [
      {
        "id": 1,
        "name": "AWS Certified Solutions Architect",
        "issuer": "Amazon Web Services",
        "issue_date": "2023-01-15",
        "expiry_date": "2025-01-15"
      }
    ],
    "career_goals": [
      {
        "id": 1,
        "title": "Data Scientist",
        "description": "Specialize in machine learning and AI",
        "target_timeline_weeks": 24,
        "hours_per_week": 15
      }
    ]
  }
}
```

**Error Response** (401):
```json
{
  "status": "error",
  "error_code": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

---

### PUT /user-profile

Update user profile information.

**Request**:
```http
PUT /user-profile HTTP/1.1
Authorization: Bearer {token}
Content-Type: application/json

{
  "full_name": "John Doe",
  "age": 29,
  "education": "Master's in Data Science",
  "location": "New York, NY",
  "total_experience": "6 years"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "id": 42,
    "full_name": "John Doe",
    "age": 29,
    "message": "Profile updated successfully"
  }
}
```

---

### POST /profile/complete-wizard

Complete the 5-step profile wizard in one request.

**Request**:
```http
POST /profile/complete-wizard HTTP/1.1
Authorization: Bearer {token}
Content-Type: application/json

{
  "basic": {
    "full_name": "John Doe",
    "age": 28,
    "current_status": "Working",
    "location": "San Francisco, CA"
  },
  "skills": [
    {
      "name": "Python",
      "category": "Primary"
    },
    {
      "name": "SQL",
      "category": "Primary"
    }
  ],
  "goals": [
    {
      "title": "Data Scientist",
      "description": "Specialize in ML and AI"
    }
  ],
  "constraints": {
    "hours_per_week": 15,
    "timeline_weeks": 24,
    "preferred_learning_format": "Online courses"
  }
}
```

**Response** (201 Created):
```json
{
  "status": "success",
  "data": {
    "profile_id": 42,
    "wizard_completed": true,
    "next_step": "Generate learning path"
  }
}
```

---

## Learning Paths

### POST /generate-path

Generate personalized learning path based on user profile and goals.

**Request**:
```http
POST /generate-path HTTP/1.1
Authorization: Bearer {token}
Content-Type: application/json

{
  "goal_id": 1,
  "timeline_weeks": 12,
  "hours_per_week": 15
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `goal_id` | integer | Yes | Career goal ID (from profile) |
| `timeline_weeks` | integer | No | Weeks to complete (default: 12) |
| `hours_per_week` | integer | No | Available hours/week (default: 10) |

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "path_id": 1,
    "goal": "Data Scientist",
    "timeline": "12 weeks",
    "total_hours": 180,
    "skill_coverage": "85%",
    "missing_skills": [
      "Advanced TensorFlow",
      "Model Deployment",
      "A/B Testing"
    ],
    "milestones": [
      {
        "week": 1,
        "title": "Python Fundamentals Review",
        "description": "Refresh Python basics before diving into data science",
        "tasks": [
          {
            "task_id": 1,
            "title": "Python basics (loops, functions, OOP)",
            "description": "Review core Python concepts needed for data science",
            "estimated_hours": 12,
            "resource": {
              "title": "Python for Data Analysis (3rd Edition)",
              "url": "https://example.com/python-course",
              "source": "Real Python",
              "type": "Interactive Tutorial"
            },
            "completed": false,
            "difficulty": "Beginner"
          },
          {
            "task_id": 2,
            "title": "NumPy and Pandas fundamentals",
            "description": "Learn NumPy arrays and Pandas DataFrames",
            "estimated_hours": 8,
            "resource": {
              "title": "NumPy & Pandas Tutorial",
              "url": "https://example.com/numpy-pandas",
              "source": "DataCamp",
              "type": "Video Course"
            },
            "completed": false,
            "difficulty": "Beginner"
          }
        ]
      },
      {
        "week": 2,
        "title": "Statistics & Probability Foundations",
        "description": "Build understanding of statistical concepts",
        "tasks": [
          {
            "task_id": 3,
            "title": "Probability distributions and hypothesis testing",
            "estimated_hours": 15,
            "resource": {
              "title": "Statistics for Data Science",
              "url": "https://example.com/stats",
              "source": "Coursera"
            },
            "completed": false,
            "difficulty": "Intermediate"
          }
        ]
      }
    ],
    "generated_at": "2025-02-13T10:30:00Z"
  }
}
```

**Response Time**: 1500-2500ms (includes O*NET lookup, web search, LLM synthesis)

---

### GET /learning-path/{path_id}

Retrieve existing learning path.

**Request**:
```http
GET /learning-path/1 HTTP/1.1
Authorization: Bearer {token}
```

**Response** (200 OK): Same structure as POST response above

---

### PUT /learning-path/{path_id}/task/{task_id}

Mark a task as completed.

**Request**:
```http
PUT /learning-path/1/task/42 HTTP/1.1
Authorization: Bearer {token}
Content-Type: application/json

{
  "completed": true,
  "notes": "Completed the course, understood concepts"
}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "task_id": 42,
    "completed": true,
    "completed_at": "2025-02-13T11:00:00Z",
    "path_progress": 25
  }
}
```

---

### DELETE /learning-path/{path_id}

Delete a learning path (user can regenerate if needed).

**Request**:
```http
DELETE /learning-path/1 HTTP/1.1
Authorization: Bearer {token}
```

**Response** (204 No Content):
```
(No response body)
```

---

## Market Intelligence

### GET /market/role-insights/{role_name}

Get comprehensive market data for a career role.

**Request**:
```http
GET /market/role-insights/Data%20Scientist HTTP/1.1
Authorization: Bearer {token}
```

**URL Encoding**: Spaces become `%20`

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "role": "Data Scientist",
    "soc_code": "15-2051.01",
    "description": "Develop and implement specialized mathematical and statistical techniques...",
    "median_wage": 108660,
    "annual_wage_range": {
      "low": 67360,
      "high": 210670
    },
    "job_outlook": {
      "percent_growth": 36,
      "growth_description": "Much faster than average"
    },
    "employment": {
      "current": 54500,
      "projected": 74500
    },
    "market_scores": {
      "salary_score": 92,
      "demand_score": 89,
      "growth_score": 95
    },
    "required_skills": [
      {
        "skill": "Python",
        "importance": 5,
        "wage_impact": 0.15,
        "learning_time_hours": 40
      },
      {
        "skill": "SQL",
        "importance": 5,
        "wage_impact": 0.12,
        "learning_time_hours": 25
      },
      {
        "skill": "Machine Learning",
        "importance": 5,
        "wage_impact": 0.18,
        "learning_time_hours": 80
      },
      {
        "skill": "Statistics",
        "importance": 5,
        "wage_impact": 0.10,
        "learning_time_hours": 50
      },
      {
        "skill": "TensorFlow",
        "importance": 4,
        "wage_impact": 0.08,
        "learning_time_hours": 40
      }
    ],
    "trending_skills": [
      "Large Language Models (LLMs)",
      "MLOps & Model Deployment",
      "Graph Neural Networks",
      "Federated Learning",
      "Reinforcement Learning"
    ],
    "market_summary": "Extremely high demand with explosive growth. Strong salary growth due to AI revolution.",
    "related_roles": [
      {
        "title": "Machine Learning Engineer",
        "soc_code": "15-2051.02",
        "similarity_score": 0.92
      },
      {
        "title": "Data Analyst",
        "soc_code": "15-4011.00",
        "similarity_score": 0.78
      }
    ]
  }
}
```

---

### GET /market/skill-demand

Get top-in-demand skills across all roles.

**Request**:
```http
GET /market/skill-demand?limit=20 HTTP/1.1
Authorization: Bearer {token}
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Number of skills to return |
| `category` | string | - | Filter by skill category (e.g., "Technology", "Management") |

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "skills": [
      {
        "rank": 1,
        "skill": "Python",
        "demand_count": 45000,
        "wage_impact": 0.18,
        "growth_trend": "↑ +15% YoY"
      },
      {
        "rank": 2,
        "skill": "SQL",
        "demand_count": 42000,
        "wage_impact": 0.14,
        "growth_trend": "→ stable"
      },
      {
        "rank": 3,
        "skill": "Machine Learning",
        "demand_count": 38000,
        "wage_impact": 0.22,
        "growth_trend": "↑ +32% YoY"
      }
    ]
  }
}
```

---

### GET /market/career-alternatives

Find similar roles based on skills.

**Request**:
```http
GET /market/career-alternatives?role=Data%20Scientist&count=5 HTTP/1.1
Authorization: Bearer {token}
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `role` | string | Yes | Base role to find alternatives for |
| `count` | integer | No | Number of alternatives (default: 5) |

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "base_role": "Data Scientist",
    "alternatives": [
      {
        "title": "Machine Learning Engineer",
        "similarity_score": 0.92,
        "description": "Similar skills, more engineering-focused",
        "median_wage": 125000,
        "job_growth": 32
      },
      {
        "title": "Analytics Engineer",
        "similarity_score": 0.78,
        "description": "Bridge between data and engineering",
        "median_wage": 110000,
        "job_growth": 25
      }
    ]
  }
}
```

---

## Skills Management

### POST /user-skills

Add a new skill to user's profile.

**Request**:
```http
POST /user-skills HTTP/1.1
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Python",
  "category": "Primary",
  "proficiency_level": "Advanced"
}
```

**Response** (201 Created):
```json
{
  "status": "success",
  "data": {
    "skill_id": 42,
    "name": "Python",
    "category": "Primary",
    "proficiency_level": "Advanced"
  }
}
```

---

### GET /user-skills

List all user's skills.

**Request**:
```http
GET /user-skills HTTP/1.1
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "skills": [
      {
        "skill_id": 42,
        "name": "Python",
        "category": "Primary",
        "proficiency_level": "Advanced"
      }
    ],
    "total_count": 1
  }
}
```

---

### DELETE /user-skills/{skill_id}

Remove a skill from user's profile.

**Request**:
```http
DELETE /user-skills/42 HTTP/1.1
Authorization: Bearer {token}
```

**Response** (204 No Content)

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "status": "error",
  "error_code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "field_name (if applicable)",
    "validation_errors": ["Error 1", "Error 2"]
  },
  "timestamp": "2025-02-13T10:30:00Z",
  "request_id": "req_abc123xyz"  // For debugging
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | User lacks permission for action |
| `INVALID_INPUT` | 400 | Request validation failed |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource doesn't exist |
| `CONFLICT` | 409 | Resource already exists or state conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests, try again later |
| `INTERNAL_ERROR` | 500 | Server error (check request_id in logs) |

---

## Rate Limiting

**Limits**:
- Authentication endpoints: 5 requests per minute per IP
- API endpoints: 100 requests per minute per user
- Market Intelligence: 30 requests per minute per user

**Response Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1707469800
```

**Rate Limit Exceeded**:
```json
{
  "status": "error",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again in 45 seconds.",
  "retry_after": 45
}
```

---

## Examples

### Complete User Journey Example

**1. Register**:
```bash
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jane_smith",
    "email": "jane@example.com",
    "password": "SecurePass123!"
  }'

# Response: user_id = 42
```

**2. Login**:
```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "SecurePass123!"
  }'

# Response: access_token = "eyJhbGc..."
TOKEN="eyJhbGc..."
```

**3. Complete Profile**:
```bash
curl -X POST http://localhost:8000/profile/complete-wizard \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "basic": {
      "full_name": "Jane Smith",
      "age": 26,
      "current_status": "Working",
      "location": "Boston, MA"
    },
    "skills": [
      {"name": "JavaScript", "category": "Primary"},
      {"name": "React", "category": "Primary"}
    ],
    "goals": [{
      "title": "Machine Learning Engineer",
      "description": "Transition to ML from web development"
    }]
  }'

# Response: goal_id = 1
```

**4. Generate Learning Path**:
```bash
curl -X POST http://localhost:8000/generate-path \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal_id": 1,
    "timeline_weeks": 16,
    "hours_per_week": 12
  }'

# Response: path_id = 1, milestones[], tasks[]
```

**5. Get Market Insights**:
```bash
curl -X GET http://localhost:8000/market/role-insights/Machine%20Learning%20Engineer \
  -H "Authorization: Bearer $TOKEN"

# Response: salary_score, demand_score, required_skills, etc.
```

**6. Mark Task Complete**:
```bash
curl -X PUT http://localhost:8000/learning-path/1/task/5 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Response: task marked complete, progress updated
```

---

## API Changelog

### Version 1.0.0 (February 2025)
- Initial release
- Authentication endpoints
- Profile management
- Learning path generation
- Market intelligence
- Skills management

### Planned (Future)
- v1.1: Batch operations (upload multiple skills)
- v1.2: Advanced filtering on learning paths
- v2.0: Peer matching & study groups

---

For additional support, visit our documentation at: https://skillvector.com/docs

