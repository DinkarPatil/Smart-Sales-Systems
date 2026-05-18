import base64
from datetime import datetime
from typing import List

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import get_current_active_owner
from app.core.config import settings
from app.core.exceptions import BadRequestError, NotFoundError
from app.db.session import get_db
from app.models import ActivityLog, Company, Product, ProductDocument, Query, QueryStatus, User
from app.schemas.activity import ActivityLogOut
from app.schemas.company import CompanyOut, CompanyUpdate
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate
from app.schemas.query import NegotiationAction, QueryOut
from app.schemas.stats import OwnerStats
from app.schemas.user import UserOut
from app.services.email_service import send_response_email

try:
    import fitz  # type: ignore  # noqa: F401
    HAS_PDF_OCR = True
except ImportError:
    HAS_PDF_OCR = False

router = APIRouter()


@router.get("/stats", response_model=OwnerStats)
async def get_owner_stats(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner),
):
    if not current_owner.company_id:
        raise BadRequestError("Owner is not associated with any company")

    cid = current_owner.company_id
    company = (await db.execute(select(Company).where(Company.id == cid))).scalars().first()

    async def count(stmt):
        return (await db.execute(stmt)).scalar() or 0

    product_count = await count(select(func.count(Product.id)).where(Product.company_id == cid))
    products_with_docs = await count(
        select(func.count(Product.id)).where(
            Product.company_id == cid,
            Product.manual_content.isnot(None),
            Product.manual_content != "",
        )
    )
    team_count = await count(select(func.count(User.id)).where(User.company_id == cid))
    total_q = await count(select(func.count(Query.id)).where(Query.company_id == cid))
    resolved_q = await count(
        select(func.count(Query.id)).where(
            Query.company_id == cid, Query.status == QueryStatus.RESOLVED
        )
    )
    escalated_q = await count(
        select(func.count(Query.id)).where(
            Query.company_id == cid,
            Query.is_escalated.is_(True),
            Query.status == QueryStatus.PENDING,
        )
    )
    high_prio_q = await count(
        select(func.count(Query.id)).where(
            Query.company_id == cid,
            Query.is_escalated.is_(True),
            Query.status == QueryStatus.PENDING,
            or_(Query.priority == "high", Query.deadline_at < func.now()),
        )
    )

    return OwnerStats(
        company_name=company.name if company else "N/A",
        total_products=product_count,
        total_team_members=team_count,
        pending_queries=total_q - resolved_q,
        resolved_queries=resolved_q,
        escalated_queries=escalated_q,
        products_missing_docs=product_count - products_with_docs,
        high_priority_pending=high_prio_q,
    )


@router.get("/company", response_model=CompanyOut)
async def get_owner_company(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner),
):
    if not current_owner.company_id:
        raise BadRequestError("No linked company")
    company = (await db.execute(
        select(Company).where(Company.id == current_owner.company_id)
    )).scalars().first()
    if not company:
        raise NotFoundError("Company record not found")
    return company


@router.put("/company", response_model=CompanyOut)
async def update_owner_company(
    company_update: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner),
):
    if not current_owner.company_id:
        raise BadRequestError("No linked company")

    company = (await db.execute(
        select(Company).where(Company.id == current_owner.company_id)
    )).scalars().first()
    for key, value in company_update.dict(exclude_unset=True).items():
        setattr(company, key, value)
    await db.commit()
    await db.refresh(company)
    return company


@router.get("/products", response_model=List[ProductOut])
async def list_products(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner),
):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.documents))
        .where(Product.company_id == current_owner.company_id)
    )
    return result.scalars().all()


@router.post("/products", response_model=ProductOut)
async def create_product(
    product: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner),
):
    if not current_owner.company_id:
        raise BadRequestError("Owner not tied to a company node")

    new_product = Product(
        **product.dict(exclude={"company_id"}),
        company_id=current_owner.company_id,
    )
    db.add(new_product)

    db.add(ActivityLog(
        company_id=current_owner.company_id,
        action="PRODUCT_PROVISIONED",
        entity_name=new_product.name,
        details=f"Base price: {new_product.base_price}, Max discount: {new_product.max_discount_pct}%",
    ))
    await db.commit()

    result = await db.execute(
        select(Product).options(selectinload(Product.documents)).where(Product.id == new_product.id)
    )
    return result.scalars().first()


@router.put("/products/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner),
):
    product = (await db.execute(
        select(Product).where(
            Product.id == product_id, Product.company_id == current_owner.company_id
        )
    )).scalars().first()
    if not product:
        raise NotFoundError("Product not found")

    for key, value in product_update.dict(exclude_unset=True).items():
        setattr(product, key, value)

    db.add(ActivityLog(
        company_id=current_owner.company_id,
        action="PRODUCT_MODIFIED",
        entity_name=product.name,
        details="Updated metadata parameters",
    ))
    await db.commit()

    result = await db.execute(
        select(Product).options(selectinload(Product.documents)).where(Product.id == product.id)
    )
    return result.scalars().first()


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner),
):
    product = (await db.execute(
        select(Product).where(
            Product.id == product_id, Product.company_id == current_owner.company_id
        )
    )).scalars().first()
    if not product:
        raise NotFoundError("Product not found")

    db.add(ActivityLog(
        company_id=current_owner.company_id,
        action="PRODUCT_NEUTRALIZED",
        entity_name=product.name,
        details="Asset node destroyed",
    ))
    await db.delete(product)
    await db.commit()
    return {"status": "success"}


