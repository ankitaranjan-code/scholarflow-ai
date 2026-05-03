from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SubjectScoreBase(BaseModel):
    subject_name: str
    internal_marks: float = 0.0
    exam_score: float
    max_marks: float = 100.0

class SubjectScoreCreate(SubjectScoreBase):
    pass

class SubjectScoreResponse(SubjectScoreBase):
    id: int
    academic_record_id: int
    status: str
    icon_name: str
    color_accent: str
    percentage: float

    class Config:
        from_attributes = True

class AcademicRecordBase(BaseModel):
    semester: str
    attendance_pct: float
    daily_study_hours: float
    task_completion_rate: float

class AcademicRecordCreate(AcademicRecordBase):
    subjects: List[SubjectScoreCreate]

class AcademicRecordResponse(AcademicRecordBase):
    id: int
    student_id: int
    overall_grade: str
    predicted_grade: str
    confidence_score: float
    recorded_at: datetime
    subject_scores: List[SubjectScoreResponse] = []

    class Config:
        from_attributes = True
