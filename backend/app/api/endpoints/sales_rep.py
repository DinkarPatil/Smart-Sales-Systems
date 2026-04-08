from fastapi import APIRouter, Depends, HTTPException, Query as QueryParam
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.db.database import get_db
from app.models.models import User, Product, Query, QueryStatus
from app.schemas.schemas import QueryOut, SalesRepStats, QueryUpdate, ProductOut
from app.api.deps import get_current_active_sales_rep
from fastapi import BackgroundTasks
from app.services.email_service import send_response_email

router = APIRouter()


# ── Inline request schemas (move to schemas.py if preferred) ──────────────────

class EscalateRequest(BaseModel):
    reason: str
    priority: str = "normal"  # "normal" | "high"


class DiscountRequest(BaseModel):
    product_id: str
    discount_pct: int


class ResolveRequest(BaseModel):
    resolution: str


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=SalesRepStats)
async def get_rep_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep)
):
    active_stmt = select(func.count(Query.id)).where(
        Query.sales_rep_id == current_user.id,
        Query.status == QueryStatus.PENDING
    )
    active_count = (await db.execute(active_stmt)).scalar() or 0

    resolved_stmt = select(func.count(Query.id)).where(
        Query.sales_rep_id == current_user.id,
        Query.status == QueryStatus.RESOLVED
    )
    resolved_count = (await db.execute(resolved_stmt)).scalar() or 0

    escalated_stmt = select(func.count(Query.id)).where(
        Query.sales_rep_id == current_user.id,
        Query.is_escalated == True  # noqa: E712
    )
    escalated_count = (await db.execute(escalated_stmt)).scalar() or 0

    total_assigned = active_count + resolved_count
    efficiency = (resolved_count / total_assigned * 100) if total_assigned > 0 else 0

    # Real avg response time: average minutes between created_at and resolved_at
    avg_response = 0.0
    timing_stmt = select(Query.created_at, Query.resolved_at).where(
        Query.sales_rep_id == current_user.id,
        Query.resolved_at.isnot(None)
    )
    timing_rows = (await db.execute(timing_stmt)).all()
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
        avg_response_time=avg_response
    )


# ── Query list (with optional status filter) ──────────────────────────────────

@router.get("/queries", response_model=List[QueryOut])
async def list_rep_queries(
    status: Optional[str] = QueryParam(None, description="Filter by status: Pending | Escalated | Resolved"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep)
):
    stmt = select(Query).where(Query.sales_rep_id == current_user.id)
    if status:
        stmt = stmt.where(Query.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


# ── Generic PATCH (status + final_answer) ────────────────────────────────────

@router.patch("/queries/{query_id}", response_model=QueryOut)
async def update_rep_query(
    query_id: int,
    query_update: QueryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep)
):
    stmt = select(Query).where(Query.id == query_id, Query.sales_rep_id == current_user.id)
    query = (await db.execute(stmt)).scalars().first()

    if not query:
        raise HTTPException(status_code=404, detail="Inquiry not found or access restricted")

    if query_update.status:
        query.status = query_update.status
    if query_update.final_answer:
        query.final_answer = query_update.final_answer
        query.resolved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(query)
    return query


# ── Dedicated resolve endpoint (called by frontend Dispatch button) ───────────

@router.post("/queries/{query_id}/resolve", response_model=QueryOut)
async def resolve_query(
    query_id: int,
    resolve_req: ResolveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep)
):
    stmt = select(Query).where(Query.id == query_id, Query.sales_rep_id == current_user.id)
    query = (await db.execute(stmt)).scalars().first()

    if not query:
        raise HTTPException(status_code=404, detail="Query not found")

    if query.status == QueryStatus.RESOLVED:
        raise HTTPException(status_code=400, detail="Query is already resolved")

    query.status = QueryStatus.RESOLVED
    query.final_answer = resolve_req.resolution
    query.resolved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(query)
    return query


# ── Escalate ──────────────────────────────────────────────────────────────────

