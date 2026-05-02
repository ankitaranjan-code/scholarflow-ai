from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.student import Student
from ..models.academics import AcademicRecord, SubjectScore
from ..schemas.academics import AcademicRecordCreate, AcademicRecordResponse
from ..services.ml_service import ml_engine
from ..services.llm_service import gemini_mentor
from ..schemas.student import PredictionRequest

router = APIRouter()

@router.get("/{student_id}/academic-records", response_model=List[AcademicRecordResponse])
def get_academic_records(student_id: int, db: Session = Depends(get_db)):
    """Fetch all historical academic records for a student."""
    records = db.query(AcademicRecord).filter(AcademicRecord.student_id == student_id).order_by(AcademicRecord.recorded_at.asc()).all()
    return records

@router.post("/{student_id}/academic-records", response_model=AcademicRecordResponse)
async def create_academic_record(student_id: int, record_data: AcademicRecordCreate, db: Session = Depends(get_db)):
    """Log new marks, trigger ML prediction, and save."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 1. Calculate Average Scores for the ML Model
    if not record_data.subjects:
        raise HTTPException(status_code=400, detail="Must provide at least one subject score")
    
    total_internal = sum(s.internal_marks for s in record_data.subjects)
    total_exam = sum(s.exam_score for s in record_data.subjects)
    avg_internal = total_internal / len(record_data.subjects)
    avg_exam = total_exam / len(record_data.subjects)
    
    # Calculate an overall percentage for the record based on subject averages
    # Assuming each subject has internal and exam, and max is 100 for each (200 total per subject)
    # The max_marks from the schema is per section (internal/exam), usually 100.
    avg_total_pct = ((avg_internal + avg_exam) / 200.0) * 100

    # 2. Prepare ML Features
    # In a real app, some of these would be dynamic from other tables (like sleep, mood).
    # For this dashboard update, we are taking them from the AcademicRecordCreate (study hours) 
    # and student profile.
    features = PredictionRequest(
        internal_marks=avg_internal,
        exam_scores=avg_exam,
        attendance_pct=record_data.attendance_pct,
        daily_study_hours=record_data.daily_study_hours,
        task_completion_rate=record_data.task_completion_rate,
        sleep_hours=7.5, # default or fetch from habits
        physical_activity_level='moderate',
        routine_adherence_pct=80.0,
        parents_income_bracket=student.parents_income_bracket or 'medium',
        parents_education=student.parents_education or 'Graduate',
        has_internet_access=student.has_internet_access,
        current_mood='motivated',
        energy_level=7
    )

    # 3. Call ML Engine
    try:
        prediction = ml_engine.predict(features)
        predicted_grade = prediction["predicted_grade"]
        confidence = prediction["confidence"]
    except Exception as e:
        # Fallback if ML model fails or isn't trained
        predicted_grade = "B"
        confidence = 0.75

    # 4. Save to Database
    db_record = AcademicRecord(
        student_id=student_id,
        semester=record_data.semester,
        attendance_pct=record_data.attendance_pct,
        daily_study_hours=record_data.daily_study_hours,
        task_completion_rate=record_data.task_completion_rate,
        overall_grade=f"{avg_total_pct:.1f}%", # Storing the actual percentage as the overall grade string for the graph
        predicted_grade=predicted_grade,
        confidence_score=confidence
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    # 5. Save Subject Scores
    for subj in record_data.subjects:
        # Determine status/color dynamically
        pct = ((subj.internal_marks + subj.exam_score) / (subj.max_marks * 2)) * 100
        status = "steady"
        color = "primary"
        if pct < 75:
            status = "critical"
            color = "error"
        elif pct > 90:
            status = "peak"
            color = "success"

        db_subj = SubjectScore(
            academic_record_id=db_record.id,
            subject_name=subj.subject_name,
            internal_marks=subj.internal_marks,
            exam_score=subj.exam_score,
            max_marks=subj.max_marks,
            status=status,
            color_accent=color
        )
        db.add(db_subj)
    
    db.commit()
    db.refresh(db_record)
    return db_record

@router.put("/{student_id}/academic-records/{record_id}", response_model=AcademicRecordResponse)
async def update_academic_record(student_id: int, record_id: int, record_data: AcademicRecordCreate, db: Session = Depends(get_db)):
    """Update an existing record, re-trigger ML prediction, and save."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db_record = db.query(AcademicRecord).filter(AcademicRecord.id == record_id, AcademicRecord.student_id == student_id).first()
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")

    if not record_data.subjects:
        raise HTTPException(status_code=400, detail="Must provide at least one subject score")
    
    total_internal = sum(s.internal_marks for s in record_data.subjects)
    total_exam = sum(s.exam_score for s in record_data.subjects)
    avg_internal = total_internal / len(record_data.subjects)
    avg_exam = total_exam / len(record_data.subjects)
    avg_total_pct = ((avg_internal + avg_exam) / 200.0) * 100

    features = PredictionRequest(
        internal_marks=avg_internal,
        exam_scores=avg_exam,
        attendance_pct=record_data.attendance_pct,
        daily_study_hours=record_data.daily_study_hours,
        task_completion_rate=record_data.task_completion_rate,
        sleep_hours=7.5,
        physical_activity_level='moderate',
        routine_adherence_pct=80.0,
        parents_income_bracket=student.parents_income_bracket or 'medium',
        parents_education=student.parents_education or 'Graduate',
        has_internet_access=student.has_internet_access,
        current_mood='motivated',
        energy_level=7
    )

    try:
        prediction = ml_engine.predict(features)
        predicted_grade = prediction["predicted_grade"]
        confidence = prediction["confidence"]
    except Exception as e:
        predicted_grade = "B"
        confidence = 0.75

    db_record.semester = record_data.semester
    db_record.attendance_pct = record_data.attendance_pct
    db_record.daily_study_hours = record_data.daily_study_hours
    db_record.task_completion_rate = record_data.task_completion_rate
    db_record.overall_grade = f"{avg_total_pct:.1f}%"
    db_record.predicted_grade = predicted_grade
    db_record.confidence_score = confidence

    # Delete old subjects and insert new ones
    db.query(SubjectScore).filter(SubjectScore.academic_record_id == db_record.id).delete()

    for subj in record_data.subjects:
        pct = ((subj.internal_marks + subj.exam_score) / (subj.max_marks * 2)) * 100
        status = "steady"
        color = "primary"
        if pct < 75:
            status = "critical"
            color = "error"
        elif pct > 90:
            status = "peak"
            color = "success"

        db_subj = SubjectScore(
            academic_record_id=db_record.id,
            subject_name=subj.subject_name,
            internal_marks=subj.internal_marks,
            exam_score=subj.exam_score,
            max_marks=subj.max_marks,
            status=status,
            color_accent=color
        )
        db.add(db_subj)

    db.commit()
    db.refresh(db_record)
    return db_record
