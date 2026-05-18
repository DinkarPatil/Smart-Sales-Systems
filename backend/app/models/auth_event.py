"""
AuthEvent — append-only audit trail of authentication / authorisation events.
Read by Admin (own slice) and Auditor (cross-tenant).

Common `kind` values:
  - "login"
  - "login_fail"
  - "logout"             (the Next.js logout route is stateless, so backend rarely writes this)
  - "role_change"
  - "password_reset"
  - "account_activated"
  - "account_deactivated"
"""
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, JSON, String
from sqlalchemy.sql import func

from app.db.base import Base


class AuthEvent(Base):
    __tablename__ = "auth_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    kind = Column(String, nullable=False, index=True)
    # Free-form metadata: e.g. {"ip": "...", "user_agent": "...", "old_role": "...", "new_role": "..."}
    event_metadata = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
