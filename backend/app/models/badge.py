"""
Badge Models — Achievements and rewards unlocked through consistency.
Badges are global definitions; StudentBadge tracks per-student unlocks.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class Badge(Base):
    """Global badge definition — describes an achievable milestone."""
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), unique=True, nullable=False)         # e.g. "7-Day Warrior"
    description = Column(Text, default="")
    icon_emoji = Column(String(10), default="🏆")                  # Emoji representation
    icon_url = Column(Text, default="")                            # Optional custom icon
    category = Column(String(30), default="streak")                # streak/academic/wellness/social
    requirement_type = Column(String(30), default="streak_days")   # streak_days/points_total/task_count
    requirement_value = Column(Integer, default=7)                 # The threshold to unlock
    rarity = Column(String(20), default="common")                  # common/rare/epic/legendary
    points_reward = Column(Integer, default=50)                    # Bonus points on unlock

    # ── Relationships ──
    student_badges = relationship("StudentBadge", back_populates="badge")

    def __repr__(self):
        return f"<Badge(name='{self.name}', rarity='{self.rarity}')>"


class StudentBadge(Base):
    """Junction table — tracks which badges each student has earned."""
    __tablename__ = "student_badges"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False, index=True)
    earned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_featured = Column(Integer, default=0)  # 1 if pinned to profile

    # ── Relationships ──
    student = relationship("Student", back_populates="badges")
    badge = relationship("Badge", back_populates="student_badges")

    def __repr__(self):
        return f"<StudentBadge(student={self.student_id}, badge={self.badge_id})>"
