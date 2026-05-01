"""
Routine & Task Models — The gamification backbone.
Tracks personalized daily routines, individual tasks, and completion records.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class Routine(Base):
    """A student's personalized daily routine template."""
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)             # e.g. "Weekday Study Routine"
    description = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # ── Relationships ──
    student = relationship("Student", back_populates="routines")
    tasks = relationship("RoutineTask", back_populates="routine", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Routine(id={self.id}, name='{self.name}')>"


class RoutineTask(Base):
    """Individual tasks within a routine — the checklist items."""
    __tablename__ = "routine_tasks"

    id = Column(Integer, primary_key=True, index=True)
    routine_id = Column(Integer, ForeignKey("routines.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)            # e.g. "30 min Math revision"
    category = Column(String(30), default="study")         # study/health/personal/social
    icon_name = Column(String(30), default="check_circle")
    points_value = Column(Integer, default=10)             # Points awarded on completion
    order_index = Column(Integer, default=0)               # Display ordering
    time_slot = Column(String(20), default="")             # e.g. "06:00-06:30"

    # ── Relationships ──
    routine = relationship("Routine", back_populates="tasks")
    completions = relationship("RoutineCompletion", back_populates="task", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<RoutineTask(id={self.id}, title='{self.title}')>"


class RoutineCompletion(Base):
    """Records each time a task is completed — one per task per day."""
    __tablename__ = "routine_completions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("routine_tasks.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    date_key = Column(String(10), nullable=False)          # "2026-04-28" for unique-per-day constraint
    points_earned = Column(Integer, default=0)

    # ── Relationships ──
    task = relationship("RoutineTask", back_populates="completions")

    def __repr__(self):
        return f"<RoutineCompletion(task={self.task_id}, date='{self.date_key}')>"
