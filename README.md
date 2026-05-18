# Sales RAG Chatbot System

A full-stack RAG-powered sales dashboard for multi-company support, featuring role-based access control and automated query resolution.

## Tech Stack
- **Backend**: FastAPI · SQLAlchemy (async) · SQLite (aiosqlite) · LlamaIndex · Groq (Llama 3) · Resend (email) · PyMuPDF + Ollama VLM (PDF/image OCR)
- **Frontend**: Next.js 14 (App Router, JavaScript) · React 18 · Axios · Tailwind CSS · Framer Motion · Lucide Icons · Recharts

## Project Structure

```
Smart-Sales-Systems/
├── backend/
│   └── app/
│       ├── main.py                 # FastAPI entry + CORS + global exception handler
│       ├── core/                   # config, security, exceptions, logging
│       ├── db/                     # base.py (declarative Base), session.py, ensure_columns.py
│       ├── models/                 # one file per domain entity (user/company/product/query/...)
│       ├── schemas/                # pydantic schemas split by domain
│       ├── services/               # email_service, rag_service
│       └── api/
│           ├── deps.py             # auth dependencies + role guards
│           └── v1/                 # versioned API: auth, admin, manager, owner, sales, webhook
└── frontend/
    ├── app/                        # Next.js App Router
    │   ├── layout.jsx              # root layout + providers
    │   ├── page.jsx                # role-based redirect
    │   ├── login/                  # /login
    │   ├── forgot-password/        # /forgot-password
    │   ├── reset-password/         # /reset-password
    │   └── (dashboard)/            # protected route group sharing the sidebar shell
    │       ├── admin/
    │       ├── manager/
    │       ├── owner/
    │       └── sales/
    └── src/
        ├── lib/api/                # axios client + per-resource modules (auth/admin/manager/owner/sales)
        ├── contexts/auth-context   # AuthContext (login/logout/me + localStorage rehydration)
        ├── components/
        │   ├── auth/ProtectedRoute # role-guarded wrapper
        │   ├── layout/             # DashboardShell, Sidebar, Header, SettingsModal
        │   └── ui/Toast            # shared toast hook
        ├── hooks/                  # useTheme
        └── features/               # feature-sliced dashboard modules
            ├── admin/{views,modals,hooks}
            ├── manager/{hooks}
            ├── owner/{views,modals,hooks}
            └── sales/{components}
```

## Setup Instructions

### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

Create a `.env` in `backend/` containing at minimum:
```
SECRET_KEY=...
ADMIN_SECRET_KEY=...
GROQ_API_KEY=...
RESEND_API_KEY=...
MAIL_FROM=onboarding@resend.dev
FRONTEND_URL=http://localhost:3000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2-vision
```

Run: `uvicorn app.main:app --reload` (serves on http://127.0.0.1:8000; Swagger at `/docs`).

### 2. Frontend
```bash
cd frontend
cp .env.local.example .env.local      # or copy manually on Windows
npm install
npm run dev
```
Serves on http://localhost:3000. The frontend reads `NEXT_PUBLIC_API_URL` (defaults to `http://127.0.0.1:8000/api/v1`).

### 3. Convenience Launcher
From the project root, double-click `start_all.bat` to launch both servers in separate windows.

## Auth & Onboarding
- **Admin Registration**: provide a valid `ADMIN_SECRET_KEY` while registering — admins are auto-activated.
- **Standard Users**: any registration without the secret is created as `SalesRep` and `inactive` until an admin approves.
- Sessions: JWT in `localStorage`, attached automatically by the axios interceptor. 401 responses force a redirect to `/login`.

## Webhooks
`POST /api/v1/webhook/google-forms` — pipe complaint submissions in from Google Forms (via Apps Script on the linked Sheet).

## Features
- RBAC: Admin / Manager / Owner / SalesRep
- RAG-grounded auto-answers via LlamaIndex + Groq Llama-3
- PDF / image OCR via PyMuPDF + Ollama vision model
- SLA-tracked escalation queue with owner adjudication
- Suspension dual-lock (Admin + Manager)
- Real-time-ish polling on the SalesRep dashboard
