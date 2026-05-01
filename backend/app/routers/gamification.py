"""
Gamification & Routine API routes.
Handles routine CRUD, task completion, badge awards, and social profile.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from ..database import get_db
from ..schemas.routine import (
    RoutineCreate, RoutineResponse,
    TaskCompletionRequest, TaskCompletionResponse,
    BadgeResponse, PublicProfileResponse, CheerRequest,
)
from ..models.student import Student
from ..models.routine import Routine, RoutineTask, RoutineCompletion
from ..models.badge import Badge, StudentBadge
from ..models.social import CheerLog

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])


@router.post("/{student_id}/routines", response_model=RoutineResponse)
def create_routine(student_id: int, data: RoutineCreate, db: Session = Depends(get_db)):
    """Create a new daily routine with tasks for a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    routine = Routine(student_id=student_id, name=data.name, description=data.description)
    db.add(routine)
    db.flush()

    for i, task_data in enumerate(data.tasks):
        task = RoutineTask(
            routine_id=routine.id,
            order_index=i,
            **task_data.model_dump()
        )
        db.add(task)

    db.commit()
    db.refresh(routine)
    return _build_routine_response(routine, student_id, db)


@router.get("/{student_id}/routines", response_model=list[RoutineResponse])
def get_routines(student_id: int, db: Session = Depends(get_db)):
    """Get all active routines for a student with today's completion status."""
    routines = (db.query(Routine)
                .filter(Routine.student_id == student_id, Routine.is_active == True)
                .all())
    return [_build_routine_response(r, student_id, db) for r in routines]


@router.post("/{student_id}/complete-task", response_model=TaskCompletionResponse)
def complete_task(student_id: int, data: TaskCompletionRequest, db: Session = Depends(get_db)):
    """Mark a routine task as completed and award points."""
    task = db.query(RoutineTask).filter(RoutineTask.id == data.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    existing = (db.query(RoutineCompletion)
                .filter(RoutineCompletion.task_id == data.task_id,
                        RoutineCompletion.student_id == student_id,
                        RoutineCompletion.date_key == today)
                .first())
    if existing:
        raise HTTPException(status_code=400, detail="Task already completed today")

    # Record completion
    completion = RoutineCompletion(
        task_id=data.task_id,
        student_id=student_id,
        date_key=today,
        points_earned=task.points_value,
    )
    db.add(completion)

    # Update student points
    student = db.query(Student).filter(Student.id == student_id).first()
    student.total_points += task.points_value

    # Check for badge unlocks (simplified streak-based check)
    badge_unlocked = _check_badge_unlock(student, db)

    db.commit()

    return TaskCompletionResponse(
        task_id=data.task_id,
        points_earned=task.points_value,
        new_total_points=student.total_points,
        streak_updated=True,
        badge_unlocked=badge_unlocked,
    )


@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    """Fetch the top 10 students globally ranked by total points."""
    top_students = (db.query(Student)
                    .order_by(Student.total_points.desc())
                    .limit(10)
                    .all())
    
    return [
        {
            "id": s.id,
            "rank": idx + 1,
            "username": s.username,
            "display_name": s.display_name,
            "level": s.level,
            "total_points": s.total_points,
            "current_streak": s.current_streak,
        }
        for idx, s in enumerate(top_students)
    ]


# ── Social Profile & Cheering ──
@router.get("/profile/{student_id}", response_model=PublicProfileResponse)
def get_public_profile(student_id: int, db: Session = Depends(get_db)):
    """Retrieve the public-facing profile card for a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Get earned badges
    student_badges = (db.query(StudentBadge)
                      .filter(StudentBadge.student_id == student_id)
                      .all())
    badges = []
    for sb in student_badges:
        badge = db.query(Badge).filter(Badge.id == sb.badge_id).first()
        if badge:
            badges.append(BadgeResponse(
                id=badge.id, name=badge.name, description=badge.description,
                icon_emoji=badge.icon_emoji, category=badge.category,
                rarity=badge.rarity, earned_at=sb.earned_at,
                is_featured=sb.is_featured,
            ))

    cheer_count = (db.query(CheerLog)
                   .filter(CheerLog.to_student_id == student_id)
                   .count())

    return PublicProfileResponse(
        id=student.id, username=student.username,
        display_name=student.display_name, avatar_url=student.avatar_url,
        bio=student.bio, total_points=student.total_points,
        current_streak=student.current_streak,
        longest_streak=student.longest_streak,
        level=student.level, badges=badges,
        cheer_count=cheer_count,
    )


@router.post("/profile/{student_id}/cheer")
def send_cheer(student_id: int, data: CheerRequest, db: Session = Depends(get_db)):
    """Send a 'Cheer' interaction to a friend's profile."""
    # In production, from_student_id comes from auth context
    cheer = CheerLog(
        from_student_id=0,  # Placeholder — replace with authenticated user ID
        to_student_id=student_id,
        message=data.message,
    )
    db.add(cheer)
    db.commit()
    return {"status": "cheered", "message": data.message}


# ── Helper Functions ──
def _build_routine_response(routine: Routine, student_id: int, db: Session) -> RoutineResponse:
    """Build a RoutineResponse with today's completion status."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    tasks = []
    completed_count = 0
    for task in routine.tasks:
        is_done = (db.query(RoutineCompletion)
                   .filter(RoutineCompletion.task_id == task.id,
                           RoutineCompletion.student_id == student_id,
                           RoutineCompletion.date_key == today)
                   .first()) is not None
        if is_done:
            completed_count += 1
        tasks.append({
            "id": task.id, "routine_id": task.routine_id,
            "title": task.title, "category": task.category,
            "icon_name": task.icon_name, "points_value": task.points_value,
            "time_slot": task.time_slot, "order_index": task.order_index,
            "is_completed_today": is_done,
        })

    total = len(routine.tasks) or 1
    return RoutineResponse(
        id=routine.id, student_id=routine.student_id,
        name=routine.name, description=routine.description,
        is_active=routine.is_active, tasks=tasks,
        completion_pct=round((completed_count / total) * 100, 1),
    )


def _check_badge_unlock(student: Student, db: Session) -> str | None:
    """Check if the student qualifies for any new badges."""
    # Simple example: points-based badges
    thresholds = [
        (100, "First Steps"),
        (500, "Rising Scholar"),
        (1000, "Knowledge Seeker"),
        (2500, "Academic Warrior"),
    ]
    for points_req, badge_name in thresholds:
        if student.total_points >= points_req:
            badge = db.query(Badge).filter(Badge.name == badge_name).first()
            if badge:
                existing = (db.query(StudentBadge)
                            .filter(StudentBadge.student_id == student.id,
                                    StudentBadge.badge_id == badge.id)
                            .first())
                if not existing:
                    sb = StudentBadge(student_id=student.id, badge_id=badge.id)
                    db.add(sb)
                    return badge_name
    return None
