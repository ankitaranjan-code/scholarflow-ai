import joblib
import pandas as pd
import os
from typing import Dict, Any

# Path to the serialized model
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'ml', 'models', 'student_performance_model.joblib')

class MLService:
    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                print(f"ML Model loaded successfully from {MODEL_PATH}")
            except Exception as e:
                print(f"Error loading ML model: {e}")
        else:
            print(f"ML Model file not found at {MODEL_PATH}")

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        if self.model is None:
            # Fallback to simple logic if model fails to load
            return self._fallback_predict(features)
        
        try:
            # Convert input features to DataFrame for scikit-learn
            # The keys must match exactly the training columns
            df = pd.DataFrame([features])
            
            # Predict
            score = self.model.predict(df)[0]
            score = max(0, min(100, float(score)))
            
            # Grade mapping
            grade, risk = self._get_grade_and_risk(score)
            
            return {
                "predicted_grade": grade,
                "score": round(score, 1),
                "risk_level": risk,
                "confidence": 0.85 # Placeholder for model confidence
            }
        except Exception as e:
            print(f"Prediction error: {e}")
            return self._fallback_predict(features)

    def _get_grade_and_risk(self, score):
        if score >= 90: return "A+", "low"
        if score >= 80: return "A", "low"
        if score >= 70: return "B+", "medium"
        if score >= 60: return "B", "medium"
        if score >= 50: return "C", "high"
        return "D", "high"

    def _fallback_predict(self, data):
        # Basic rule-based fallback
        score = (data.get('internal_marks', 50) * 0.4 + data.get('exam_scores', 50) * 0.6)
        grade, risk = self._get_grade_and_risk(score)
        return {
            "predicted_grade": grade,
            "score": round(score, 1),
            "risk_level": risk,
            "confidence": 0.5
        }

# Global instance
ml_service = MLService()
