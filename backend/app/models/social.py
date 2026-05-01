"""
Social Models — Friendships and the 'Cheer' interaction system.
Enables the public profile card and social engagement features.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime, timezone
from ..database import Base


class Friendship(Base):
    """Bidirectional friendship link between two students."""
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    friend_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    status = Column(String(20), default="pending")         # pending/accepted/blocked
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Friendship({self.student_id} → {self.friend_id}, status='{self.status}')>"


class CheerLog(Base):
    """Records each 'Cheer' interaction from one student to another."""
    __tablename__ = "cheer_logs"

    id = Column(Integer, primary_key=True, index=True)
    from_student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    to_student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    message = Column(String(200), default="🎉 Keep it up!")
    cheered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<CheerLog({self.from_student_id} → {self.to_student_id})>"
