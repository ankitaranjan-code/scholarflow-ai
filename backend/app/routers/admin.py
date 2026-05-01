import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from ..database import get_db
from ..models.student import Student
from ..schemas.student import StudentResponse
from ..services.llm_service import llm_service
from ..core.dependencies import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

# ── Dependency to check admin access ──
def get_admin_user(current_user: Student = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ── User Management ──
@router.get("/users", response_model=List[StudentResponse])
def get_all_users(db: Session = Depends(get_db), admin: Student = Depends(get_admin_user)):
    return db.query(Student).all()

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: Student = Depends(get_admin_user)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = db.query(Student).filter(Student.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"status": "success", "message": "User deleted"}

@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, is_admin: bool, db: Session = Depends(get_db), admin: Student = Depends(get_admin_user)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    user = db.query(Student).filter(Student.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = is_admin
    db.commit()
    return {"status": "success", "message": "Role updated"}

# ── ML Data Management ──
@router.post("/ml/upload-data")
def upload_ml_data(file: UploadFile = File(...), admin: Student = Depends(get_admin_user)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    data_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    file_path = os.path.join(data_dir, 'student-mat.csv')
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Trigger Retraining (can be done asynchronously in a real app)
        import subprocess
        script_path = os.path.join(os.path.dirname(__file__), '..', 'ml', 'retrain.py')
        result = subprocess.run(['python', script_path], capture_output=True, text=True)
        
        # Reload the ML model in the app
        from ..services.ml_service import ml_engine
        ml_engine.load_model()
        
        return {
            "status": "success", 
            "message": "Dataset uploaded and model retrained successfully.",
            "retrain_logs": result.stdout
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process ML data: {str(e)}")

# ── Settings / API Keys ──
class ApiKeyUpdate(BaseModel):
    api_key: str

@router.get("/settings/api-key")
def get_api_key(admin: Student = Depends(get_admin_user)):
    # Return masked key
    key = llm_service.api_key
    masked = f"{key[:10]}...{key[-5:]}" if key and len(key) > 15 else ""
    return {"masked_key": masked, "is_configured": bool(key)}

@router.post("/settings/api-key")
def update_api_key(data: ApiKeyUpdate, admin: Student = Depends(get_admin_user)):
    if not data.api_key:
        raise HTTPException(status_code=400, detail="API key cannot be empty")
    llm_service.update_api_key(data.api_key)
    return {"status": "success", "message": "Gemini API key updated successfully"}
