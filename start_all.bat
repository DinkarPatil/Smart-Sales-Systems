@echo off
echo Starting Backend and Frontend...

:: Start Backend in a new window
:: Points to .venv in the project root
start "Sales RAG Backend" cmd /k "cd backend && ..\.venv\Scripts\activate && uvicorn app.main:app --reload"

:: Start Frontend in a new window
start "Sales RAG Frontend" cmd /k "cd frontend && npm run dev"

echo Both processes are starting in separate windows.
pause
