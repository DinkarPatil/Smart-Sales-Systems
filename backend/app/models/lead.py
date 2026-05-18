from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.db.base import Base


class LeadStat(Base):
    __tablename__ = "lead_stats"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    type = Column(String)  # "Call" or "SMS"
    sentiment = Column(String)  # "+ve" or "-ve"
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