@router.get("/team", response_model=List[UserOut])
async def list_team(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner),
):
    result = await db.execute(
        select(User).where(User.company_id == current_owner.company_id)
    )
    return result.scalars().all()


@router.get("/queries", response_model=List[QueryOut])
async def list_queries(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner),
):
    result = await db.execute(
        select(Query).where(Query.company_id == current_owner.company_id)
    )
    return result.scalars().all()


@router.get("/history", response_model=List[ActivityLogOut])
async def list_history(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner),
):
    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.company_id == current_owner.company_id)
        .order_by(ActivityLog.created_at.desc())
    )
    return result.scalars().all()


@router.post("/products/{product_id}/upload")
async def upload_product_manual(
    product_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner),
):
    product = (await db.execute(
        select(Product).where(
            Product.id == product_id, Product.company_id == current_owner.company_id
        )
    )).scalars().first()
    if not product:
        raise NotFoundError("Product not found or access denied")

    if not HAS_PDF_OCR:
        raise BadRequestError("OCR pipeline unavailable (pymupdf not installed)")

    import fitz  # type: ignore

    extracted_text = ""
    contents = await file.read()
    try:
        if file.content_type == "application/pdf":
            doc = fitz.open(stream=contents, filetype="pdf")
            pages = []
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text().strip()
                if len(page_text) < 50:
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                    img_data = pix.tobytes("png")
                    b64 = base64.b64encode(img_data).decode("utf-8")
                    async with httpx.AsyncClient(timeout=90.0) as client:
                        response = await client.post(
                            f"{settings.OLLAMA_BASE_URL}/api/generate",
                            json={
                                "model": settings.OLLAMA_MODEL,
                                "prompt": "This is a scanned page from a product manual. Extract all readable text accurately. Do not add commentary.",
                                "images": [b64],
                                "stream": False,
                            },
                        )
                        if response.status_code == 200:
                            page_text = response.json().get("response", "")
                pages.append(f"--- Page {page_num + 1} ---\n{page_text}")
            extracted_text = "\n\n".join(pages)
            doc.close()
        elif file.content_type and file.content_type.startswith("image/"):
            b64 = base64.b64encode(contents).decode("utf-8")
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": "Extract all readable text from this image accurately. List only the text found.",
                        "images": [b64],
                        "stream": False,
                    },
                )
                if response.status_code == 200:
                    extracted_text = response.json().get("response", "")
        else:
            extracted_text = contents.decode("utf-8")

        if not extracted_text.strip():
            raise BadRequestError("No readable text extracted")

        new_doc = ProductDocument(
            product_id=product_id,
            filename=file.filename,
            content=extracted_text,
            file_type=(file.content_type or "").split("/")[-1],
        )
        db.add(new_doc)
        await db.flush()

        all_docs = (await db.execute(
            select(ProductDocument).where(ProductDocument.product_id == product_id)
        )).scalars().all()
        product.manual_content = "\n\n".join([d.content for d in all_docs])

        db.add(ActivityLog(
            company_id=current_owner.company_id,
            action="KNOWLEDGE_INDEXED",
            entity_name=product.name,
            details=f"Attached node: {file.filename}",
        ))
        await db.commit()
        return {"status": "success", "message": f"Document indexed and added to {product.name} repository"}
    except Exception as exc:
        await db.rollback()
        raise BadRequestError(str(exc)) from exc


@router.delete("/documents/{doc_id}")
async def delete_product_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner),
):
    doc = (await db.execute(
        select(ProductDocument)
        .options(joinedload(ProductDocument.product))
        .where(ProductDocument.id == doc_id)
    )).scalars().first()
    if not doc or doc.product.company_id != current_owner.company_id:
        raise NotFoundError("Document not found")

    product = doc.product
    await db.delete(doc)
    await db.flush()

    all_docs = (await db.execute(
        select(ProductDocument).where(ProductDocument.product_id == product.id)
    )).scalars().all()
    product.manual_content = "\n\n".join([d.content for d in all_docs])

    db.add(ActivityLog(
        company_id=current_owner.company_id,
        action="KNOWLEDGE_REMOVED",
        entity_name=product.name,
        details=f"Detached node: {doc.filename}",
    ))
    await db.commit()
    return {"status": "success"}


@router.get("/negotiations", response_model=List[QueryOut])
async def list_negotiations(
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner),
):
    result = await db.execute(
        select(Query)
        .where(
            Query.company_id == current_owner.company_id,
            Query.is_escalated.is_(True),
            Query.status == QueryStatus.PENDING,
        )
        .order_by(Query.deadline_at.asc())
    )
    return result.scalars().all()


@router.post("/negotiations/{query_id}/resolve")
async def resolve_negotiation(
    query_id: str,
    action: NegotiationAction,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_owner: User = Depends(get_current_active_owner),
):
    query = (await db.execute(
        select(Query)
        .options(joinedload(Query.company))
        .where(
            Query.id == query_id, Query.company_id == current_owner.company_id
        )
    )).scalars().first()
    if not query:
        raise NotFoundError("Negotiation node not found")

    query.final_answer = action.final_answer
    query.status = action.status
    query.resolved_at = datetime.utcnow()

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
    background_tasks.add_task(
        send_response_email,
        query.complainant_email,
        f"Update regarding your query #{query.complaint_id}",
        email_body,
    )
    await db.commit()
    return {"status": "success"}
