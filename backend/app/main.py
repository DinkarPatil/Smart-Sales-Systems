from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.api.endpoints import auth, admin, manager, owner, sales_rep, webhook
from app.db.database import init_db, get_db
from app.models.models import User, UserRole
from app.core.config import settings

from contextlib import asynccontextmanager
import logging

# --- ADVANCED SYSTEM LOGGING CONFIGURATION ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[
        logging.FileHandler("system_diagnostic.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("SalesRAG_Core")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Intelligence Core Node...")
    await init_db()
    yield
    logger.info("Intelligence Core Node Shutting Down.")

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Global Exception Handler for future error solving
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP ERROR [{exc.status_code}]: {exc.detail} | PATH: {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.critical(f"UNHANDLED SYSTEM EXCEPTION: {str(exc)} | PATH: {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Critical System Decoupling. Check diagnostics log."},
    )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific frontend URL
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
