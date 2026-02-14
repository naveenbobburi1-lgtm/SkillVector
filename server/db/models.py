from sqlalchemy import Column, Integer, String, Boolean, DateTime
import sqlalchemy.orm
import sqlalchemy
from sqlalchemy.sql import func
from db.database import Base


class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = sqlalchemy.orm.relationship("ProfileDB", back_populates="user", uselist=False)


class ProfileDB(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, sqlalchemy.ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String)
    age = Column(Integer)
    education = Column(String)
    current_status = Column(String)
    location = Column(String)
    total_experience = Column(String)

    user = sqlalchemy.orm.relationship("UserDB", back_populates="profile")
    skills = sqlalchemy.orm.relationship("SkillDB", back_populates="profile", cascade="all, delete-orphan")
    certifications = sqlalchemy.orm.relationship("CertificationDB", back_populates="profile", cascade="all, delete-orphan")
    career_goals = sqlalchemy.orm.relationship("CareerGoalDB", back_populates="profile", cascade="all, delete-orphan")


class SkillDB(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, sqlalchemy.ForeignKey("profiles.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String)  # e.g., 'Primary', 'Informal'

    profile = sqlalchemy.orm.relationship("ProfileDB", back_populates="skills")


class CertificationDB(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, sqlalchemy.ForeignKey("profiles.id"), nullable=False)
    name = Column(String, nullable=False)
    issuer = Column(String)

    profile = sqlalchemy.orm.relationship("ProfileDB", back_populates="certifications")


class CareerGoalDB(Base):
    __tablename__ = "career_goals"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, sqlalchemy.ForeignKey("profiles.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)

    profile = sqlalchemy.orm.relationship("ProfileDB", back_populates="career_goals")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True, nullable=False)
    age = Column(Integer, nullable=True)
    phone = Column(String, nullable=True)
    education_level = Column(String, nullable=True)
    current_status = Column(String, nullable=True)
    location = Column(String, nullable=True)
    skills = Column(String, nullable=True) # Stored as JSON string
    certifications = Column(String, nullable=True) # Stored as JSON string
    desired_role = Column(String, nullable=True)
    preferred_industries = Column(String, nullable=True) # Stored as JSON string
    expected_income = Column(String, nullable=True)
    relocation = Column(Boolean, default=False)
    language = Column(String, nullable=True)
    learning_pace = Column(String, nullable=True)
    hours_per_week = Column(String, nullable=True)
    learning_format = Column(String, nullable=True) # Stored as JSON string
    budget_sensitivity = Column(String, nullable=True)
    timeline = Column(String, nullable=True)


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True, nullable=False)
    path_data = Column(String, nullable=False) # Stored as JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PhaseProgress(Base):
    __tablename__ = "phase_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    phase_index = Column(Integer, nullable=False)  # 0-based index
    is_unlocked = Column(Boolean, default=False)
    is_completed = Column(Boolean, default=False)
    test_passed = Column(Boolean, default=False)
    best_score = Column(Integer, default=0)  # Best test score percentage
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class TestAttempt(Base):
    __tablename__ = "test_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    phase_index = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False)  # Score percentage (0-100)
    answers = Column(String, nullable=False)  # JSON string of user answers
    passed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, sqlalchemy.ForeignKey("users.id"), nullable=False)
    email = Column(String, nullable=False)  # Store email for verification
    otp_code = Column(String, nullable=False)  # 6-digit OTP
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

