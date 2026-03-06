from pydantic import BaseModel


class SkillAdd(BaseModel):
    skill: str


class CertificationAdd(BaseModel):
    name: str
    issuer: str
