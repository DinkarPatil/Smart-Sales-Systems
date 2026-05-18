from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_manager
from app.core.exceptions import BadRequestError, NotFoundError
from app.db.session import get_db
from app.models import Company, LeadStat, Product, Query, QueryStatus, User, UserRole
from app.schemas.product import ProductBase, ProductOut
from app.schemas.query import QueryOut
from app.schemas.stats import ManagerStats, TeamMemberOut

router = APIRouter()


@router.get("/stats", response_model=ManagerStats)
async def get_manager_stats(
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager),
):
    if not current_manager.company_id:
        raise BadRequestError("Manager not assigned to a company")

    cid = current_manager.company_id

    total_queries = (await db.execute(
        select(func.count(Query.id)).where(Query.company_id == cid)
    )).scalar() or 0
    resolved_queries = (await db.execute(
        select(func.count(Query.id)).where(
            Query.company_id == cid, Query.status == QueryStatus.RESOLVED
        )
    )).scalar() or 0
    active_reps = (await db.execute(
        select(func.count(User.id)).where(
            User.company_id == cid,
            User.role == UserRole.SALES_REP,
            User.is_active.is_(True),
        )
    )).scalar() or 0

    leads = (await db.execute(
        select(LeadStat).where(LeadStat.company_id == cid)
    )).scalars().all()
    positive = sum(1 for l in leads if l.sentiment in ["Positive", "Very Positive", "+ve"])
    sentiment_score = (positive / len(leads) * 100) if leads else 0

    return ManagerStats(
        total_queries=total_queries,
        resolved_queries=resolved_queries,
        active_sales_reps=active_reps,
        sentiment_score=round(sentiment_score, 1),
    )


@router.get("/team", response_model=List[TeamMemberOut])
async def get_team_members(
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager),
):
    reps = (await db.execute(
        select(User).where(
            User.company_id == current_manager.company_id,
            User.role == UserRole.SALES_REP,
        )
    )).scalars().all()

    out = []
    for rep in reps:
        active = (await db.execute(
            select(func.count(Query.id)).where(
                Query.sales_rep_id == rep.id, Query.status == QueryStatus.PENDING
            )
        )).scalar() or 0
        resolved = (await db.execute(
            select(func.count(Query.id)).where(
                Query.sales_rep_id == rep.id, Query.status == QueryStatus.RESOLVED
            )
        )).scalar() or 0
        out.append(TeamMemberOut(
            id=rep.id,
            full_name=rep.full_name,
            email=rep.email,
            role=rep.role,
            is_active=rep.is_active,
            active_queries=active,
            resolved_queries=resolved,
        ))
    return out


@router.get("/queries", response_model=List[QueryOut])
async def get_company_queries(
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager),
):
    result = await db.execute(
        select(Query).where(Query.company_id == current_manager.company_id)
    )
    return result.scalars().all()


@router.patch("/queries/{query_id}")
async def assign_query(
    query_id: str,
    assigned_to: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager),
):
    query = (await db.execute(
        select(Query).where(
            Query.id == query_id, Query.company_id == current_manager.company_id
        )
    )).scalars().first()
    if not query:
        raise NotFoundError("Signal node not found")
    query.sales_rep_id = assigned_to
    await db.commit()
    return {"status": "success", "message": f"Query {query_id} re-routed to node {assigned_to}"}


@router.post("/products", response_model=ProductOut)
async def create_product(
    product: ProductBase,
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager),
):
    new_product = Product(**product.dict(), company_id=current_manager.company_id)
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product


@router.patch("/products/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    product_update: ProductBase,
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager),
):
    product = (await db.execute(
        select(Product).where(
            Product.id == product_id, Product.company_id == current_manager.company_id
        )
    )).scalars().first()
    if not product:
        raise NotFoundError("Product node not found")

    for key, value in product_update.dict(exclude_unset=True).items():
        setattr(product, key, value)
    await db.commit()
    await db.refresh(product)
    return product


@router.put("/company/suspend")
async def toggle_suspension(
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager),
):
    if not current_manager.company_id:
        raise BadRequestError("Manager not linked to any organization")

    company = (await db.execute(
        select(Company).where(Company.id == current_manager.company_id)
    )).scalars().first()
    if not company:
        raise NotFoundError("Organization node not found")

    company.manager_suspended = not getattr(company, "manager_suspended", False)
    await db.commit()
    await db.refresh(company)

    return {
        "status": "success",
        "message": f"Manager authorization state: {'SUSPENDED' if company.manager_suspended else 'AUTHORIZED'}",
        "manager_suspended": company.manager_suspended,
        "is_active": not (company.admin_suspended and company.manager_suspended),
    }


@router.get("/company/status")
async def get_company_status(
    db: AsyncSession = Depends(get_db),
    current_manager: User = Depends(get_current_active_manager),
):
    if not current_manager.company_id:
        raise BadRequestError("Manager not linked to any organization")

    company = (await db.execute(
        select(Company).where(Company.id == current_manager.company_id)
    )).scalars().first()
    admin_suspended = getattr(company, "admin_suspended", False)
    manager_suspended = getattr(company, "manager_suspended", False)
    return {
        "name": company.name,
        "admin_suspended": admin_suspended,
        "manager_suspended": manager_suspended,
        "is_active": not (admin_suspended and manager_suspended),
    }
