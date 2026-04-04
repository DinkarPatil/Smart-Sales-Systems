import uuid
from sqlalchemy import Column, String, Boolean, Enum, ForeignKey, Integer, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    MANAGER = "Manager"
    OWNER = "Owner"
    SALES_REP = "SalesRep"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default=UserRole.SALES_REP) # Pending roles for others
    is_active = Column(Boolean, default=False) # Admin must activate
    company_id = Column(String, ForeignKey("companies.id"), nullable=True)
    theme = Column(String, default="system")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    company = relationship("Company", back_populates="users")
    queries = relationship("Query", back_populates="sales_rep")

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(String, primary_key=True, index=True) # Hashed or UUID as requested
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    config = Column(JSON, default={})
    total_tokens = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    admin_suspended = Column(Boolean, default=False)
    manager_suspended = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="company")
    products = relationship("Product", back_populates="company")
    queries = relationship("Query", back_populates="company")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    price = Column(String) # For display
    base_price = Column(Integer, default=0) # For calculations (pence/cents)
    max_discount_pct = Column(Integer, default=0) # Predefined by owner
    manual_content = Column(Text) # Aggregated content for RAG
    
    company = relationship("Company", back_populates="products")
    documents = relationship("ProductDocument", back_populates="product", cascade="all, delete-orphan")

class ProductDocument(Base):
    __tablename__ = "product_documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    filename = Column(String)
    content = Column(Text)
    file_type = Column(String) # "pdf", "image", "txt"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    product = relationship("Product", back_populates="documents")

class QueryStatus(str, enum.Enum):
    PENDING = "pending"
    RESOLVED = "resolved"

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
    priority = Column(String, default="normal") # "normal", "high"
    tokens = Column(Integer, default=0)
    
    company = relationship("Company", back_populates="queries")
    sales_rep = relationship("User", back_populates="queries")

class LeadStat(Base):
    __tablename__ = "lead_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    type = Column(String) # "Call" or "SMS"
    sentiment = Column(String) # "+ve" or "-ve"
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
