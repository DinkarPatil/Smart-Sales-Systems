@echo off
echo Starting Backend and Frontend...

:: Backend (FastAPI on :8000)
start "Sales RAG Backend" cmd /k "cd backend && ..\.venv\Scripts\activate && uvicorn app.main:app --reload"

:: Frontend (Next.js on :3000)
start "Sales RAG Frontend" cmd /k "cd frontend && npm run dev"

echo Backend  -> http://127.0.0.1:8000  (docs at /docs)
echo Frontend -> http://localhost:3000
pause
