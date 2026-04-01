from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid
from app.db.database import get_db
from app.models.models import User, Company, Product, Query
from app.schemas.schemas import ProductOut, QueryOut, ProductCreate, ProductUpdate
from app.api.deps import get_current_active_owner

router = APIRouter()

@router.get("/products", response_model=List[ProductOut])
async def get_owner_products(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    if not current_owner.company_id:
        raise HTTPException(status_code=400, detail="Owner is not associated with any company")
    
    result = await db.execute(select(Product).where(Product.company_id == current_owner.company_id))
    return result.scalars().all()

@router.post("/products", response_model=ProductOut)
async def create_product(
    product_in: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    if not current_owner.company_id:
        raise HTTPException(status_code=400, detail="Owner is not associated with any company")
    
    # Force company_id to the owner's company for security
    new_product = Product(
        id=str(uuid.uuid4()),
        company_id=current_owner.company_id, # Security: Use owner's company_id
        name=product_in.name,
        description=product_in.description,
        manual_content=product_in.manual_content
    )
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product

@router.patch("/products/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.company_id == current_owner.company_id
        )
    )
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or access denied")
    
    update_data = product_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
        
    await db.commit()
    await db.refresh(product)
    return product

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.company_id == current_owner.company_id
        )
    )
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or access denied")
    
    await db.delete(product)
    await db.commit()
    return None

@router.get("/queries", response_model=List[QueryOut])
async def get_owner_queries(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    if not current_owner.company_id:
        return []
    
    result = await db.execute(select(Query).where(Query.company_id == current_owner.company_id))
    return result.scalars().all()
