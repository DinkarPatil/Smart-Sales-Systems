from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_db
from app.models.models import User, Company, Product, Query, QueryStatus
from app.schemas.schemas import QueryOut, QueryUpdate
from app.services.email_service import send_response_email

from datetime import datetime

router = APIRouter()

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
