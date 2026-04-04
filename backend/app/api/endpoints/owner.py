from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy import select, delete, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import uuid
import os
from app.db.database import get_db
from app.models.models import User, Company, Product, Query, QueryStatus, ProductDocument, ActivityLog
from app.schemas.schemas import ProductOut, QueryOut, ProductCreate, ProductUpdate, CompanyCreate, CompanyOut, OwnerStats, CompanyUpdate, UserOut, NegotiationAction, ActivityLogOut
from app.api.deps import get_current_active_owner
from app.services.email_service import send_response_email
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/stats", response_model=OwnerStats)
async def get_owner_stats(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    if not current_owner.company_id:
        raise HTTPException(status_code=400, detail="Owner is not associated with any company")
    
    try:
        # Company Name
        company_result = await db.execute(select(Company).where(Company.id == current_owner.company_id))
        company = company_result.scalars().first()
        
        # 1. Product Count
        p_stmt = select(func.count(Product.id)).where(Product.company_id == current_owner.company_id)
        product_count = (await db.execute(p_stmt)).scalar() or 0
        
        # Products with docs
        p_docs_stmt = select(func.count(Product.id)).where(
            Product.company_id == current_owner.company_id,
            Product.manual_content != None,
            Product.manual_content != ""
        )
        products_with_docs = (await db.execute(p_docs_stmt)).scalar() or 0
        
        # 2. Team Count
        u_stmt = select(func.count(User.id)).where(User.company_id == current_owner.company_id)
        team_count = (await db.execute(u_stmt)).scalar() or 0
        
        # 3. Query resolution metrics
        total_q_stmt = select(func.count(Query.id)).where(Query.company_id == current_owner.company_id)
        total_q = (await db.execute(total_q_stmt)).scalar() or 0
        
        resolved_q_stmt = select(func.count(Query.id)).where(
            Query.company_id == current_owner.company_id,
            Query.status == QueryStatus.RESOLVED
        )
        resolved_q = (await db.execute(resolved_q_stmt)).scalar() or 0
        
        # Escalated queries
        esc_q_stmt = select(func.count(Query.id)).where(
            Query.company_id == current_owner.company_id,
            Query.is_escalated == True,
            Query.status == QueryStatus.PENDING
        )
        escalated_q = (await db.execute(esc_q_stmt)).scalar() or 0

        # High priority or breached SLA
        from sqlalchemy import or_
        high_prio_stmt = select(func.count(Query.id)).where(
            Query.company_id == current_owner.company_id,
            Query.is_escalated == True,
            Query.status == QueryStatus.PENDING,
            or_(Query.priority == "high", Query.deadline_at < func.now())
        )
        high_prio_q = (await db.execute(high_prio_stmt)).scalar() or 0

        return OwnerStats(
            company_name=company.name if company else "N/A",
            total_products=product_count,
            total_team_members=team_count,
            pending_queries=total_q - resolved_q,
            resolved_queries=resolved_q,
            escalated_queries=escalated_q,
            products_missing_docs=product_count - products_with_docs,
            high_priority_pending=high_prio_q
        )
    except Exception as e:
        import traceback
        with open("error.txt", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/company", response_model=CompanyOut)
async def get_owner_company(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    if not current_owner.company_id:
        raise HTTPException(status_code=400, detail="No linked company")
    result = await db.execute(select(Company).where(Company.id == current_owner.company_id))
    company = result.scalars().first()
    if not company:
        raise HTTPException(status_code=404, detail="Company record not found")
    return company

@router.put("/company", response_model=CompanyOut)
async def update_owner_company(
    company_update: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    if not current_owner.company_id:
        raise HTTPException(status_code=400, detail="No linked company")
        
    result = await db.execute(select(Company).where(Company.id == current_owner.company_id))
    company = result.scalars().first()
    
    for key, value in company_update.dict(exclude_unset=True).items():
        setattr(company, key, value)
        
    await db.commit()
    await db.refresh(company)
    return company

@router.get("/products", response_model=List[ProductOut])
async def list_owner_products(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.documents))
        .where(Product.company_id == current_owner.company_id)
    )
    return result.scalars().all()

@router.post("/products", response_model=ProductOut)
async def create_owner_product(
    product: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    if not current_owner.company_id:
        raise HTTPException(status_code=400, detail="Owner not tied to a company node")
        
    new_product = Product(
        **product.dict(exclude={"company_id"}),
        company_id=current_owner.company_id
    )
    db.add(new_product)
    
    # Audit Logging
    log = ActivityLog(
        company_id=current_owner.company_id,
        action="PRODUCT_PROVISIONED",
        entity_name=new_product.name,
        details=f"Base price: {new_product.base_price}, Max discount: {new_product.max_discount_pct}%"
    )
    db.add(log)
    
    await db.commit()
    await db.refresh(new_product)
    return new_product

@router.put("/products/{product_id}", response_model=ProductOut)
async def update_owner_product(
    product_id: str,
    product_update: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    stmt = select(Product).where(Product.id == product_id, Product.company_id == current_owner.company_id)
    product = (await db.execute(stmt)).scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    for key, value in product_update.dict(exclude_unset=True).items():
        setattr(product, key, value)
        
    # Audit Logging
    log = ActivityLog(
        company_id=current_owner.company_id,
        action="PRODUCT_MODIFIED",
        entity_name=product.name,
        details="Updated metadata parameters"
    )
    db.add(log)
        
    await db.commit()
    await db.refresh(product)
    return product

@router.delete("/products/{product_id}")
async def delete_owner_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    stmt = select(Product).where(Product.id == product_id, Product.company_id == current_owner.company_id)
    product = (await db.execute(stmt)).scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Audit Logging
    log = ActivityLog(
        company_id=current_owner.company_id,
        action="PRODUCT_NEUTRALIZED",
        entity_name=product.name,
        details="Asset node destroyed"
    )
    db.add(log)
    
    await db.delete(product)
    await db.commit()
    return {"status": "success"}

@router.get("/team", response_model=List[UserOut])
async def list_owner_team(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    result = await db.execute(select(User).where(User.company_id == current_owner.company_id))
    return result.scalars().all()

@router.get("/queries", response_model=List[QueryOut])
async def list_owner_queries(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    result = await db.execute(select(Query).where(Query.company_id == current_owner.company_id))
    return result.scalars().all()

@router.get("/history", response_model=List[ActivityLogOut])
async def list_owner_history(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.company_id == current_owner.company_id)
        .order_by(ActivityLog.created_at.desc())
    )
    return result.scalars().all()

import httpx
import base64
try:
    import fitz  # PyMuPDF
    from PIL import Image
    HAS_PDF_OCR = True
except ImportError:
    HAS_PDF_OCR = False

from app.core.config import settings
import io

@router.post("/products/{product_id}/upload")
async def upload_product_manual(
    product_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    stmt = select(Product).where(Product.id == product_id, Product.company_id == current_owner.company_id)
    product = (await db.execute(stmt)).scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or access denied")

    extracted_text = ""
    content_type = file.content_type

    try:
        contents = await file.read()
        if content_type == "application/pdf":
            doc = fitz.open(stream=contents, filetype="pdf")
            full_text = []
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text().strip()
                if len(page_text) < 50:
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                    img_data = pix.tobytes("png")
                    base64_image = base64.b64encode(img_data).decode('utf-8')
                    async with httpx.AsyncClient(timeout=90.0) as client:
                        response = await client.post(
                            f"{settings.OLLAMA_BASE_URL}/api/generate",
                            json={
                                "model": settings.OLLAMA_MODEL,
                                "prompt": "This is a scanned page from a product manual. Extract all readable text accurately. Do not add commentary.",
                                "images": [base64_image],
                                "stream": False
                            }
                        )
                        if response.status_code == 200:
                            page_text = response.json().get("response", "")
                full_text.append(f"--- Page {page_num+1} ---\n{page_text}")
            extracted_text = "\n\n".join(full_text)
            doc.close()
        elif content_type.startswith("image/"):
            base64_image = base64.b64encode(contents).decode('utf-8')
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": "Extract all readable text from this image accurately. List only the text found.",
                        "images": [base64_image],
                        "stream": False
                    }
                )
                if response.status_code == 200:
                    extracted_text = response.json().get("response", "")
        else:
            extracted_text = contents.decode("utf-8")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No readable text extracted")

        # Save as new document node
        new_doc = ProductDocument(
            product_id=product_id,
            filename=file.filename,
            content=extracted_text,
            file_type=content_type.split('/')[-1]
        )
        db.add(new_doc)
        
        # Aggregated manual content (re-build from all docs)
        from sqlalchemy.orm import selectinload
        await db.flush()
        res = await db.execute(select(ProductDocument).where(ProductDocument.product_id == product_id))
        all_docs = res.scalars().all()
        product.manual_content = "\n\n".join([d.content for d in all_docs])
        
        # Audit Logging
        log = ActivityLog(
            company_id=current_owner.company_id,
            action="KNOWLEDGE_INDEXED",
            entity_name=product.name,
            details=f"Attached node: {file.filename}"
        )
        db.add(log)
        
        await db.commit()
        return {"status": "success", "message": f"Document indexed and added to {product.name} repository"}

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documents/{doc_id}")
async def delete_product_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    from sqlalchemy.orm import joinedload
    stmt = select(ProductDocument).options(joinedload(ProductDocument.product)).where(ProductDocument.id == doc_id)
    doc = (await db.execute(stmt)).scalars().first()
    if not doc or doc.product.company_id != current_owner.company_id:
        raise HTTPException(status_code=404, detail="Document not found")
    
    product = doc.product
    await db.delete(doc)
    await db.flush()
    
    # Rebuild aggregated content
    res = await db.execute(select(ProductDocument).where(ProductDocument.product_id == product.id))
    all_docs = res.scalars().all()
    product.manual_content = "\n\n".join([d.content for d in all_docs])
    
    # Audit Logging
    log = ActivityLog(
        company_id=current_owner.company_id,
        action="KNOWLEDGE_REMOVED",
        entity_name=product.name,
        details=f"Detached node: {doc.filename}"
    )
    db.add(log)
    
    await db.commit()
    return {"status": "success"}

@router.get("/negotiations", response_model=List[QueryOut])
async def list_negotiations(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    stmt = select(Query).where(
        Query.company_id == current_owner.company_id,
        Query.is_escalated == True,
        Query.status == QueryStatus.PENDING
    ).order_by(Query.deadline_at.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

from fastapi import BackgroundTasks

@router.post("/negotiations/{query_id}/resolve")
async def resolve_negotiation(
    query_id: str,
    action: NegotiationAction,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner)
):
    from sqlalchemy.orm import joinedload
    stmt = select(Query).options(joinedload(Query.company)).where(Query.id == query_id, Query.company_id == current_owner.company_id)
    query = (await db.execute(stmt)).scalars().first()
    if not query:
        raise HTTPException(status_code=404, detail="Negotiation node not found")
        
    query.final_answer = action.final_answer
    query.status = action.status
    query.resolved_at = datetime.utcnow()
    
    # Immediate Email Notification for Client
    email_subject = f"Update regarding your query #{query.complaint_id}"
    email_body = f"""
    <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #6d28d9;">Official Response from {query.company.name}</h2>
        <p>Hello,</p>
        <p>Our executive team has reviewed your request regarding your recent query.</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <p><strong>Your Query:</strong> {query.query_text}</p>
            <p><strong>Approved Response/Price:</strong> {action.final_answer}</p>
        </div>
        <p>If you have any further questions, please reply to this email.</p>
        <p>Best regards,<br>Executive Management Team</p>
    </div>
    """
    background_tasks.add_task(send_response_email, query.complainant_email, email_subject, email_body)
    
    await db.commit()
    return {"status": "success"}
