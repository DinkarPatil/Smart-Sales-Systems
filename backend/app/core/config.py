import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Sales RAG Chatbot"
    
    # Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-me")
    ADMIN_SECRET_KEY: str = os.getenv("ADMIN_SECRET_KEY", "change-this-secret-admin-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week
    
    # DB
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./sales_chatbot.db")
    
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # Ollama
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llava:13b")
    # Email (Resend API)
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "onboarding@resend.dev")

    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    class Config:
        case_sensitive = True

settings = Settings()
