"""
Chat API routes for the Empathetic LLM Companion.
Manages chat sessions and integrates with the LLM for contextual responses.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.chat import ChatMessageCreate, ChatMessageResponse, ChatSessionResponse
from ..models.chat import ChatSession, ChatMessage
from ..models.student import Student
from ..models.personal import MoodLog
from ..services.llm_service import llm_service
import json

router = APIRouter(prefix="/api/chat", tags=["LLM Companion"])

@router.post("/{student_id}/sessions", response_model=ChatSessionResponse)
def create_session(student_id: int, db: Session = Depends(get_db)):
    """Start a new chat session for the student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    session = ChatSession(student_id=student_id)
    db.add(session)
    db.flush()

    # Add a warm welcome message from the AI
    welcome = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=f"Hey {student.display_name}! 👋 How's it going today? I'm here to help with your studies, cheer you on, or just chat. What's on your mind?",
        message_type="text",
    )
    db.add(welcome)
    db.commit()
    db.refresh(session)
    return session


@router.get("/{student_id}/sessions", response_model=list[ChatSessionResponse])
def get_sessions(student_id: int, db: Session = Depends(get_db)):
    """Retrieve all chat sessions for a student."""
    sessions = (db.query(ChatSession)
                .filter(ChatSession.student_id == student_id)
                .order_by(ChatSession.updated_at.desc())
                .all())
    return sessions


@router.post("/{student_id}/sessions/{session_id}/message", response_model=ChatMessageResponse)
def send_message(student_id: int, session_id: int, data: ChatMessageCreate,
                 db: Session = Depends(get_db)):
    """
    Send a message to the AI companion and receive a contextual response.
    Uses Gemini LLM integration.
    """
    session = (db.query(ChatSession)
               .filter(ChatSession.id == session_id,
                       ChatSession.student_id == student_id)
               .first())
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=data.content,
        message_type="text",
    )
    db.add(user_msg)

    # Update session mode if specified
    if data.mode:
        session.mode = data.mode

    # ── Build context from student data ──
    student = db.query(Student).filter(Student.id == student_id).first()
    recent_moods = (db.query(MoodLog)
                    .filter(MoodLog.student_id == student_id)
                    .order_by(MoodLog.logged_at.desc())
                    .limit(3)
                    .all())

    context = {
        "display_name": student.display_name,
        "streak": student.current_streak,
        "points": student.total_points,
        "level": student.level,
        "recent_moods": [{"mood": m.mood, "energy": m.energy_level} for m in recent_moods],
        "mode": data.mode or session.mode,
    }

    # ── Generate AI response using Gemini ──
    ai_response = llm_service.generate_response(data.content, context, data.mode or session.mode)

    ai_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=ai_response,
        message_type="text",
        context_data=json.dumps(context),
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    return ai_msg
