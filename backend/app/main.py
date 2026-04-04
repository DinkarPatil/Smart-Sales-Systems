from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.api.endpoints import auth, admin, manager, owner, sales_rep, webhook
from app.db.database import init_db, get_db
from app.models.models import User, UserRole
from app.core.config import settings
from app.db.ensure_columns import ensure_company_columns

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Ensure database columns are up-to-date
    ensure_company_columns()
    # Initialize DB (create tables if none exist)
    await init_db()

# Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(manager.router, prefix=f"{settings.API_V1_STR}/manager", tags=["manager"])
app.include_router(owner.router, prefix=f"{settings.API_V1_STR}/owner", tags=["owner"])
app.include_router(sales_rep.router, prefix=f"{settings.API_V1_STR}/sales", tags=["sales"])
app.include_router(webhook.router, prefix=f"{settings.API_V1_STR}/webhook", tags=["webhook"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Sales RAG Chatbot API"}
