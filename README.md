# Smart Sales RAG Platform 🌌

A premium, RAG-powered sales intelligence dashboard with role-based access control and automated customer inquiry resolution. Built with the **Midnight & Aurora** dark-mode aesthetic.

## 🚀 Overview
The Smart Sales RAG Platform automates the first line of customer support using advanced Retrieval-Augmented Generation (RAG). It provides a sleek, high-performance interface for Admins, Managers, Owners, and Sales Representatives to collaborate on closing deals.

## 🛠️ Tech Stack
- **Backend**: FastAPI, SQLAlchemy (SQLite), LlamaIndex, Groq (Llama 3), Resend API.
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons.
- **AI/ML**: BGE embeddings (local), Llama-3 (via Groq).

## 📦 Setup Instructions

### 1. Backend Setup
1. `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate venv: `venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r ..\requirements.txt`
5. Create `.env` and include your **Groq API Key**, **Resend API Key**, and **Admin Secret Key**.
6. Run the server: `uvicorn app.main:app --reload`

### 2. Frontend Setup
1. `cd frontend`
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

### 3. Usage & Hierarchy
- **Admin**: Create companies, approve new users, and manage global system settings. Use the `ADMIN_SECRET_KEY` during signup to gain instant admin status.
- **Manager**: Oversee performance metrics, monitor resolution efficiency, and view global analytics.
- **Owner**: Manage specific product documentation and retrieve the **Company ID** for Google Forms integration.
- **Sales Rep**: Review and finalize AI-assisted responses for customer inquiries.

## 🔌 Integration
Connect your customer inquiry source (like Google Forms) to the following endpoint:
`POST http://localhost:8000/api/v1/webhook/google-forms`

**Payload Schema:**
```json
{
  "complainant_email": "customer@example.com",
  "query_text": "How do I upgrade to the pro version?",
  "company_id": "YOUR_COMPANY_ID_HERE"
}
```

## ✨ Design Philosophy
The system uses the **Midnight & Aurora** design language:
- **Midnight**: Deep backgrounds (`#020617`) for focus and premium feel.
- **Aurora**: Vibrant cyan (`#22d3ee`) and indigo (`#6366f1`) accents for visibility and modern tech aesthetic.
- **Simplicity**: No technical jargon. "RAG Vectors" are simply "Product Manuals".
