from pydantic import BaseModel
from typing import Optional


class SkillAdd(BaseModel):
    skill: str
    proficiency: str = "beginner"  # beginner, intermediate, advanced


class CertificationAdd(BaseModel):
    name: str
    issuer: str
