from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models.models import Company, Product, Query, QueryStatus
from app.schemas.schemas import QueryCreate, QueryOut
from app.services.rag_service import generate_ai_answer
from app.services.email_service import send_response_email
import uuid

router = APIRouter()

@router.post("/google-forms", response_model=QueryOut)
async def google_forms_webhook(query_in: QueryCreate, db: AsyncSession = Depends(get_db)):
    # 1. Verify existence of company by hashed ID
    result = await db.execute(select(Company).where(Company.id == query_in.company_id))
    company = result.scalars().first()
    if not company:
        raise HTTPException(status_code=404, detail="Company ID not recognized")
    
    # 2. Get manual content for RAG
    prod_result = await db.execute(select(Product).where(Product.company_id == company.id))
    product = prod_result.scalars().first()
    manual_content = product.manual_content if product else "No manual available."
    
    # 3. Generate AI Answer (Now hardcoded in rag_service)
    ai_answer = await generate_ai_answer(query_in.query_text, manual_content)
    
    # 4. Create new Query record
    complaint_id = query_in.complaint_id or str(uuid.uuid4())[:8].upper()
    new_query = Query(
        id=str(uuid.uuid4()),
        complaint_id=complaint_id,
        company_id=company.id,
        complainant_email=query_in.complainant_email,
        query_text=query_in.query_text,
        ai_generated_answer=ai_answer,
        status=QueryStatus.PENDING
    )
    
    db.add(new_query)
    await db.commit()
    await db.refresh(new_query)

    # 5. Automatically send the response email
    await send_response_email(
        email_to=query_in.complainant_email,
        subject=f"Re: Inquiry #{complaint_id} - Sales Support",
        body=ai_answer.replace("\n", "<br>")
    )

    return new_query
