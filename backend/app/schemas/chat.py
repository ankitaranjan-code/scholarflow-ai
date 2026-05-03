"""Pydantic schemas for the Empathetic LLM Companion chat system."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ChatMessageCreate(BaseModel):
    content: str
    mode: Optional[str] = "casual"     # casual/hype/study/vent


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    message_type: str
    sent_at: datetime

    class Config:
        from_attributes = True


class ChatSessionResponse(BaseModel):
    id: int
    title: str
    mode: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageResponse]

    class Config:
        from_attributes = True


class ChatContextData(BaseModel):
    """Context injected into the LLM from the student's data."""
    upcoming_exams: list[dict]
    pending_tasks: list[str]
    recent_moods: list[dict]
    current_streak: int
    predicted_grade: str


class GenerateRoutineRequest(BaseModel):
    description: str


class RoutineTaskSchema(BaseModel):
    title: str
    category: str
    icon: str
    points: int
    timeSlot: str

class GenerateRoutineResponse(BaseModel):
    tasks: list[RoutineTaskSchema]
