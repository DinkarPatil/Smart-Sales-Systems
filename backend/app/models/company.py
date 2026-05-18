from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, index=True)
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
