"""
UserCompanyAssignment — the join table that lets Manager, Agent, Reviewer, and Curator
roles span multiple companies. Owners and Admins use the existing simple `users.company_id`
relationship instead.
"""
import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.sql import func

from app.db.base import Base


class UserCompanyAssignment(Base):
    __tablename__ = "user_company_assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company_id = Column(
        String,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Roles that may appear here: Manager | Agent | Reviewer | Curator.
    # (Owner / Admin / Auditor / Billing / Customer don't use this table.)
    role_in_company = Column(String, nullable=False)
    # For Agent / Reviewer rows, the responsible Manager. Nullable for Manager / Curator rows.
    manager_id = Column(String, ForeignKey("users.id"), nullable=True)
    assigned_by = Column(String, ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    is_primary = Column(Boolean, default=False, nullable=False)
    status = Column(String, default="active", nullable=False)  # 'active' | 'paused'

    __table_args__ = (UniqueConstraint("user_id", "company_id", name="uq_uca_user_company"),)
