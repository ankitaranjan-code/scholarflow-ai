import os
import sys

# Add parent dir to path so we can import from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE students ADD COLUMN institution_type VARCHAR(50) DEFAULT '';"))
            print("Added institution_type column")
        except Exception as e:
            print(f"Column institution_type might already exist: {e}")
            
        try:
            conn.execute(text("ALTER TABLE students ADD COLUMN education_stage VARCHAR(50) DEFAULT '';"))
            print("Added education_stage column")
        except Exception as e:
            print(f"Column education_stage might already exist: {e}")
            
        conn.commit()

if __name__ == "__main__":
    migrate()
