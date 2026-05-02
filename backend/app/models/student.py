"""
Student Model — The core identity table for each user on the platform.
Stores demographic, socio-economic, and account-level information.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    # ── Account Info ──
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    display_name = Column(String(100), nullable=False)
    avatar_url = Column(Text, default="")
    bio = Column(Text, default="")
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # ── Socio-Economic Data ──
    family_background = Column(String(50), default="")       # e.g. "Nuclear", "Joint"
    parents_income_bracket = Column(String(30), default="")   # e.g. "30k-50k", "50k-100k"
    parents_education = Column(String(50), default="")        # e.g. "Graduate", "Post-Graduate"
    has_internet_access = Column(Boolean, default=True)
    travel_time_minutes = Column(Integer, default=0)          # Commute to school

    # ── Gamification Aggregate Fields ──
    total_points = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    level = Column(Integer, default=1)

    # ── Relationships ──
    academic_records = relationship("AcademicRecord", back_populates="student", cascade="all, delete-orphan")
    personal_profile = relationship("PersonalProfile", back_populates="student", uselist=False, cascade="all, delete-orphan")
    mood_logs = relationship("MoodLog", back_populates="student", cascade="all, delete-orphan")
    routines = relationship("Routine", back_populates="student", cascade="all, delete-orphan")
    badges = relationship("StudentBadge", back_populates="student", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="student", cascade="all, delete-orphan")
    active_subjects = relationship("ActiveSubject", back_populates="student", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Student(id={self.id}, username='{self.username}')>"


class ActiveSubject(Base):
    """Tracks the subjects a student is currently studying."""
    __tablename__ = "active_subjects"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student", back_populates="active_subjects")

    def __repr__(self):
        return f"<ActiveSubject(student_id={self.student_id}, name='{self.name}')>"
