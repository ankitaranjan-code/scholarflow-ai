"""
Academic Models — Tracks semester records and individual subject scores.
Feeds into the ML Predictive Engine for performance trajectory analysis.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class AcademicRecord(Base):
    """A semester-level snapshot of a student's academic state."""
    __tablename__ = "academic_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    semester = Column(String(20), nullable=False)         # e.g. "Sem-2 2026"
    attendance_pct = Column(Float, default=0.0)           # 0–100
    daily_study_hours = Column(Float, default=0.0)        # Average hours/day
    task_completion_rate = Column(Float, default=0.0)      # 0–100
    overall_grade = Column(String(5), default="")          # e.g. "A+", "B"
    predicted_grade = Column(String(5), default="")        # ML-generated prediction
    confidence_score = Column(Float, default=0.0)          # ML confidence 0–1
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # ── Relationships ──
    student = relationship("Student", back_populates="academic_records")
    subject_scores = relationship("SubjectScore", back_populates="academic_record", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<AcademicRecord(student={self.student_id}, sem='{self.semester}')>"


class SubjectScore(Base):
    """Individual subject-level marks within an academic record."""
    __tablename__ = "subject_scores"

    id = Column(Integer, primary_key=True, index=True)
    academic_record_id = Column(Integer, ForeignKey("academic_records.id"), nullable=False, index=True)
    subject_name = Column(String(80), nullable=False)      # e.g. "Mathematics"
    internal_marks = Column(Float, default=0.0)             # Internal assessment score
    exam_score = Column(Float, default=0.0)                 # Final exam score
    max_marks = Column(Float, default=100.0)
    status = Column(String(20), default="steady")           # "critical", "steady", "peak"
    icon_name = Column(String(30), default="book")          # Material icon name
    color_accent = Column(String(20), default="primary")    # UI accent: primary/secondary/tertiary/error

    # ── Relationships ──
    academic_record = relationship("AcademicRecord", back_populates="subject_scores")

    @property
    def percentage(self):
        if self.max_marks > 0:
            return round(((self.internal_marks + self.exam_score) / (self.max_marks * 2)) * 100, 1)
        return 0.0

    def __repr__(self):
        return f"<SubjectScore(subject='{self.subject_name}', pct={self.percentage}%)>"
