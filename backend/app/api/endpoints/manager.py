from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from app.db.database import get_db
from app.models.models import User, Company, Product, Query, LeadStat, UserRole, QueryStatus
from app.schemas.schemas import QueryOut, TeamMemberOut, ManagerStats, ProductOut, ProductBase
from app.api.deps import get_current_active_manager

router = APIRouter()

@router.get("/stats", response_model=ManagerStats)
async def get_manager_stats(
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    if not current_manager.company_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Manager not assigned to a company")
    
    # 1. Total Queries in company
    query_stmt = select(func.count(Query.id)).where(Query.company_id == current_manager.company_id)
    total_queries = (await db.execute(query_stmt)).scalar() or 0

    # 2. Resolved Queries
    resolved_stmt = select(func.count(Query.id)).where(
        Query.company_id == current_manager.company_id,
        Query.status == QueryStatus.RESOLVED
    )
    resolved_queries = (await db.execute(resolved_stmt)).scalar() or 0

    # 3. Active Sales Reps
    reps_stmt = select(func.count(User.id)).where(
        User.company_id == current_manager.company_id,
        User.role == UserRole.SALES_REP,
        User.is_active == True
    )
    active_reps = (await db.execute(reps_stmt)).scalar() or 0

    # 4. Sentiment Analysis (Aggregate from LeadStat)
    # We'll calculate a 'Positive Sentiment %' based on company leads
    sentiment_stmt = select(LeadStat).where(LeadStat.company_id == current_manager.company_id)
    leads = (await db.execute(sentiment_stmt)).scalars().all()
    
    positive_count = sum(1 for l in leads if l.sentiment in ["Positive", "Very Positive"])
    sentiment_score = (positive_count / len(leads) * 100) if leads else 0

    return ManagerStats(
        total_queries=total_queries,
        resolved_queries=resolved_queries,
        active_sales_reps=active_reps,
        sentiment_score=round(sentiment_score, 1)
    )

@router.get("/team", response_model=List[TeamMemberOut])
async def get_team_members(
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    # Fetch all SalesReps for this company
    stmt = select(User).where(
        User.company_id == current_manager.company_id,
        User.role == UserRole.SALES_REP
    )
    reps = (await db.execute(stmt)).scalars().all()
    
    team_out = []
    for rep in reps:
        # Count their active work
        active_count = (await db.execute(select(func.count(Query.id)).where(
            Query.assigned_to == rep.id,
            Query.status == QueryStatus.PENDING
        ))).scalar() or 0
        
        resolved_count = (await db.execute(select(func.count(Query.id)).where(
            Query.assigned_to == rep.id,
            Query.status == QueryStatus.RESOLVED
        ))).scalar() or 0

        team_out.append(TeamMemberOut(
            id=rep.id,
            full_name=rep.full_name,
            email=rep.email,
            role=rep.role,
            is_active=rep.is_active,
            active_queries=active_count,
            resolved_queries=resolved_count
        ))
    
    return team_out

@router.get("/queries", response_model=List[QueryOut])
async def get_company_queries(
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    stmt = select(Query).where(Query.company_id == current_manager.company_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.patch("/queries/{query_id}")
async def assign_manager_query(
    query_id: int,
    assigned_to: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    # Manual inquiry assignment
    stmt = select(Query).where(Query.id == query_id, Query.company_id == current_manager.company_id)
    query = (await db.execute(stmt)).scalars().first()
    if not query:
        raise HTTPException(status_code=404, detail="Signal node not found")
        
    query.assigned_to = assigned_to
    await db.commit()
    return {"status": "success", "message": f"Query {query_id} re-routed to node {assigned_to}"}

@router.post("/products", response_model=ProductOut)
async def create_manager_product(
    product: ProductBase,
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    # Knowledge injection - creating a product manual context
    new_product = Product(
        **product.dict(),
        company_id=current_manager.company_id
    )
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product

@router.patch("/products/{product_id}", response_model=ProductOut)
async def update_manager_product(
    product_id: int,
    product_update: ProductBase,
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    stmt = select(Product).where(Product.id == product_id, Product.company_id == current_manager.company_id)
    product = (await db.execute(stmt)).scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product node not found")
        
    for key, value in product_update.dict(exclude_unset=True).items():
        setattr(product, key, value)
        
    await db.commit()
    await db.refresh(product)
    return product

@router.put("/company/suspend")
async def toggle_manager_suspension(
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    if not current_manager.company_id:
        raise HTTPException(status_code=400, detail="Manager not linked to any organization")
        
    stmt = select(Company).where(Company.id == current_manager.company_id)
    company = (await db.execute(stmt)).scalars().first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Organization node not found")
        
    # Toggle the manager's suspension flag
    company.manager_suspended = not getattr(company, 'manager_suspended', False)
    
    await db.commit()
    await db.refresh(company)
    
    status_msg = "SUSPENDED" if company.manager_suspended else "AUTHORIZED"
    return {
        "status": "success", 
        "message": f"Manager authorization state: {status_msg}",
        "manager_suspended": company.manager_suspended,
        "is_active": not (company.admin_suspended and company.manager_suspended)
    }

@router.get("/company/status")
async def get_company_status(
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager)
):
    if not current_manager.company_id:
        raise HTTPException(status_code=400, detail="Manager not linked to any organization")
        
    stmt = select(Company).where(Company.id == current_manager.company_id)
    company = (await db.execute(stmt)).scalars().first()
    
    return {
        "name": company.name,
        "admin_suspended": getattr(company, 'admin_suspended', False),
        "manager_suspended": getattr(company, 'manager_suspended', False),
        "is_active": not (getattr(company, 'admin_suspended', False) and getattr(company, 'manager_suspended', False))
    }
