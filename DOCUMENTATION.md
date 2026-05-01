# ScholarFlow AI: Complete Project Documentation

Welcome to the comprehensive guide to **ScholarFlow AI**, a modern, intelligent web application designed to track student performance, predict future outcomes using Machine Learning, and provide empathetic mentorship using a Large Language Model (Gemini).

This document serves as an educational guide on how this project was designed, architected, and built from scratch.

---

## 1. Architectural Overview

ScholarFlow AI is a Full-Stack Web Application built utilizing a decoupled architecture:
*   **Frontend (Client)**: A dynamic, single-page application built with React and Vite.
*   **Backend (Server)**: A fast, highly-concurrent API built with Python and FastAPI.
*   **Machine Learning Engine**: A predictive regression model built using Scikit-Learn.
*   **Generative AI Service**: A live integration with Google's Gemini LLM.
*   **Database**: A relational SQLite database managed via SQLAlchemy ORM.

### Folder Structure
```text
ScholarFlow/
│
├── frontend/                 # React application
│   ├── src/
│   │   ├── api/              # API Client (connects frontend to backend)
│   │   ├── components/       # Reusable UI components (Dashboard, Chat, Profile)
│   │   ├── context/          # React Context (AuthContext, StudentContext)
│   │   ├── pages/            # Page-level components
│   │   └── App.jsx           # Main React component & Routing
│   └── index.css             # Global styles and "Digital Oracle" design tokens
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── core/             # Security (JWT, Password Hashing)
│   │   ├── ml/               # Machine Learning scripts and trained models (.joblib)
│   │   ├── models/           # SQLAlchemy Database Models (Tables)
│   │   ├── routers/          # API Endpoints (Auth, Chat, Gamification, Students, Admin)
│   │   ├── schemas/          # Pydantic validation schemas (Input/Output data format)
│   │   └── services/         # Business logic (LLM Service, ML Service)
│   ├── data/                 # Raw datasets (e.g., student-mat.csv) and settings
│   ├── main.py               # Application entry point
│   └── requirements.txt      # Python dependencies
│
├── run.sh                    # Startup bash script
└── DOCUMENTATION.md          # This file
```

---

## 2. Phase-by-Phase Development Journey

The project was constructed logically across 5 major phases.

### Phase 1: Foundation & The "Digital Oracle" Frontend
**Goal:** Create a stunning, highly responsive user interface without relying on heavy CSS frameworks like Tailwind.
*   **Design System:** We utilized "Glassmorphism" — utilizing semi-transparent dark backgrounds (`rgba(0, 0, 0, 0.4)`), backdrop blurs (`backdrop-filter: blur(10px)`), and vibrant neon borders to create a futuristic, academic feel.
*   **State Management:** We built a centralized `StudentContext.jsx` to prevent "prop drilling." The context holds the student's current points, streak, and real-time ML predictions, making it accessible instantly to any component in the app.
*   **Mock to Real:** We initially built the frontend using mock JSON data to perfect the layout before connecting it to a live database.

### Phase 2: Security & Authentication
**Goal:** Ensure the app is secure, private, and capable of handling multiple distinct users.
*   **Password Hashing:** Storing raw passwords is a critical security vulnerability. In `backend/app/core/security.py`, we implemented `passlib` with the `bcrypt` algorithm. When a user registers, their password is irreversibly mathematically scrambled (hashed) before being saved to SQLite.
*   **JSON Web Tokens (JWT):** We implemented stateless authentication. When a user logs in successfully, FastAPI issues a cryptographically signed JWT. The React frontend stores this in `localStorage` and attaches it as a `Bearer` token to the headers of subsequent requests to prove the user's identity.

