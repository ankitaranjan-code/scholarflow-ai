"""Pydantic schemas for Routine, Tasks, and Badge system."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── Routine Task Schemas ──
class TaskBase(BaseModel):
    title: str
    category: Optional[str] = "study"
    icon_name: Optional[str] = "check_circle"
    points_value: Optional[int] = 10
    time_slot: Optional[str] = ""
    order_index: Optional[int] = 0


class TaskCreate(TaskBase):
    pass


class TaskResponse(TaskBase):
    id: int
    routine_id: int
    is_completed_today: Optional[bool] = False

    class Config:
        from_attributes = True


# ── Routine Schemas ──
class RoutineCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    tasks: Optional[list[TaskCreate]] = []


class RoutineResponse(BaseModel):
    id: int
    student_id: int
    name: str
    description: str
    is_active: bool
    tasks: list[TaskResponse]
    completion_pct: Optional[float] = 0.0

    class Config:
        from_attributes = True


# ── Task Completion ──
class TaskCompletionRequest(BaseModel):
    task_id: int


class TaskCompletionResponse(BaseModel):
    task_id: int
    points_earned: int
    new_total_points: int
    streak_updated: bool
    badge_unlocked: Optional[str] = None


# ── Badge Schemas ──
class BadgeResponse(BaseModel):
    id: int
    name: str
    description: str
    icon_emoji: str
    category: str
    rarity: str
    earned_at: Optional[datetime] = None
    is_featured: Optional[int] = 0

    class Config:
        from_attributes = True


# ── Social / Profile ──
class PublicProfileResponse(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_url: str
    bio: str
    total_points: int
    current_streak: int
    longest_streak: int
    level: int
    badges: list[BadgeResponse]
    cheer_count: int


class CheerRequest(BaseModel):
    message: Optional[str] = "🎉 Keep it up!"
