from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy import select, update, delete, func, and_, Table
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from typing import List
from datetime import datetime, timedelta
from app.db.database import get_db
from app.models.models import User, UserRole, Company, Product, Query, QueryStatus
from app.schemas.schemas import UserOut, UserUpdate, CompanyCreate, CompanyOut, AdminStats, UserCreate
from app.api.deps import get_current_active_admin
from app.services.email_service import send_response_email

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
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    # Fetch all users with their assigned company
    query = select(User).options(joinedload(User.company)).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.unique().scalars().all()
    
    users_out = []
    for user in users:
        # Map to UserOut structure
        user_data = UserOut.from_orm(user)
        # Populate assigned_companies from the one-to-many relationship
        if user.company:
            user_data.assigned_companies = [{"id": user.company.id, "name": user.company.name}]
            user_data.company_name = user.company.name
        else:
            user_data.assigned_companies = []
            user_data.company_name = "Unassigned"
        users_out.append(user_data)
        
    return users_out

@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str, 
    user_update: UserUpdate, 
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.role is not None:
        user.role = user_update.role
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.company_id is not None:
        user.company_id = user_update.company_id
    
    # Handle Many-to-Many simulation for backward compatibility
    if user_update.company_ids is not None:
        # Since it's one-to-many, we take the first ID if provided
        if user_update.company_ids:
            user.company_id = user_update.company_ids[0]
        else:
            user.company_id = None
            
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/users", response_model=UserOut)
async def admin_create_user(
    user_in: UserCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    from app.core import security
    
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=security.get_password_hash(user_in.password),
        role=user_in.role or UserRole.SALES_REP,
        is_active=True, # Active by default when created by Admin
        company_id=user_in.company_id
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    email_subject = "Welcome to Sales RAG System - Account Created"
    email_body = f"""
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #6d28d9;">Welcome to Sales RAG System</h2>
      <p>Hello {new_user.full_name},</p>
      <p>An administrator has created a new secure access account for you.</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p><strong>Email (Username):</strong> {user_in.email}</p>
        <p><strong>Password:</strong> {user_in.password}</p>
        <p><strong>System Role:</strong> {new_user.role}</p>
      </div>
      <p>Please log in using these credentials and change your password in your settings as soon as possible.</p>
      <p>Best regards,<br>The System Admin Team</p>
    </div>
    """
    
    background_tasks.add_task(send_response_email, user_in.email, email_subject, email_body)
    
    return new_user

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
async def create_company(
    company_in: CompanyCreate, 
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
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
async def list_companies(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin)
):
    # Fetch companies and join with counts
    result = await db.execute(select(Company))
    companies = result.scalars().all()
    
    now = datetime.utcnow()
    one_week_ago = now - timedelta(days=7)
    one_month_ago = now - timedelta(days=30)
    
    company_out_list = []
    for company in companies:
        # Count products
        p_count = await db.execute(select(func.count(Product.id)).where(Product.company_id == company.id))
        # Count users
        u_count = await db.execute(select(func.count(User.id)).where(User.company_id == company.id))
        
        # Calculate Weekly Tokens
        w_tokens = await db.execute(select(func.sum(Query.tokens)).where(
            Query.company_id == company.id,
            Query.created_at >= one_week_ago
        ))
        # Calculate Monthly Tokens
        m_tokens = await db.execute(select(func.sum(Query.tokens)).where(
            Query.company_id == company.id,
            Query.created_at >= one_month_ago
        ))
        
        # Calculate Sales Rep Count
        sr_count = await db.execute(select(func.count(User.id)).where(
            User.company_id == company.id,
            User.role == UserRole.SALES_REP
        ))
        
        # Fetch Manager Names
        m_names_result = await db.execute(select(User.full_name).where(
            User.company_id == company.id,
            User.role == UserRole.MANAGER
        ))
        m_names = m_names_result.scalars().all()
        manager_names_str = ", ".join(m_names) if m_names else "Unassigned"
        
        company_out_list.append(
            CompanyOut(
                id=company.id,
                name=company.name,
                description=company.description,
                config=company.config,
                product_count=p_count.scalar_one(),
                user_count=u_count.scalar_one(),
                sales_rep_count=sr_count.scalar_one(),
                manager_name=manager_names_str,
                is_active=not (getattr(company, 'admin_suspended', False) and getattr(company, 'manager_suspended', False)),
                admin_suspended=getattr(company, 'admin_suspended', False) or False,
                manager_suspended=getattr(company, 'manager_suspended', False) or False,
                created_at=getattr(company, 'created_at', now) if getattr(company, 'created_at', now) is not None else now,
                total_tokens=company.total_tokens or 0,
                weekly_tokens=w_tokens.scalar_one() or 0,
                monthly_tokens=m_tokens.scalar_one() or 0
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
