"""
ScholarFlow AI — Main FastAPI Application

The central entry point that wires up:
  • Database table creation
  • CORS for React frontend
  • All API routers (Students/ML, Gamification, Chat)
  • Seed data for badges
"""
try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from .database import engine, Base, SessionLocal
    from .routers import students, gamification, chat, auth, admin, academics
    from .models import *
    print("[MAIN] All modules imported successfully.")
except Exception as e:
    print(f"[CRITICAL ERROR] Failed to import modules or routers: {e}")
    import traceback
    traceback.print_exc()
    # Create a dummy app so the server at least starts and logs the error
    from fastapi import FastAPI
    app = FastAPI()

# ── Create Tables ──
try:
    Base.metadata.create_all(bind=engine)
    print("[DB] Tables verified/created successfully.")
except Exception as e:
    print(f"[DB] Warning: Could not create tables on startup: {e}")
    import traceback
    traceback.print_exc()

# ── Application Instance ──
app = FastAPI(
    title="ScholarFlow AI",
    description="Student Performance & Mentorship Platform — Predictive ML, Gamification, and Empathetic AI",
    version="1.0.0",
)

# ── Health Check (for Render) ──
@app.get("/")
@app.head("/")
def root():
    return {
        "name": "ScholarFlow AI",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
    }

# ── CORS (allow React dev server and Vercel) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ──
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(gamification.router)
app.include_router(chat.router)
app.include_router(admin.router)
app.include_router(academics.router, prefix="/api/students", tags=["Academics"])


# ── Seed Default Badges on Startup ──
@app.on_event("startup")
def seed_badges():
    """Populate the badge table with default achievements if empty."""
    try:
        db = SessionLocal()
        try:
            from .models.badge import Badge
            # This query will fail if the database is unreachable
            if db.query(Badge).count() == 0:
                default_badges = [
                    Badge(name="First Steps", description="Earn your first 100 points",
                          icon_emoji="🌱", category="milestone", requirement_type="points_total",
                          requirement_value=100, rarity="common", points_reward=25),
                    Badge(name="Rising Scholar", description="Accumulate 500 points",
                          icon_emoji="📚", category="milestone", requirement_type="points_total",
                          requirement_value=500, rarity="common", points_reward=50),
                    Badge(name="Knowledge Seeker", description="Reach 1000 points",
                          icon_emoji="🔬", category="milestone", requirement_type="points_total",
                          requirement_value=1000, rarity="rare", points_reward=100),
                    Badge(name="Academic Warrior", description="Reach 2500 points",
                          icon_emoji="⚔️", category="milestone", requirement_type="points_total",
                          requirement_value=2500, rarity="epic", points_reward=200),
                    Badge(name="7-Day Warrior", description="Maintain a 7-day streak",
                          icon_emoji="🔥", category="streak", requirement_type="streak_days",
                          requirement_value=7, rarity="common", points_reward=75),
                    Badge(name="30-Day Legend", description="Maintain a 30-day streak",
                          icon_emoji="🏆", category="streak", requirement_type="streak_days",
                          requirement_value=30, rarity="epic", points_reward=300),
                    Badge(name="Early Bird", description="Complete morning routine 5 days in a row",
                          icon_emoji="🌅", category="wellness", requirement_type="task_count",
                          requirement_value=5, rarity="common", points_reward=50),
                    Badge(name="Night Owl Scholar", description="Log 3+ study hours after 8 PM for a week",
                          icon_emoji="🦉", category="academic", requirement_type="task_count",
                          requirement_value=7, rarity="rare", points_reward=100),
                    Badge(name="Zen Master", description="Log positive mood for 14 consecutive days",
                          icon_emoji="🧘", category="wellness", requirement_type="streak_days",
                          requirement_value=14, rarity="rare", points_reward=150),
                    Badge(name="Social Butterfly", description="Receive 50 cheers from friends",
                          icon_emoji="🦋", category="social", requirement_type="cheer_count",
                          requirement_value=50, rarity="legendary", points_reward=500),
                ]
                db.add_all(default_badges)
                db.commit()
                print("[SEED] Badges seeded successfully.")
        except Exception as e:
            print(f"[SEED] Warning: Could not seed badges: {e}")
        finally:
            db.close()
    except Exception as e:
        print(f"[SEED] Critical: Could not even initialize DB session for seeding: {e}")


