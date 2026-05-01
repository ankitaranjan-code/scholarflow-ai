import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

# Create directory if not exists
os.makedirs('backend/app/ml/models', exist_ok=True)

def generate_synthetic_data(num_samples=2000):
    np.random.seed(42)
    
    # Features
    internal_marks = np.random.uniform(30, 100, num_samples)
    exam_scores = np.random.uniform(30, 100, num_samples)
    attendance_pct = np.random.uniform(50, 100, num_samples)
    daily_study_hours = np.random.uniform(1, 8, num_samples)
    task_completion_rate = np.random.uniform(40, 100, num_samples)
    sleep_hours = np.random.uniform(4, 10, num_samples)
    physical_activity = np.random.choice(['low', 'moderate', 'high'], num_samples)
    routine_adherence = np.random.uniform(30, 100, num_samples)
    parents_income = np.random.choice(['low', 'medium', 'high'], num_samples)
    parents_education = np.random.choice(['High School', 'Graduate', 'Post-Graduate'], num_samples)
    internet_access = np.random.choice([True, False], num_samples)
    current_mood = np.random.choice(['happy', 'stressed', 'anxious', 'motivated', 'tired'], num_samples)
    energy_level = np.random.randint(1, 11, num_samples)
    
    # Target (Composite score with some noise and logical dependencies)
    # Weights for target generation
    base_score = (
        internal_marks * 0.25 + 
        exam_scores * 0.25 + 
        attendance_pct * 0.15 + 
        task_completion_rate * 0.15 + 
        daily_study_hours * 3.0
    )
    
    # Modifiers
    lifestyle_mod = np.where(sleep_hours < 6, -5, 0) + np.where(energy_level < 4, -4, 0)
    mood_mod = np.where(current_mood == 'motivated', 3, 0) + np.where(current_mood == 'stressed', -3, 0)
    
    noise = np.random.normal(0, 2, num_samples)
    
    final_score = base_score + lifestyle_mod + mood_mod + noise
    final_score = np.clip(final_score, 0, 100)
    
    df = pd.DataFrame({
        'internal_marks': internal_marks,
        'exam_scores': exam_scores,
        'attendance_pct': attendance_pct,
        'daily_study_hours': daily_study_hours,
        'task_completion_rate': task_completion_rate,
        'sleep_hours': sleep_hours,
        'physical_activity_level': physical_activity,
        'routine_adherence_pct': routine_adherence,
        'parents_income_bracket': parents_income,
        'parents_education': parents_education,
        'has_internet_access': internet_access,
        'current_mood': current_mood,
        'energy_level': energy_level,
        'final_score': final_score
    })
    
    return df

def train():
    print("Generating synthetic dataset...")
    df = generate_synthetic_data()
    
    X = df.drop('final_score', axis=1)
    y = df['final_score']
    
    # Preprocessing
    numeric_features = [
        'internal_marks', 'exam_scores', 'attendance_pct', 
        'daily_study_hours', 'task_completion_rate', 
        'sleep_hours', 'routine_adherence_pct', 'energy_level'
    ]
    categorical_features = [
        'physical_activity_level', 'parents_income_bracket', 
        'parents_education', 'has_internet_access', 'current_mood'
    ]
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ]
    )
    
    # Model Pipeline
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training model...")
    model.fit(X_train, y_train)
    
    # Eval
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model Training Complete.")
    print(f"MAE: {mae:.2f}")
    print(f"R2 Score: {r2:.2f}")
    
    # Save model
    model_path = 'backend/app/ml/models/student_performance_model.joblib'
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train()
