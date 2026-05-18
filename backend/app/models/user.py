import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    AUDITOR = "Auditor"
    BILLING = "Billing"
    OWNER = "Owner"
    CURATOR = "Curator"
    MANAGER = "Manager"
    REVIEWER = "Reviewer"
    AGENT = "Agent"
    SALES_REP = "SalesRep"  # legacy alias, accepted until rename window closes
    CUSTOMER = "Customer"
    SYSTEM = "System"


# Role string values accepted as "Agent" during the SalesRep -> Agent rename window.
AGENT_ROLE_VALUES: frozenset[str] = frozenset({UserRole.AGENT.value, UserRole.SALES_REP.value})


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default=UserRole.SALES_REP)
    is_active = Column(Boolean, default=False)
    company_id = Column(String, ForeignKey("companies.id"), nullable=True)
    theme = Column(String, default="system")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="users")
    queries = relationship("Query", back_populates="sales_rep")
