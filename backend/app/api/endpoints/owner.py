from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid
import fitz # PyMuPDF
import io
import logging

from app.db.database import get_db
from app.models.models import User, Company, Product, Query
from app.schemas.schemas import ProductOut, QueryOut, ProductCreate, ProductUpdate
from app.api.deps import get_current_active_owner

logger = logging.getLogger("SalesRAG_Owner")

router = APIRouter()

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
