#!/bin/bash

# ScholarFlow AI - Startup Script

echo "====================================="
echo "🚀 Starting ScholarFlow AI..."
echo "====================================="

# 1. Start the Backend (FastAPI)
echo "Starting FastAPI Backend on http://127.0.0.1:8000..."
cd backend
source venv/bin/activate
# Start uvicorn in the background
nohup uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend is running (PID: $BACKEND_PID). Logs are in backend/backend.log"
cd ..

# 2. Wait a moment for backend to initialize
sleep 2

# 3. Start the Frontend (Vite/React)
echo "Starting React Frontend on http://localhost:5173..."
cd frontend
# Run npm dev server
npm run dev

# Note: The script will hold here because npm run dev is an interactive process.
# When you press Ctrl+C to stop the frontend, it will automatically kill the backend.

# Cleanup trap to kill backend when frontend stops
trap "kill $BACKEND_PID" EXIT
