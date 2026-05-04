"""
Database configuration and session management for ScholarFlow AI.
Uses SQLAlchemy with SQLite for local development.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv() # Load variables from .env if present

# Fallback to local SQLite if no DATABASE_URL is provided (e.g. from Supabase)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./scholarflow.db")

# PostgreSQL fix: Supabase/Heroku often give 'postgres://' which SQLAlchemy requires 'postgresql://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Remove 'pgbouncer=true' or other query params that psycopg2 doesn't like
if "?" in DATABASE_URL:
    base_url, query = DATABASE_URL.split("?", 1)
    # Keep other params if needed, but remove pgbouncer which is known to cause 'invalid dsn'
    params = [p for p in query.split("&") if not p.startswith("pgbouncer=")]
    if params:
        DATABASE_URL = f"{base_url}?{'&'.join(params)}"
    else:
        DATABASE_URL = base_url

# SQLite requires check_same_thread=False, but PostgreSQL does not.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Production settings for PostgreSQL (Supabase/Render)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,    # Check connection health before use
        pool_recycle=300,      # Recycle connections every 5 minutes to avoid idle timeouts
        connect_args={"connect_timeout": 10} # Don't hang forever on connection failure
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to provide a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
