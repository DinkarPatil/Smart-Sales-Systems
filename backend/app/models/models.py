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
    
    company = relationship("Company", back_populates="users")
    queries = relationship("Query", back_populates="sales_rep")

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(String, primary_key=True, index=True) # Hashed or UUID as requested
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    config = Column(JSON, default={})
    
    users = relationship("User", back_populates="company")
    products = relationship("Product", back_populates="company")
    queries = relationship("Query", back_populates="company")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    manual_content = Column(Text) # The content for RAG
    
    company = relationship("Company", back_populates="products")

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
    
    company = relationship("Company", back_populates="queries")
    sales_rep = relationship("User", back_populates="queries")

class LeadStat(Base):
    __tablename__ = "lead_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    type = Column(String) # "Call" or "SMS"
    sentiment = Column(String) # "+ve" or "-ve"
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
