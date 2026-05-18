from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import api_router
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.db.ensure_columns import ensure_company_columns
from app.db.session import init_db

configure_logging()
logger = get_logger("app")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS — allow the Next.js dev server and any configured frontend origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception during request: %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"message": str(exc)})


@app.on_event("startup")
async def startup_event() -> None:
    logger.info("Running schema sync...")
    ensure_company_columns()
    logger.info("Initializing database...")
    await init_db()
    logger.info("Startup complete.")


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {"message": "Welcome to Sales RAG Chatbot API", "docs": "/docs"}


@app.get("/healthz")
def healthcheck():
    return {"status": "ok"}
