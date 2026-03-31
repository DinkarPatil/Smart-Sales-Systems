# Sales RAG Chatbot System

A full-stack RAG-powered sales dashboard for multi-company support, featuring role-based access control and automated query resolution.

## Tech Stack
- **Backend**: FastAPI, SQLAlchemy, SQLite (aiosqlite), LlamaIndex, Groq (Llama 3), FastAPI-Mail.
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons, Recharts.

## Setup Instructions

### 1. Backend Setup
1. `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate venv: `venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Create `.env` from `.env.example` and add your **Groq API Key** and **SMTP credentials**.
6. Run the server: `uvicorn app.main:app --reload`

### 2. Frontend Setup
1. `cd frontend`
2. Install Node.js if not already installed.
3. Install dependencies: `npm install`
4. Run dev server: `npm run dev`

### 3. Usage & Admin Bootstrapping
- **Admin Registration**: To register as an Admin, users must provide a valid `ADMIN_SECRET_KEY` during registration (found in your `.env` file). These users are automatically activated.
- **Standard Users**: Users registering without the secret key are assigned the **Sales Representative** role and set to **Inactive**. They must be approved/assigned by an Admin to log in.
- **Webhook**: Use the `/api/v1/webhook/google-forms` endpoint to connect your Google Forms (using Google Apps Script on the associated Sheet).

## Features
- **RDAC**: Admin, Manager, Owner, Sales Representative.
- **RAG Resolution**: Automatic answer generation using company manuals through LlamaIndex + Groq.
- **First-Come-First-Serve**: Sales Reps solve queries based on arrival time.
- **SLA Handling**: Mentions 30-minute resolution time automatically.
