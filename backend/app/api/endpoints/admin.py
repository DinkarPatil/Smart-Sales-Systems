from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_db
from app.models.models import User, UserRole, Company
from app.schemas.schemas import UserOut, UserUpdate, CompanyCreate, CompanyOut
from app.api.endpoints.auth import OAuth2PasswordRequestForm # For reference, but we use Token deps

# We need a dependency to get current admin user
# For now, let's just make the endpoints. We'll add security deps later.

router = APIRouter()

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
async def list_companies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Company))
    return result.scalars().all()
