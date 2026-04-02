<<<<<<< Updated upstream
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
=======
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy import select, delete, func, update
>>>>>>> Stashed changes
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid
from app.db.database import get_db
from app.models.models import User, Company, Product, Query, QueryStatus
from app.schemas.schemas import ProductOut, QueryOut, ProductCreate, ProductUpdate, CompanyCreate, CompanyOut, OwnerStats, CompanyUpdate, UserOut
from app.api.deps import get_current_active_owner

router = APIRouter()

<<<<<<< Updated upstream
=======
@router.get("/stats", response_model=OwnerStats)
async def get_owner_stats(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    if not current_owner.company_id:
        raise HTTPException(status_code=400, detail="Owner is not associated with any company")
    
    # Company Name
    company_result = await db.execute(select(Company).where(Company.id == current_owner.company_id))
    company = company_result.scalars().first()
    
    # Total Products
    p_result = await db.execute(select(func.count(Product.id)).where(Product.company_id == current_owner.company_id))
    total_products = p_result.scalar_one()

    # Total Queries
    q_result = await db.execute(select(func.count(Query.id)).where(Query.company_id == current_owner.company_id))
    total_queries = q_result.scalar_one()

    # Pending/Resolved
    pending_result = await db.execute(select(func.count(Query.id)).where(Query.company_id == current_owner.company_id, Query.status == QueryStatus.PENDING))
    pending_queries = pending_result.scalar_one()

    resolved_result = await db.execute(select(func.count(Query.id)).where(Query.company_id == current_owner.company_id, Query.status == QueryStatus.RESOLVED))
    resolved_queries = resolved_result.scalar_one()

    # Personnel
    u_result = await db.execute(select(func.count(User.id)).where(User.company_id == current_owner.company_id))
    total_personnel = u_result.scalar_one()

    return {
        "company_name": company.name if company else "Unknown",
        "total_products": total_products,
        "total_queries": total_queries,
        "pending_queries": pending_queries,
        "resolved_queries": resolved_queries,
        "total_personnel": total_personnel
    }

@router.get("/personnel", response_model=List[UserOut])
async def list_company_personnel(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    if not current_owner.company_id:
        return []
    
    result = await db.execute(select(User).where(User.company_id == current_owner.company_id))
    return result.scalars().all()

@router.patch("/company", response_model=CompanyOut)
async def update_company_profile(
    company_update: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    if not current_owner.company_id:
        raise HTTPException(status_code=400, detail="Owner is not associated with any company")
    
    result = await db.execute(select(Company).where(Company.id == current_owner.company_id))
    company = result.scalars().first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    update_data = company_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
    
    await db.commit()
    await db.refresh(company)
    return company

@router.patch("/queries/{query_id}", response_model=QueryOut)
async def update_query_status(
    query_id: str,
    status_update: str, # "PENDING" or "RESOLVED"
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    result = await db.execute(
        select(Query).where(
            Query.id == query_id,
            Query.company_id == current_owner.company_id
        )
    )
    query = result.scalars().first()
    if not query:
        raise HTTPException(status_code=404, detail="Query not found or access denied")
    
    query.status = status_update
    await db.commit()
    await db.refresh(query)
    return query

@router.post("/products/{product_id}/upload-manual", response_model=ProductOut)
async def upload_product_manual(
    product_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    logger.info(f"TACTICAL HANDSHAKE: Product Intelligence Node {product_id} is receiving document '{file.filename}'")
    
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.company_id == current_owner.company_id
        )
    )
    product = result.scalars().first()
    if not product:
        logger.warning(f"ACCESS DENIED: Attempt to access product {product_id} was rejected for owner {current_owner.id}")
        raise HTTPException(status_code=404, detail="Product not found or access denied")

    content = ""
    filename = file.filename.lower()
    file_bytes = await file.read()
    logger.info(f"FILE STREAM: Received {len(file_bytes)} bytes from Node.")

    try:
        if filename.endswith(".pdf"):
            logger.info("ENGINE: Starting Deep PDF Intelligence Extraction Stage 1...")
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            page_count = len(doc)
            logger.info(f"ENGINE: Node has {page_count} pages. Scanning vectors...")
            
            for i, page in enumerate(doc):
                page_text = page.get_text().strip()
                if page_text:
                    content += f"--- Page {i+1} ---\n{page_text}\n\n"
            doc.close()
        
        elif filename.endswith((".txt", ".md")):
            logger.info("ENGINE: Sequential Text Decoder active.")
            content = file_bytes.decode("utf-8")
        
        else:
            logger.error(f"ENGINE ERROR: File type '{filename}' is not supported by the current Node class.")
            raise HTTPException(status_code=400, detail="Invalid Intelligence Source Class (Unsupported format)")

        if not content.strip():
            logger.warning(f"INTELLIGENCE VOID: Manual extraction for {filename} resulted in empty context. Image OCR recommended.")
            raise HTTPException(status_code=400, detail="Intelligence Extraction Failed: No readable text signals found in the source document.")

        # Update the product manually with the extracted intelligence
        product.manual_content = content.strip()
        await db.commit()
        await db.refresh(product)
        logger.info(f"SUCCESS: Intelligence Injection successful for {product_id}. {len(content)} context signs stored.")
        return product

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"NODE CRITICAL FAILURE: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Critical Intelligence Decoupling: {str(e)}")

>>>>>>> Stashed changes
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

@router.post("/setup-company", response_model=CompanyOut)
async def setup_owner_company(
    company_in: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    if current_owner.company_id:
        raise HTTPException(status_code=400, detail="Owner is already associated with a company")
    
    import hashlib
    hashed_id = hashlib.sha256(company_in.name.encode()).hexdigest()[:16]
    
    # Check if company name already exists
    result = await db.execute(select(Company).where(Company.name == company_in.name))
    if result.scalars().first():
        # Fallback if hash collision (unlikely) or name collision
        # Note: In real app we might want more complex ID generation
        raise HTTPException(status_code=400, detail="Company name already taken or collision")

    new_company = Company(
        id=hashed_id,
        name=company_in.name,
        description=company_in.description,
        config=company_in.config
    )
    db.add(new_company)
    
    # Link the owner to the new company
    current_owner.company_id = hashed_id
    
    await db.commit()
    await db.refresh(new_company)
    return new_company
