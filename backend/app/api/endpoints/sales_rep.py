from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.db.database import get_db
from app.models.models import User, Company, Product, Query, QueryStatus
from app.schemas.schemas import QueryOut, QueryUpdate, SalesRepStats, QueryBulkAssign, ProductOut
from app.services.email_service import send_response_email

from datetime import datetime

router = APIRouter()

<<<<<<< Updated upstream
=======
@router.get("/stats", response_model=SalesRepStats)
async def get_rep_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Resolved by this rep
    res_result = await db.execute(select(func.count(Query.id)).where(Query.sales_rep_id == current_user.id, Query.status == QueryStatus.RESOLVED))
    resolved_count = res_result.scalar_one()

    # Assigned to this rep but Pending
    ass_result = await db.execute(select(func.count(Query.id)).where(Query.sales_rep_id == current_user.id, Query.status == QueryStatus.PENDING))
    assigned_count = ass_result.scalar_one()

    # Company-wide Pending
    pen_result = await db.execute(select(func.count(Query.id)).where(Query.company_id == current_user.company_id, Query.status == QueryStatus.PENDING))
    pending_count = pen_result.scalar_one()

    return {
        "resolved_count": resolved_count,
        "assigned_count": assigned_count,
        "pending_count": pending_count,
        "avg_resolution_time": 0.0 # Placeholder for now
    }

@router.get("/products", response_model=List[ProductOut])
async def get_rep_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.company_id:
        return []
    
    result = await db.execute(select(Product).where(Product.company_id == current_user.company_id))
    return result.scalars().all()

@router.post("/bulk-assign", status_code=status.HTTP_200_OK)
async def bulk_assign_queries(
    bulk_in: QueryBulkAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Only assign queries from the same company that are Pending
    result = await db.execute(
        update(Query)
        .where(
            Query.id.in_(bulk_in.query_ids),
            Query.company_id == current_user.company_id,
            Query.status == QueryStatus.PENDING
        )
        .values(
            sales_rep_id = current_user.id,
            assigned_at = datetime.utcnow()
        )
    )
    await db.commit()
    return {"message": f"Successfully assigned {result.rowcount} queries."}

@router.get("/queries", response_model=List[QueryOut])
async def get_rep_queries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # If SalesRep, only show their assigned queries or pending for their company
    if current_user.role == "SalesRep":
        result = await db.execute(
            select(Query).where(
                (Query.sales_rep_id == current_user.id) | (Query.status == QueryStatus.PENDING)
            ).order_by(Query.created_at.desc())
        )
    else:
        result = await db.execute(select(Query).order_by(Query.created_at.desc()))
        
    return result.scalars().all()

>>>>>>> Stashed changes
@router.put("/assign-query/{query_id}", response_model=QueryOut)
async def assign_query(
    query_id: str, 
    sales_rep_id: str, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Query).where(Query.id == query_id))
    query = result.scalars().first()
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    query.sales_rep_id = sales_rep_id
    query.assigned_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(query)
    return query

@router.put("/resolve-query/{query_id}", response_model=QueryOut)
async def resolve_query(
    query_id: str, 
    query_update: QueryUpdate, 
    sales_rep_id: str, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Query).where(Query.id == query_id))
    query = result.scalars().first()
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    query.final_answer = query_update.final_answer
    query.status = QueryStatus.RESOLVED
    query.sales_rep_id = sales_rep_id
    query.resolved_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(query)
    
    # Send email to complainant
    subject = f"Resolution for Complaint ID: {query.complaint_id}"
    await send_response_email(query.complainant_email, subject, query.final_answer)
    
    return query
