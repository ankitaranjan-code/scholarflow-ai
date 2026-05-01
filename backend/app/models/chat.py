"""
Chat Models — Stores conversation sessions and individual messages
for the Empathetic LLM Companion.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class ChatSession(Base):
    """A conversation thread between a student and the AI companion."""
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    title = Column(String(150), default="New Chat")
    mode = Column(String(20), default="casual")            # casual/hype/study/vent
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # ── Relationships ──
    student = relationship("Student", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ChatSession(id={self.id}, mode='{self.mode}')>"


class ChatMessage(Base):
    """A single message in a chat session — from user or AI."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False, index=True)
    role = Column(String(10), nullable=False)              # "user" or "assistant"
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default="text")      # text/notification/alert/motivation
    context_data = Column(Text, default="")                # JSON string with exam/task context
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # ── Relationships ──
    session = relationship("ChatSession", back_populates="messages")

    def __repr__(self):
        return f"<ChatMessage(session={self.session_id}, role='{self.role}')>"
