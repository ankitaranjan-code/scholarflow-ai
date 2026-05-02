"""Pydantic schemas for Student CRUD and ML prediction payloads."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── Student Schemas ──
class ActiveSubjectResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class StudentBase(BaseModel):
    username: str
    email: str
    display_name: str
    avatar_url: Optional[str] = ""
    bio: Optional[str] = ""
    family_background: Optional[str] = ""
    parents_income_bracket: Optional[str] = ""
    parents_education: Optional[str] = ""
    has_internet_access: Optional[bool] = True
    travel_time_minutes: Optional[int] = 0


class StudentCreate(StudentBase):
    pass

class StudentOnboarding(BaseModel):
    institution_type: Optional[str] = ""
    education_stage: Optional[str] = ""
    level: int = 1
    daily_study_hours: float = 2.0
    sleep_hours: float = 8.0
    parents_income_bracket: Optional[str] = "middle"
    parents_education: Optional[str] = "high_school"
    subjects: list[str] = ["Mathematics", "Physics", "Chemistry", "Biology"]

class StudentResponse(StudentBase):
    id: int
    total_points: int
    current_streak: int
    longest_streak: int
    institution_type: str
    education_stage: str
    level: int
    is_admin: bool
    created_at: datetime
    active_subjects: list[ActiveSubjectResponse] = []

    class Config:
        from_attributes = True


# ── ML Prediction Request ──
class PredictionRequest(BaseModel):
    """All features fed into the ML engine for grade prediction."""
    # Academic
    internal_marks: float
    exam_scores: float
    attendance_pct: float
    daily_study_hours: float
    task_completion_rate: float

    # Personal / Biological
    sleep_hours: float
    physical_activity_level: str       # low/moderate/high
    health_conditions: Optional[str] = ""
    routine_adherence_pct: float

    # Socio-economic
    parents_income_bracket: str
    parents_education: str
    has_internet_access: bool

    # Psychological
    current_mood: str
    energy_level: int                  # 1-10


class PredictionResponse(BaseModel):
    predicted_grade: str
    confidence: float
    risk_level: str                    # low/medium/high
    action_items: list[str]
    trajectory_data: list[dict]        # Monthly performance points for charting


# ── Mood Log Schemas ──
class MoodLogCreate(BaseModel):
    mood: str
    energy_level: int
    notes: Optional[str] = ""


class MoodLogResponse(MoodLogCreate):
    id: int
    student_id: int
    logged_at: datetime

    class Config:
        from_attributes = True
