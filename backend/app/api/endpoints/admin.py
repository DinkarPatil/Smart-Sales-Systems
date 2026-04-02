from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_db
<<<<<<< Updated upstream
from app.models.models import User, UserRole, Company
from app.schemas.schemas import UserOut, UserUpdate, CompanyCreate, CompanyOut
from app.api.endpoints.auth import OAuth2PasswordRequestForm # For reference, but we use Token deps

# We need a dependency to get current admin user
# For now, let's just make the endpoints. We'll add security deps later.
=======
from app.models.models import User, UserRole, Company, Product, Query, QueryStatus
from app.schemas.schemas import UserOut, UserUpdate, CompanyCreate, CompanyOut, AdminStats
from app.api.deps import get_current_active_admin
>>>>>>> Stashed changes

router = APIRouter()

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    # Total Users
    users_result = await db.execute(select(func.count(User.id)))
    total_users = users_result.scalar_one()

    # Total Companies
    companies_result = await db.execute(select(func.count(Company.id)))
    total_companies = companies_result.scalar_one()

    # Total Products
    products_result = await db.execute(select(func.count(Product.id)))
    total_products = products_result.scalar_one()

    # Total Queries
    queries_result = await db.execute(select(func.count(Query.id)))
    total_queries = queries_result.scalar_one()

    # Pending Queries
    pending_result = await db.execute(select(func.count(Query.id)).where(Query.status == QueryStatus.PENDING))
    pending_queries = pending_result.scalar_one()

    # Resolved Queries
    resolved_result = await db.execute(select(func.count(Query.id)).where(Query.status == QueryStatus.RESOLVED))
    resolved_queries = resolved_result.scalar_one()

    return {
        "total_users": total_users,
        "total_companies": total_companies,
        "total_products": total_products,
        "total_queries": total_queries,
        "pending_queries": pending_queries,
        "resolved_queries": resolved_queries
    }

@router.get("/users", response_model=List[UserOut])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    return result.scalars().all()

@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(user_id: str, user_update: UserUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.role:
        user.role = user_update.role
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.company_id:
        user.company_id = user_update.company_id
        
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(user)
    await db.commit()
    return None

@router.post("/companies", response_model=CompanyOut)
async def create_company(company_in: CompanyCreate, db: AsyncSession = Depends(get_db)):
    import hashlib
    # Generate a hashed ID as requested
    hashed_id = hashlib.sha256(company_in.name.encode()).hexdigest()[:16]
    
    new_company = Company(
        id=hashed_id,
        name=company_in.name,
        description=company_in.description,
        config=company_in.config
    )
    db.add(new_company)
    await db.commit()
    await db.refresh(new_company)
    return new_company

@router.get("/companies", response_model=List[CompanyOut])
<<<<<<< Updated upstream
async def list_companies(db: AsyncSession = Depends(get_db)):
=======
async def list_companies(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    # Fetch companies and join with counts
>>>>>>> Stashed changes
    result = await db.execute(select(Company))
    companies = result.scalars().all()
    
    company_out_list = []
    for company in companies:
        # Count products
        p_count = await db.execute(select(func.count(Product.id)).where(Product.company_id == company.id))
        # Count users
        u_count = await db.execute(select(func.count(User.id)).where(User.company_id == company.id))
        
        company_out_list.append(
            CompanyOut(
                id=company.id,
                name=company.name,
                description=company.description,
                config=company.config,
                product_count=p_count.scalar_one(),
                user_count=u_count.scalar_one()
            )
        )
    return company_out_list

@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalars().first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Cascade delete is handled by database if relationships are set with cascade,
    # but here we'll manually ensure some cleanup if needed or just let SQLAlchemy handle it if configured.
    # The current models.py do NOT have cascade="all, delete-orphan", so we should be careful.
    
    # Actually, let's just delete the company. SQLite might error if there are foreign keys without cascade.
    # Let's add manual cleanup for safety in this task.
    await db.execute(delete(Product).where(Product.company_id == company_id))
    await db.execute(delete(Query).where(Query.company_id == company_id))
    
    await db.delete(company)
    await db.commit()
    return None

@router.get("/audit-logs")
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    # Simulated audit logs - tracking critical lifecycle events
    return [
        {"id": "a-1", "event": "NODE_DELETION", "target": "User: rep_sigma_9", "timestamp": "2026-04-02T10:15:00Z", "actor": "Admin: root"},
        {"id": "a-2", "event": "ENTITY_PROVISION", "target": "Company: NEXUS_CORP", "timestamp": "2026-04-02T09:45:00Z", "actor": "Admin: root"},
        {"id": "a-3", "event": "ROLE_ELEVATION", "target": "User: j_doe (SalesRep -> Owner)", "timestamp": "2026-04-02T08:20:00Z", "actor": "Admin: sys_ops"},
        {"id": "a-4", "event": "DATABASE_BACKUP", "target": "System: MainDB", "timestamp": "2026-04-02T00:00:00Z", "actor": "System: Cron"},
    ]

@router.get("/neural-diagnostics")
async def get_neural_diagnostics(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    # Simulated neural diagnostics - tracking LLM performance and token efficiency
    return {
        "avg_latency_ms": 1240,
        "token_throughput_24h": 842000,
        "cache_hit_rate": 0.38,
        "active_models": ["Llama-3-70B", "Groq-Mixtral-8x7b"],
        "node_load": "OPTIMAL",
        "hourly_signals": [42, 38, 45, 52, 60, 58, 62, 70, 75, 80, 85, 90, 88, 82, 78, 70, 65, 60, 55, 50, 48, 45, 42, 40]
    }
