from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_db
from app.models.models import User, Company, Product, Query, LeadStat
from app.schemas.schemas import QueryOut, LeadStatOut

router = APIRouter()

@router.get("/dashboard-stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Number of integrated companies
    result = await db.execute(select(func.count(Company.id)))
    companies_count = result.scalar()
    
    # Total Queries
    result = await db.execute(select(func.count(Query.id)))
    total_queries = result.scalar()
    
    # Resolved Queries
    result = await db.execute(select(func.count(Query.id)).where(Query.status == "resolved"))
    resolved_queries = result.scalar()
    
    # Sentiment stats from lead_stats
    result = await db.execute(select(func.count(LeadStat.id)).where(LeadStat.sentiment == "+ve"))
    positive_leads = result.scalar()
    
    result = await db.execute(select(func.count(LeadStat.id)).where(LeadStat.sentiment == "-ve"))
    negative_leads = result.scalar()
    
    return {
        "integrated_companies": companies_count,
        "total_queries": total_queries,
        "resolved_queries": resolved_queries,
        "positive_leads": positive_leads,
        "negative_leads": negative_leads
    }

@router.get("/all-queries", response_model=List[QueryOut])
async def get_all_queries(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Query).order_by(Query.created_at.desc()))
    return result.scalars().all()

@router.get("/performance-report")
async def get_performance_report(db: AsyncSession = Depends(get_db)):
    # Get all sales reps
    reps_result = await db.execute(select(User).where(User.role == UserRole.SALES_REP))
    reps = reps_result.scalars().all()
    
    report = []
    for rep in reps:
        # Get resolved queries for this rep
        query_result = await db.execute(
            select(Query).where(
                Query.sales_rep_id == rep.id,
                Query.status == QueryStatus.RESOLVED,
                Query.assigned_at.isnot(None),
                Query.resolved_at.isnot(None)
            )
        )
        resolved_queries = query_result.scalars().all()
        
        total_resolved = len(resolved_queries)
        avg_time_seconds = 0
        
        if total_resolved > 0:
            total_time = sum(
                (q.resolved_at - q.assigned_at).total_seconds() 
                for q in resolved_queries
            )
            avg_time_seconds = total_time / total_resolved
            
        report.append({
            "rep_name": rep.full_name or rep.email,
            "rep_email": rep.email,
            "total_resolved": total_resolved,
            "avg_resolution_time_mins": round(avg_time_seconds / 60, 2),
            "performance_rating": min(5, round((total_resolved * 10) / (avg_time_seconds / 60 + 1), 1)) if avg_time_seconds > 0 else 0
        })
        
    return report
