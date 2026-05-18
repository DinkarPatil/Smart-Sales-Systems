import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class QueryStatus(str, enum.Enum):
    PENDING = "Pending"
    RESOLVED = "Resolved"
    ESCALATED = "Escalated"


class Query(Base):
    __tablename__ = "queries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String, unique=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    sales_rep_id = Column(String, ForeignKey("users.id"), nullable=True)
    complainant_email = Column(String, nullable=False)
    query_text = Column(Text, nullable=False)
    ai_generated_answer = Column(Text)
    final_answer = Column(Text)
    status = Column(String, default=QueryStatus.PENDING)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_escalated = Column(Boolean, default=False)
    escalated_at = Column(DateTime(timezone=True), nullable=True)
    deadline_at = Column(DateTime(timezone=True), nullable=True)
    priority = Column(String, default="normal")
    escalation_reason = Column(Text, nullable=True)
    tokens = Column(Integer, default=0)

    company = relationship("Company", back_populates="queries")
    sales_rep = relationship("User", back_populates="queries")
