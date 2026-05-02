"""
Student & ML Prediction API routes.
Handles CRUD for students, mood logging, and the ML prediction engine endpoint.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.student import (
    StudentCreate, StudentResponse,
    PredictionRequest, PredictionResponse,
    MoodLogCreate, MoodLogResponse,
)
from ..models.student import Student
from ..models.personal import MoodLog

from ..services.ml_service import ml_service

router = APIRouter(prefix="/api/students", tags=["Students & ML"])


@router.post("/", response_model=StudentResponse)
def create_student(data: StudentCreate, db: Session = Depends(get_db)):
    """Register a new student on the platform."""
    existing = db.query(Student).filter(Student.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    student = Student(**data.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    """Retrieve a student's full profile by ID."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

from ..schemas.student import StudentOnboarding

from ..models.student import ActiveSubject

@router.put("/{student_id}/onboarding", response_model=StudentResponse)
def update_student_onboarding(student_id: int, data: StudentOnboarding, db: Session = Depends(get_db)):
    """Complete user onboarding and set initial variables for ML predictions."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student.level = data.level
    student.parents_income_bracket = data.parents_income_bracket
    student.parents_education = data.parents_education
    
    # Save active subjects
    for subj_name in data.subjects:
        active_subj = ActiveSubject(student_id=student.id, name=subj_name)
        db.add(active_subj)

    db.commit()
    db.refresh(student)
    return student


@router.post("/predict", response_model=PredictionResponse)
def predict_performance(data: PredictionRequest):
    """
    ML Prediction Endpoint — accepts student features and returns
    a predicted grade, confidence, risk level, and action plan.

    Now uses a trained Scikit-Learn RandomForest model.
    """
    # ── Inference using Trained Model ──
    # Map input to model feature names
    features = {
        'internal_marks': data.internal_marks,
        'exam_scores': data.exam_scores,
        'attendance_pct': data.attendance_pct,
        'daily_study_hours': data.daily_study_hours,
        'task_completion_rate': data.task_completion_rate,
        'sleep_hours': data.sleep_hours,
        'physical_activity_level': data.physical_activity_level,
        'routine_adherence_pct': data.routine_adherence_pct,
        'parents_income_bracket': data.parents_income_bracket,
        'parents_education': data.parents_education,
        'has_internet_access': data.has_internet_access,
        'current_mood': data.current_mood,
        'energy_level': data.energy_level
    }
    
    result = ml_service.predict(features)
    final_score = result['score']

    # Generate context-aware action items (Logic remains similar but can be refined)
    actions = []
    if data.daily_study_hours < 3:
        actions.append("Increase daily study hours to at least 3 hours.")
    if data.sleep_hours < 7:
        actions.append("Aim for 7-8 hours of sleep for better cognitive performance.")
    if data.attendance_pct < 80:
        actions.append("Improve class attendance — each missed class compounds knowledge gaps.")
    if data.current_mood in ("stressed", "anxious"):
        actions.append("Consider a 10-min daily meditation or breathing exercise.")
    if data.physical_activity_level == "low":
        actions.append("Add 20 minutes of light exercise to boost focus and energy.")
    if not actions:
        actions.append("You're on a great track! Maintain consistency for peak results.")

    # Simulated trajectory data for charting
    trajectory = [
        {"month": "Jan", "score": max(final_score - 15, 40)},
        {"month": "Feb", "score": max(final_score - 10, 45)},
        {"month": "Mar", "score": max(final_score - 5, 50)},
        {"month": "Apr", "score": final_score},
        {"month": "May", "score": min(final_score + 3, 100)},
        {"month": "Jun", "score": min(final_score + 6, 100)},
    ]

    return PredictionResponse(
        predicted_grade=result['predicted_grade'],
        confidence=result['confidence'],
        risk_level=result['risk_level'],
        action_items=actions,
        trajectory_data=trajectory,
    )


# ── Mood Logging ──
@router.post("/{student_id}/mood", response_model=MoodLogResponse)
def log_mood(student_id: int, data: MoodLogCreate, db: Session = Depends(get_db)):
    """Log a daily mood entry for the student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    log = MoodLog(student_id=student_id, **data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/{student_id}/mood", response_model=list[MoodLogResponse])
def get_mood_logs(student_id: int, limit: int = 7, db: Session = Depends(get_db)):
    """Retrieve recent mood logs for the student."""
    logs = (db.query(MoodLog)
            .filter(MoodLog.student_id == student_id)
            .order_by(MoodLog.logged_at.desc())
            .limit(limit)
            .all())
    return logs


# ── Active Subject Management ──
from pydantic import BaseModel

class SubjectAddRequest(BaseModel):
    name: str

@router.post("/{student_id}/subjects")
def add_active_subject(student_id: int, data: SubjectAddRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    active_subj = ActiveSubject(student_id=student.id, name=data.name)
    db.add(active_subj)
    db.commit()
    db.refresh(active_subj)
    return active_subj

@router.delete("/{student_id}/subjects/{subject_id}")
def delete_active_subject(student_id: int, subject_id: int, db: Session = Depends(get_db)):
    subj = db.query(ActiveSubject).filter(ActiveSubject.id == subject_id, ActiveSubject.student_id == student_id).first()
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    db.delete(subj)
    db.commit()
    return {"status": "deleted"}
