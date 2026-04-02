from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from app.db.database import get_db
<<<<<<< Updated upstream
from app.models.models import User, Company, Product, Query, LeadStat
from app.schemas.schemas import QueryOut, LeadStatOut

router = APIRouter()

@router.get("/dashboard-stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Number of integrated companies
    result = await db.execute(select(func.count(Company.id)))
    companies_count = result.scalar()
    
=======
from app.models.models import User, Company, Product, Query, LeadStat, UserRole, QueryStatus
from app.schemas.schemas import QueryOut, TeamMemberOut, ManagerStats, ProductOut, ProductBase
from app.api.deps import get_current_active_manager

router = APIRouter()

@router.get("/stats", response_model=ManagerStats)
async def get_manager_stats(
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    cid = current_manager.company_id
    if not cid:
        raise HTTPException(status_code=400, detail="Manager not linked to any company")

    # Company name
    comp_res = await db.execute(select(Company.name).where(Company.id == cid))
    company_name = comp_res.scalar() or "Unknown Entity"

>>>>>>> Stashed changes
    # Total Queries
    total_q = await db.execute(select(func.count(Query.id)).where(Query.company_id == cid))
    total_queries = total_q.scalar()

    # Resolved Queries
<<<<<<< Updated upstream
    result = await db.execute(select(func.count(Query.id)).where(Query.status == "resolved"))
    resolved_queries = result.scalar()
    
=======
    res_q = await db.execute(select(func.count(Query.id)).where(Query.company_id == cid, Query.status == QueryStatus.RESOLVED))
    resolved_queries = res_q.scalar()

    # Pending Queries
    pen_q = await db.execute(select(func.count(Query.id)).where(Query.company_id == cid, Query.status == QueryStatus.PENDING))
    pending_queries = pen_q.scalar()

>>>>>>> Stashed changes
    # Sentiment stats from lead_stats
    pos_res = await db.execute(select(func.count(LeadStat.id)).where(LeadStat.company_id == cid, LeadStat.sentiment == "+ve"))
    pos_count = pos_res.scalar()
    
    total_leads_res = await db.execute(select(func.count(LeadStat.id)).where(LeadStat.company_id == cid))
    total_leads = total_leads_res.scalar()
    
    sentiment_pct = (pos_count / total_leads * 100) if total_leads > 0 else 0.0

    # Team count
    team_res = await db.execute(select(func.count(User.id)).where(User.company_id == cid, User.role == UserRole.SALES_REP))
    team_count = team_res.scalar()

    return {
        "company_name": company_name,
        "total_queries": total_queries,
<<<<<<< Updated upstream
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
=======
        "pending_queries": pending_queries,
        "resolved_queries": resolved_queries,
        "positive_sentiment_pct": round(sentiment_pct, 1),
        "team_count": team_count
    }

@router.get("/team", response_model=List[TeamMemberOut])
async def get_manager_team(
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    cid = current_manager.company_id
    result = await db.execute(select(User).where(User.company_id == cid, User.role == UserRole.SALES_REP))
    reps = result.scalars().all()
    
    team_report = []
    for rep in reps:
        # Active (Assigned & Pending)
        act_res = await db.execute(select(func.count(Query.id)).where(Query.sales_rep_id == rep.id, Query.status == QueryStatus.PENDING))
        # Resolved
        res_res = await db.execute(select(func.count(Query.id)).where(Query.sales_rep_id == rep.id, Query.status == QueryStatus.RESOLVED))
        
        team_report.append({
            "id": rep.id,
            "full_name": rep.full_name,
            "email": rep.email,
            "role": rep.role,
            "active_queries": act_res.scalar(),
            "resolved_queries": res_res.scalar()
        })
    return team_report

@router.get("/queries", response_model=List[QueryOut])
async def get_manager_queries(
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    cid = current_manager.company_id
    result = await db.execute(select(Query).where(Query.company_id == cid).order_by(Query.created_at.desc()))
    return result.scalars().all()

@router.patch("/queries/{query_id}", response_model=QueryOut)
async def assign_manager_query(
    query_id: str,
    sales_rep_id: Optional[str] = None,
    status_update: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    cid = current_manager.company_id
    result = await db.execute(select(Query).where(Query.id == query_id, Query.company_id == cid))
    query = result.scalars().first()
    if not query:
        raise HTTPException(status_code=404, detail="Query signal lost or unauthorized")

    if sales_rep_id:
        query.sales_rep_id = sales_rep_id
        query.assigned_at = datetime.utcnow()
>>>>>>> Stashed changes
    
    if status_update:
        query.status = status_update
    
    await db.commit()
    await db.refresh(query)
    return query

@router.get("/products", response_model=List[ProductOut])
async def list_manager_products(
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    cid = current_manager.company_id
    result = await db.execute(select(Product).where(Product.company_id == cid))
    return result.scalars().all()

@router.post("/products", response_model=ProductOut)
async def create_manager_product(
    product_in: ProductBase,
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    cid = current_manager.company_id
    new_product = Product(
        **product_in.dict(),
        company_id=cid
    )
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product

@router.patch("/products/{product_id}", response_model=ProductOut)
async def update_manager_product(
    product_id: str,
    product_update: ProductBase,
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    cid = current_manager.company_id
    result = await db.execute(select(Product).where(Product.id == product_id, Product.company_id == cid))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product node not found")
    
    for key, value in product_update.dict(exclude_unset=True).items():
        setattr(product, key, value)
    
    await db.commit()
    await db.refresh(product)
    return product
