# ScholarFlow AI

Welcome to ScholarFlow AI! This repository contains both the Frontend (React/Vite) and the Backend (Python/FastAPI) of the platform.

## How to Run Locally

If you are cloning this repository to run it on your own machine, follow these simple steps:

### Prerequisites
- Python 3.10+
- Node.js (v18+)
- npm

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ankitaranjan-code/scholarflow-ai.git
   cd scholarflow-ai
   ```

2. **Set up the Environment Variables:**
   - Navigate into the `backend` folder.
   - Copy the `.env.example` file and rename it to `.env`.
   - Update the `DATABASE_URL` with the correct Supabase password.
   - *(Note: Ensure the password is URL-encoded if it contains special characters like `@`)*

3. **Start the Application:**
   From the root of the project (where this README is), simply run the startup script:
   ```bash
   ./run.sh
   ```
   *This script will automatically set up the Python virtual environment, install the backend dependencies, install the frontend dependencies, and start both servers!*

4. **Access the App:**
   Open your browser and navigate to `http://localhost:5173`. 
   - The backend API will be running on `http://127.0.0.1:8000`.
