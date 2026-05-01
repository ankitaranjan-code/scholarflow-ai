import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

def retrain_model():
    print("Starting ML Retraining Pipeline with Real Data (UCI Student Performance)...")
    
    # 1. Load real data
    data_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'student-mat.csv')
    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at {data_path}")
        return
        
    df = pd.read_csv(data_path, sep=';') # UCI dataset uses semicolons
    print(f"Loaded dataset with {len(df)} records.")
    
    # 2. Map UCI columns to our platform's expected schema features
    # UCI mapping:
    # G1, G2, G3: grades 0-20. We will use (G1+G2)/2 as internal_marks proxy (scaled to 100), G3 as target (scaled to 100)
    # studytime: 1 (<2 hours), 2 (2 to 5 hours), 3 (5 to 10 hours), 4 (>10 hours). We map to ~hours.
    # absences: 0-93
    # health: 1 (very bad) to 5 (very good) -> mapped to our energy_level (1-10)
    # Medu, Fedu: 0 (none) to 4 (higher edu). We'll use max as a proxy for parents_education.
    
    mapped_df = pd.DataFrame()
    mapped_df['internal_marks'] = ((df['G1'] + df['G2']) / 2) * 5  # Scale 0-20 to 0-100
    mapped_df['exam_scores'] = ((df['G1'] + df['G2']) / 2) * 5     # Proxy since G3 is target
    
    # Convert studytime (1-4) to hours approx
    study_map = {1: 1.0, 2: 3.5, 3: 7.5, 4: 12.0}
    mapped_df['daily_study_hours'] = df['studytime'].map(study_map)
    
    mapped_df['attendance_pct'] = 100 - (df['absences'] / 93 * 100).clip(0, 100) # 93 is max possible absences in this dataset approx
    
    # Proxies for other features our app expects
    mapped_df['task_completion_rate'] = df['failures'].apply(lambda x: 100 if x == 0 else max(10, 100 - (x * 30)))
    
    # health (1-5) to sleep/energy proxy
    mapped_df['sleep_hours'] = df['health'].apply(lambda x: 4 + x) # 5-9 hours
    mapped_df['energy_level'] = df['health'] * 2 # 2-10
    
    # Categoricals
    mapped_df['physical_activity_level'] = df['goout'].apply(lambda x: 'high' if x > 3 else ('moderate' if x == 3 else 'low'))
    mapped_df['health_conditions'] = df['health'].apply(lambda x: 'poor_health' if x < 3 else '')
    mapped_df['routine_adherence_pct'] = 100 - (df['Dalc'] + df['Walc'] - 2) * 10 # lower alcohol = higher routine
    
    # Socio-economic
    mapped_df['parents_income_bracket'] = np.where(df['internet'] == 'yes', 'medium', 'low') # Proxy
    edu_map = {0: 'None', 1: 'Primary', 2: 'Middle', 3: 'High School', 4: 'Graduate'}
    mapped_df['parents_education'] = df[['Medu', 'Fedu']].max(axis=1).map(edu_map)
    mapped_df['has_internet_access'] = df['internet'] == 'yes'
    
    # Psychological
    mapped_df['current_mood'] = df['health'].apply(lambda x: 'motivated' if x > 3 else 'stressed')
    
    # Target
    y = df['G3'] * 5 # Final grade scaled 0-100
    X = mapped_df
    
    # 3. Preprocessing
    numeric_features = [
        'internal_marks', 'exam_scores', 'attendance_pct', 'daily_study_hours',
        'task_completion_rate', 'sleep_hours', 'routine_adherence_pct', 'energy_level'
    ]
    categorical_features = [
        'physical_activity_level', 'health_conditions', 
        'parents_income_bracket', 'parents_education', 'has_internet_access', 'current_mood'
    ]
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ]
    )
    
    # 4. Model Training (RandomForest is robust, XGBoost if available)
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42))
    ])
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training model on real student data...")
    model.fit(X_train, y_train)
    
    # 5. Evaluate
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    
    print(f"\n--- Model Evaluation (Real Data) ---")
    print(f"R2 Score: {r2:.4f}")
    print(f"Mean Absolute Error: {mae:.2f} points (out of 100)")
    
    # Extract Feature Importances
    feature_names = numeric_features + list(model.named_steps['preprocessor'].named_transformers_['cat'].get_feature_names_out(categorical_features))
    importances = model.named_steps['regressor'].feature_importances_
    
    print("\n--- Top 5 Most Important Features ---")
    feat_imps = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)[:5]
    for feat, imp in feat_imps:
        print(f"{feat}: {imp:.4f}")
    
    # 6. Save Model
    model_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'student_performance_model.joblib')
    
    joblib.dump(model, model_path)
    print(f"\nModel saved successfully to {model_path}")

if __name__ == "__main__":
    retrain_model()
