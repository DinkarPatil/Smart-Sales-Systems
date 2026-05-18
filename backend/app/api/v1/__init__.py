from fastapi import APIRouter

from app.api.v1 import admin, auth, manager, owner, sales, webhook

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(manager.router, prefix="/manager", tags=["manager"])
api_router.include_router(owner.router, prefix="/owner", tags=["owner"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(webhook.router, prefix="/webhook", tags=["webhook"])

__all__ = ["api_router"]
