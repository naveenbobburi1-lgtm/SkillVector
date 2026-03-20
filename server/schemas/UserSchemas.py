from pydantic import BaseModel, EmailStr,StringConstraints

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserProfileCreate(BaseModel):
    education_level: str | None = None
    current_status: str | None = None
    current_role: str | None = None
    current_industry: str | None = None
    location: str | None = None
    skills: list[dict] | list[str] | None = None
    desired_role: str | None = None
    preferred_industries: list[str] | None = None
    expected_income: str | None = None
    relocation: bool | None = None
    language: str | None = None
    learning_pace: str | None = None
    hours_per_week: str | None = None
    learning_format: list[str] | None = None
    budget_sensitivity: str | None = None
    timeline: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str