from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_db
from app.models.models import User, Company, Product, Query
from app.schemas.schemas import ProductOut, QueryOut, ProductCreate

router = APIRouter()

@router.get("/{company_id}/products", response_model=List[ProductOut])
async def get_owner_products(company_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.company_id == company_id))
    return result.scalars().all()

@router.post("/{company_id}/products", response_model=ProductOut)
async def create_product(company_id: str, product_in: ProductCreate, db: AsyncSession = Depends(get_db)):
    import uuid
    new_product = Product(
        id=str(uuid.uuid4()),
        company_id=company_id,
        name=product_in.name,
        description=product_in.description,
        manual_content=product_in.manual_content
    )
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product

@router.get("/{company_id}/queries", response_model=List[QueryOut])
async def get_owner_queries(company_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Query).where(Query.company_id == company_id))
    return result.scalars().all()
