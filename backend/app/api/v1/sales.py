from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi import Query as QueryParam
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_sales_rep
from app.core.exceptions import BadRequestError, NotFoundError
from app.db.session import get_db
from app.models import Product, Query, QueryStatus, User
from app.schemas.product import ProductOut
from app.schemas.query import QueryOut, QueryUpdate
from app.schemas.stats import SalesRepStats
from app.services.email_service import send_response_email

router = APIRouter()


class EscalateRequest(BaseModel):
    reason: str
    priority: str = "normal"


class DiscountRequest(BaseModel):
    product_id: str
    discount_pct: int


class ResolveRequest(BaseModel):
    resolution: str


@router.get("/stats", response_model=SalesRepStats)
async def get_rep_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep),
):
    active_count = (await db.execute(
        select(func.count(Query.id)).where(
            Query.sales_rep_id == current_user.id, Query.status == QueryStatus.PENDING
        )
    )).scalar() or 0
    resolved_count = (await db.execute(
        select(func.count(Query.id)).where(
            Query.sales_rep_id == current_user.id, Query.status == QueryStatus.RESOLVED
        )
    )).scalar() or 0
    escalated_count = (await db.execute(
        select(func.count(Query.id)).where(
            Query.sales_rep_id == current_user.id, Query.is_escalated.is_(True)
        )
    )).scalar() or 0

    total_assigned = active_count + resolved_count
    efficiency = (resolved_count / total_assigned * 100) if total_assigned else 0

    avg_response = 0.0
    timing_rows = (await db.execute(
        select(Query.created_at, Query.resolved_at).where(
            Query.sales_rep_id == current_user.id, Query.resolved_at.isnot(None)
        )
    )).all()
    if timing_rows:
        deltas = [
            (row.resolved_at - row.created_at).total_seconds() / 60
            for row in timing_rows
            if row.resolved_at and row.created_at
        ]
        avg_response = round(sum(deltas) / len(deltas), 1) if deltas else 0.0

    return SalesRepStats(
        active_queries=active_count,
        resolved_queries=resolved_count,
        escalated_queries=escalated_count,
        efficiency_score=round(efficiency, 1),
        avg_response_time=avg_response,
    )


@router.get("/queries", response_model=List[QueryOut])
async def list_queries(
    status: Optional[str] = QueryParam(None, description="Filter by status: Pending | Escalated | Resolved"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep),
):
    stmt = select(Query).where(Query.sales_rep_id == current_user.id)
    if status:
        stmt = stmt.where(Query.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.patch("/queries/{query_id}", response_model=QueryOut)
async def update_query(
    query_id: str,
    query_update: QueryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep),
):
    query = (await db.execute(
        select(Query).where(
            Query.id == query_id, Query.sales_rep_id == current_user.id
        )
    )).scalars().first()
    if not query:
        raise NotFoundError("Inquiry not found or access restricted")

    if query_update.status:
        query.status = query_update.status
    if query_update.final_answer:
        query.final_answer = query_update.final_answer
        query.resolved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(query)
    return query


@router.post("/queries/{query_id}/resolve", response_model=QueryOut)
async def resolve_query(
    query_id: str,
    payload: ResolveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep),
):
    query = (await db.execute(
        select(Query).where(
            Query.id == query_id, Query.sales_rep_id == current_user.id
        )
    )).scalars().first()
    if not query:
        raise NotFoundError("Query not found")
    if query.status == QueryStatus.RESOLVED:
        raise BadRequestError("Query is already resolved")

    query.status = QueryStatus.RESOLVED
    query.final_answer = payload.resolution
    query.resolved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(query)
    return query


@router.post("/queries/{query_id}/escalate", response_model=QueryOut)
async def escalate_query(
    query_id: str,
    payload: EscalateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep),
):
    query = (await db.execute(
        select(Query).where(
            Query.id == query_id, Query.sales_rep_id == current_user.id
        )
    )).scalars().first()
    if not query:
        raise NotFoundError("Query not found")
    if query.is_escalated:
        raise BadRequestError("Query is already escalated")

    query.is_escalated = True
    query.status = QueryStatus.ESCALATED
    query.escalated_at = datetime.utcnow()
    query.priority = payload.priority
    query.escalation_reason = payload.reason

    hours = 12 if payload.priority == "high" else 48
    query.deadline_at = datetime.utcnow() + timedelta(hours=hours)

    owner = (await db.execute(
        select(User).where(
            User.company_id == current_user.company_id, User.role == "Owner"
        )
    )).scalars().first()

    if owner:
        email_body = f"""
        <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #6d28d9;">Incoming Escalation</h2>
            <p>Sales Rep <strong>{current_user.full_name}</strong> has escalated a client query.</p>
            <div style="background:#f8fafc;padding:20px;border-radius:12px;border:1px solid #e2e8f0;margin:20px 0;">
                <p><strong>Query:</strong> {query.query_text}</p>
                <p><strong>Reason:</strong> {payload.reason}</p>
                <p><strong>Priority:</strong> {payload.priority.upper()}</p>
                <p><strong>Deadline:</strong> {query.deadline_at.strftime('%Y-%m-%d %H:%M UTC')}</p>
            </div>
            <p>Please resolve this via your dashboard within the SLA window.</p>
        </div>
        """
        background_tasks.add_task(
            send_response_email,
            owner.email,
            f"URGENT: Query Escalation #{query.complaint_id}",
            email_body,
        )

    await db.commit()
    await db.refresh(query)
    return query


@router.post("/queries/{query_id}/apply-discount", response_model=QueryOut)
async def apply_discount(
    query_id: str,
    payload: DiscountRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep),
):
    query = (await db.execute(
        select(Query).where(
            Query.id == query_id, Query.sales_rep_id == current_user.id
        )
    )).scalars().first()
    if not query:
        raise NotFoundError("Query not found")

    product = (await db.execute(
        select(Product).where(
            Product.id == payload.product_id, Product.company_id == current_user.company_id
        )
    )).scalars().first()
    if not product:
        raise NotFoundError("Product not found")

    final_discount = min(payload.discount_pct, product.max_discount_pct)
    market_price = float(product.price) if product.price else (product.base_price / 100)
    discounted_price = market_price * (1 - final_discount / 100)

    answer = (
        f"APPROVED DISCOUNT: {final_discount}% applied "
        f"(capped at {product.max_discount_pct}%). "
        f"Final negotiated price: ${discounted_price:.2f}"
    )
    if payload.discount_pct > product.max_discount_pct:
        answer += (
            f"\n\nNOTE: Requested {payload.discount_pct}% was capped by policy. "
            "Escalate to Owner for further reduction."
        )
    query.final_answer = answer

    await db.commit()
    await db.refresh(query)
    return query


@router.get("/products", response_model=List[ProductOut])
async def list_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep),
):
    result = await db.execute(
        select(Product).where(Product.company_id == current_user.company_id)
    )
    return result.scalars().all()
