from pydantic import BaseModel
from typing import List, Optional

# --- Skill Schemas ---
class SkillBase(BaseModel):
    name: str
    category: Optional[str] = None

class SkillCreate(SkillBase):
    pass

class SkillAdd(BaseModel):
    skill: str

class SkillResponse(SkillBase):
    id: int
    profile_id: int
    class Config:
        from_attributes = True

# --- Certification Schemas ---
class CertificationBase(BaseModel):
    name: str
    issuer: Optional[str] = None

class CertificationCreate(CertificationBase):
    pass

class CertificationAdd(BaseModel):
    name: str
    issuer: str

class CertificationResponse(CertificationBase):
    id: int
    profile_id: int
    class Config:
        from_attributes = True

# --- Career Goal Schemas ---
class CareerGoalBase(BaseModel):
    title: str
    description: Optional[str] = None

class CareerGoalCreate(CareerGoalBase):
    pass

class CareerGoalResponse(CareerGoalBase):
    id: int
    profile_id: int
    class Config:
        from_attributes = True

# --- Profile Schemas ---
class ProfileBase(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    education: Optional[str] = None
    current_status: Optional[str] = None
    location: Optional[str] = None
    total_experience: Optional[str] = None

class ProfileCreate(ProfileBase):
    skills: List[SkillCreate] = []
    certifications: List[CertificationCreate] = []
    career_goals: List[CareerGoalCreate] = []

class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    skills: List[SkillResponse] = []
    certifications: List[CertificationResponse] = []
    career_goals: List[CareerGoalResponse] = []

    class Config:
        from_attributes = True
