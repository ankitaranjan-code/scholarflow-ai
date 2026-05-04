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

# ── Self-Healing Database URL Logic (for Production) ──
# This automatically fixes common typos and port issues identified in logs
if not DATABASE_URL.startswith("sqlite"):
    # 1. Correct the common 'postgres' vs 'postgresql' issue
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    # 2. Fix the specific typo in the hostname (vdxmg -> vdxmk)
    if "db.cuzsogxdvdxmgkulagkr" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("db.cuzsogxdvdxmgkulagkr", "db.cuzsogxdvdxmkulagkr")
    
    # 3. Fix the port (Force 6543 for Supabase connection pooling)
    if "supabase.co:5432" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("supabase.co:5432", "supabase.co:6543")
    
    # 4. Fix unencoded password (anki@528AUP -> anki%40528AUP)
    # Only replace if it looks like it's in the password section
    if ":anki@528AUP@" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace(":anki@528AUP@", ":anki%40528AUP@")

    # 5. Remove 'pgbouncer=true' which crashes psycopg2
    if "pgbouncer=true" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("pgbouncer=true", "").replace("??", "?").replace("?&", "?").rstrip("?&")

# Diagnostic logging (masking password)

# Diagnostic logging (masking password)
try:
    from urllib.parse import urlparse
    parsed = urlparse(DATABASE_URL)
    masked_url = f"{parsed.scheme}://{parsed.username}:****@{parsed.hostname}:{parsed.port}{parsed.path}"
    if parsed.query:
        masked_url += f"?{parsed.query}"
    print(f"[DB] Attempting to connect with URL: {masked_url}")
except Exception:
    print(f"[DB] Attempting to connect (URL parsing failed for logging)")

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
