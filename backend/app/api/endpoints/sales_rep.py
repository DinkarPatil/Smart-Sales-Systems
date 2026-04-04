from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from app.db.database import get_db
from app.models.models import User, Company, Product, Query, QueryStatus
from app.schemas.schemas import QueryOut, SalesRepStats, QueryUpdate, ProductOut
from app.api.deps import get_current_active_sales_rep
from fastapi import BackgroundTasks
from datetime import timedelta
from app.services.email_service import send_response_email

router = APIRouter()

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
    
    # 3. Efficiency Rank (Simulated for Now)
    # Could be calculated as (Resolved / Total Assigned) or compared to company average
    total_assigned = active_count + resolved_count
    efficiency = (resolved_count / total_assigned * 100) if total_assigned > 0 else 0
    
    # 4. Response Time (Simulated average)
    avg_response = 15.5 # Minutes

    return SalesRepStats(
        active_queries=active_count,
        resolved_queries=resolved_count,
        efficiency_score=round(efficiency, 1),
        avg_response_time=avg_response
    )

@router.get("/queries", response_model=List[QueryOut])
async def list_rep_queries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep)
):
    # Get all queries assigned to this specific SalesRep
    stmt = select(Query).where(Query.sales_rep_id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.patch("/queries/{query_id}", response_model=QueryOut)
async def update_rep_query(
    query_id: int,
    query_update: QueryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep)
):
    # Ensure this query belongs to the rep's company and is assigned to them
    stmt = select(Query).where(Query.id == query_id, Query.sales_rep_id == current_user.id)
    query = (await db.execute(stmt)).scalars().first()
    
    if not query:
        raise HTTPException(status_code=404, detail="Inquiry node not found or access restricted")
    
    if query_update.status:
        query.status = query_update.status
    if query_update.final_answer:
        query.final_answer = query_update.final_answer
        query.resolved_at = datetime.utcnow()
        
    await db.commit()
    await db.refresh(query)
    return query

@router.post("/queries/{query_id}/escalate", response_model=QueryOut)
async def escalate_query(
    query_id: str,
    background_tasks: BackgroundTasks,
    priority: str = "normal", # "normal", "high"
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep)
):
    stmt = select(Query).where(Query.id == query_id, Query.sales_rep_id == current_user.id)
    query = (await db.execute(stmt)).scalars().first()
    
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
        
    query.is_escalated = True
    query.escalated_at = datetime.utcnow()
    query.priority = priority
    
    # SLA Logic
    hours = 12 if priority == "high" else 48
    query.deadline_at = datetime.utcnow() + timedelta(hours=hours)
    
    # Notify Owner Email
    owner_stmt = select(User).where(User.company_id == current_user.company_id, User.role == "Owner")
    owner = (await db.execute(owner_stmt)).scalars().first()
    
    if owner:
        email_subject = f"URGENT: Query Escalation #{query.complaint_id}"
        email_body = f"""
        <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #6d28d9;">Incoming Escalation</h2>
            <p>Sales Rep <strong>{current_user.full_name}</strong> has escalated a client query for your review.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <p><strong>Query:</strong> {query.query_text}</p>
                <p><strong>Priority:</strong> {priority.upper()}</p>
                <p><strong>Resolution Deadline:</strong> {query.deadline_at.strftime('%Y-%m-%d %H:%M UTC')}</p>
            </div>
            <p>Please resolve this via your dashboard within the SLA period.</p>
        </div>
        """
        background_tasks.add_task(send_response_email, owner.email, email_subject, email_body)
    
    await db.commit()
    await db.refresh(query)
    return query

@router.post("/queries/{query_id}/apply-discount", response_model=QueryOut)
async def apply_discount(
    query_id: str,
    product_id: str,
    discount_pct: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep)
):
    # 1. Verify Query & Product
    q_stmt = select(Query).where(Query.id == query_id, Query.sales_rep_id == current_user.id)
    query = (await db.execute(q_stmt)).scalars().first()
    if not query: raise HTTPException(404, "Query not found")
    
    p_stmt = select(Product).where(Product.id == product_id, Product.company_id == current_user.company_id)
    product = (await db.execute(p_stmt)).scalars().first()
    if not product: raise HTTPException(404, "Product not found")
    
    # 2. Logic: Application of 'Whatever is Less' rule
    final_discount = min(discount_pct, product.max_discount_pct)
    
    # 3. Apply Calculation
    # Note: base_price is in cents/pence, product.price is for display
    # We use base_price for official discount calculation
    current_market_price = float(product.price) if product.price else (product.base_price / 100)
    discounted_price = current_market_price * (1 - (final_discount / 100))
    
    query.final_answer = f"APPROVED DISCOUNT: {final_discount}% applied (Capped at {product.max_discount_pct}%). Final Negotiated Price: ${discounted_price:.2f}"
    if discount_pct > product.max_discount_pct:
        query.final_answer += f"\n\nNOTE: Requested {discount_pct}% was capped by corporate policy. For further reduction, please escalate to Owner."
    
    await db.commit()
    await db.refresh(query)
    return query

@router.get("/products", response_model=List[ProductOut])
async def get_rep_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_sales_rep)
):
    # Sales reps can view company products (for context)
    stmt = select(Product).where(Product.company_id == current_user.company_id)
    result = await db.execute(stmt)
    return result.scalars().all()
