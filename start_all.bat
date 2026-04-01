@echo off
echo Starting Smart Sales RAG Platform (Midnight & Aurora)...

:: Start Backend - Installs new Ollama dependencies first
start "Smart Sales RAG Backend Node" cmd /k "cd backend && ..\.venv\Scripts\activate && pip install -r ..\requirements.txt && uvicorn app.main:app --reload"

:: Start Frontend 
start "Smart Sales RAG Frontend Node" cmd /k "cd frontend && npm run dev"

echo System initialization sequence complete. Nodes are starting in separate terminals.
pause