### Phase 3: Machine Learning Engine
**Goal:** Predict a student's final grade based on their study habits and socio-economic data.
*   **The Data:** We downloaded the famous UCI Machine Learning Repository's "Student Performance" dataset.
*   **The Model:** We chose a **Random Forest Regressor** (`backend/app/ml/retrain.py`). This algorithm builds hundreds of decision trees during training and averages their predictions. It's incredibly robust against overfitting and doesn't require massive amounts of data compared to Deep Learning neural networks.
*   **Feature Engineering:** We mapped real-world data (absences, study hours, parents' education) to mathematical values between 0 and 100.
*   **Integration:** We saved the trained model as a `.joblib` file. In `services/ml_service.py`, FastAPI loads this file into memory on startup and runs predictions in milliseconds when the frontend asks for them.

### Phase 4: Empathetic AI Companion (Gemini)
**Goal:** Give the student an intelligent mentor that understands their current context.
*   **Dynamic Prompting:** The `LLMService` in `services/llm_service.py` intercepts the student's chat message and wraps it in a "System Instruction". 
*   **Context Injection:** Before sending the message to Gemini, the backend queries the database for the student's current streak, points, and level. It tells the AI: *"You are talking to John. He has a 5-day streak and 840 points."* This makes the AI feel like a true companion rather than a generic chatbot.
*   **Mode Switching:** The user can select "Vent", "Study", or "Hype". We prepend instructions to Gemini based on the mode (e.g., "Be extremely high energy and motivational").

### Phase 5: Gamification, Social, & Admin Panel
**Goal:** Keep students engaged through dopamine loops and allow administrators to manage the platform.
*   **Routines & Streaks:** We built `gamification.py` to allow users to check off daily tasks. Checking off tasks updates the `RoutineCompletion` table and awards points.
*   **Global Leaderboard:** We built a SQL query to rank all users globally by `total_points` descending (`ORDER BY total_points DESC LIMIT 10`), rendering it in real-time in the Profile tab.
*   **Admin Dashboard:** We added an `is_admin` boolean to the `Student` database model. We then built a secure React view (`AdminPage.jsx`) that allows admins to view/delete users, dynamically upload new CSVs to retrain the ML model on the fly, and securely change the Gemini API key.

---

## 3. Key Concepts to Learn From This Codebase

If you are reading the code to learn, here are the most important technical concepts we utilized:

1.  **FastAPI Dependency Injection (`Depends`)**:
    *   Look at `backend/app/routers/admin.py`. You will see `Depends(get_admin_user)`. This guarantees that *before* the python function even runs, FastAPI checks the user's JWT token, verifies they exist, and verifies `is_admin == True`. If not, it automatically blocks the request.
2.  **React Context & Hooks (`useContext`, `useEffect`)**:
    *   Look at `frontend/src/context/AuthContext.jsx`. Notice how we use `useEffect` to check `localStorage` for a token the moment the app loads. We use `useContext(AuthContext)` across the app to instantly know if a user is logged in without passing variables down through 10 layers of components.
3.  **SQLAlchemy ORM**:
    *   Look at `backend/app/models/student.py`. Notice how we define tables as Python Classes. We never write raw SQL queries like `SELECT * FROM students`. Instead, we write `db.query(Student).all()`. This prevents SQL Injection attacks and makes the code vastly more readable.

---

## 4. How to Run the Project in the Future

Running this project requires starting both the backend (API) and the frontend (UI) servers. I have created an automated `run.sh` script to make this effortless.

### The Automated Way
1. Open your terminal.
2. Navigate to the project root: `cd /Users/ankitasharma/Documents/model`
3. Execute the startup script:
   ```bash
   ./run.sh
   ```
   *Note: If you get a permission denied error, run `chmod +x run.sh` first to make it executable.*
   
This script will start the Python backend in the background and launch the Vite development server in your terminal. When you press `Ctrl + C`, it will gracefully stop both.

### The Manual Way (If you want to view logs separately)

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```
*The backend will run at http://127.0.0.1:8000*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*The frontend will run at http://localhost:5173 (or 5174)*

---
*Built autonomously by ScholarFlow Architecture.*
