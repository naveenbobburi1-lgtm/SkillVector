from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text
import sqlalchemy.orm
import sqlalchemy
from sqlalchemy.sql import func
from db.database import Base


class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # NULL for Google OAuth users
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
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

class ActiveTest(Base):
    __tablename__ = "active_tests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    phase_index = Column(Integer, nullable=False)
    questions_data = Column(String, nullable=False)  # Full JSON with correct answers
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


# ============================================================
# ADMIN PANEL MODELS
# ============================================================

class VideoAssignment(Base):
    __tablename__ = "video_assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    youtube_url = Column(String, nullable=False)
    youtube_video_id = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    duration_seconds = Column(Integer, nullable=False)  # Expected video duration
    category = Column(String, nullable=True)  # e.g., "AI/ML", "Web Dev", etc.
    assigned_by = Column(Integer, sqlalchemy.ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    progress_records = sqlalchemy.orm.relationship("VideoProgress", back_populates="assignment", cascade="all, delete-orphan")
    user_assignments = sqlalchemy.orm.relationship("UserVideoAssignment", back_populates="assignment", cascade="all, delete-orphan")


class UserVideoAssignment(Base):
    """Links a video assignment to specific users (or all users if user_id is NULL)"""
    __tablename__ = "user_video_assignments"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, sqlalchemy.ForeignKey("video_assignments.id"), nullable=False)
    user_id = Column(Integer, sqlalchemy.ForeignKey("users.id"), nullable=True)  # NULL = assigned to all
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)
    is_mandatory = Column(Boolean, default=True)

    assignment = sqlalchemy.orm.relationship("VideoAssignment", back_populates="user_assignments")


class VideoProgress(Base):
    """Tracks legitimate video watching progress with anti-cheat"""
    __tablename__ = "video_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, sqlalchemy.ForeignKey("users.id"), nullable=False)
    video_id = Column(Integer, sqlalchemy.ForeignKey("video_assignments.id"), nullable=False)
    watched_seconds = Column(Integer, default=0)  # Total verified watch time
    max_position = Column(Integer, default=0)  # Furthest legitimate position reached
    completion_percent = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    watch_sessions = Column(Text, nullable=True)  # JSON: list of {start, end, duration, timestamp}
    last_heartbeat = Column(DateTime(timezone=True), nullable=True)
    total_pauses = Column(Integer, default=0)
    cheat_flags = Column(Integer, default=0)  # Number of suspicious events detected
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    assignment = sqlalchemy.orm.relationship("VideoAssignment", back_populates="progress_records")


class AdminActivityLog(Base):
    """Audit log for admin actions"""
    __tablename__ = "admin_activity_log"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, sqlalchemy.ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # e.g., "assign_video", "toggle_user", etc.
    target_type = Column(String, nullable=True)  # "user", "video", etc.
    target_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)  # JSON with extra context
    created_at = Column(DateTime(timezone=True), server_default=func.now())

