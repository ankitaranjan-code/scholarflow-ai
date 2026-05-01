"""
Personal & Psychological Models — Tracks health, routine adherence,
and daily mood/mindset logs for holistic student analysis.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class PersonalProfile(Base):
    """Persistent biological/lifestyle data for a student."""
    __tablename__ = "personal_profiles"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, unique=True)

    # ── Health ──
    health_conditions = Column(Text, default="")           # Comma-separated conditions
    physical_activity_level = Column(String(20), default="moderate")  # low/moderate/high
    avg_sleep_hours = Column(Float, default=7.0)
    sleep_quality = Column(String(20), default="good")     # poor/fair/good/excellent

    # ── Daily Routine ──
    wake_up_time = Column(String(10), default="07:00")
    bed_time = Column(String(10), default="23:00")
    routine_adherence_pct = Column(Float, default=0.0)     # 0–100 weekly avg

    # ── Relationships ──
    student = relationship("Student", back_populates="personal_profile")

    def __repr__(self):
        return f"<PersonalProfile(student={self.student_id})>"


class MoodLog(Base):
    """Daily psychological mood/mindset entry from the student."""
    __tablename__ = "mood_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    mood = Column(String(30), nullable=False)              # "happy", "stressed", "anxious", "motivated", "tired"
    energy_level = Column(Integer, default=5)              # 1–10 scale
    notes = Column(Text, default="")                       # Optional journaling
    logged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # ── Relationships ──
    student = relationship("Student", back_populates="mood_logs")

    def __repr__(self):
        return f"<MoodLog(student={self.student_id}, mood='{self.mood}')>"