@router.post("/queries/{query_id}/escalate", response_model=QueryOut)
async def escalate_query(
    query_id: int,
    escalate_req: EscalateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep)
):
    stmt = select(Query).where(Query.id == query_id, Query.sales_rep_id == current_user.id)
    query = (await db.execute(stmt)).scalars().first()

    if not query:
        raise HTTPException(status_code=404, detail="Query not found")

    if query.is_escalated:
        raise HTTPException(status_code=400, detail="Query is already escalated")

    query.is_escalated = True
    query.status = QueryStatus.ESCALATED
    query.escalated_at = datetime.utcnow()
    query.priority = escalate_req.priority
    query.escalation_reason = escalate_req.reason

    # SLA deadline: 12 h for high priority, 48 h for normal
    hours = 12 if escalate_req.priority == "high" else 48
    query.deadline_at = datetime.utcnow() + timedelta(hours=hours)

    # Notify company owner by email
    owner_stmt = select(User).where(
        User.company_id == current_user.company_id,
        User.role == "Owner"
    )
    owner = (await db.execute(owner_stmt)).scalars().first()

    if owner:
        email_subject = f"URGENT: Query Escalation #{query.complaint_id}"
        email_body = f"""
        <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #6d28d9;">Incoming Escalation</h2>
            <p>Sales Rep <strong>{current_user.full_name}</strong> has escalated a client query.</p>
            <div style="background:#f8fafc;padding:20px;border-radius:12px;border:1px solid #e2e8f0;margin:20px 0;">
                <p><strong>Query:</strong> {query.query_text}</p>
                <p><strong>Reason:</strong> {escalate_req.reason}</p>
                <p><strong>Priority:</strong> {escalate_req.priority.upper()}</p>
                <p><strong>Deadline:</strong> {query.deadline_at.strftime('%Y-%m-%d %H:%M UTC')}</p>
            </div>
            <p>Please resolve this via your dashboard within the SLA window.</p>
        </div>
        """
        background_tasks.add_task(send_response_email, owner.email, email_subject, email_body)

    await db.commit()
    await db.refresh(query)
    return query


# ── Apply discount ────────────────────────────────────────────────────────────

@router.post("/queries/{query_id}/apply-discount", response_model=QueryOut)
async def apply_discount(
    query_id: int,
    discount_req: DiscountRequest,          # JSON body, not query params
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep)
):
    q_stmt = select(Query).where(Query.id == query_id, Query.sales_rep_id == current_user.id)
    query = (await db.execute(q_stmt)).scalars().first()
    if not query:
        raise HTTPException(404, "Query not found")

    p_stmt = select(Product).where(
        Product.id == discount_req.product_id,
        Product.company_id == current_user.company_id
    )
    product = (await db.execute(p_stmt)).scalars().first()
    if not product:
        raise HTTPException(404, "Product not found")

    # Cap discount at corporate maximum
    final_discount = min(discount_req.discount_pct, product.max_discount_pct)
    market_price = float(product.price) if product.price else (product.base_price / 100)
    discounted_price = market_price * (1 - final_discount / 100)

    query.final_answer = (
        f"APPROVED DISCOUNT: {final_discount}% applied "
        f"(capped at {product.max_discount_pct}%). "
        f"Final negotiated price: ${discounted_price:.2f}"
    )
    if discount_req.discount_pct > product.max_discount_pct:
        query.final_answer += (
            f"\n\nNOTE: Requested {discount_req.discount_pct}% was capped by policy. "
            "Escalate to Owner for further reduction."
        )

    await db.commit()
    await db.refresh(query)
    return query


# ── Products (read-only for rep context) ─────────────────────────────────────

@router.get("/products", response_model=List[ProductOut])
async def get_rep_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep)
):
    stmt = select(Product).where(Product.company_id == current_user.company_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/products", response_model=List[ProductOut])
async def get_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep)
):
    stmt = select(Product).where(Product.company_id == current_user.company_id)
    result = await db.execute(stmt)
    return result.scalars().all()
