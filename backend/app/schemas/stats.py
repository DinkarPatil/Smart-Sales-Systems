from typing import Optional

from pydantic import BaseModel


class AdminStats(BaseModel):
    total_users: int
    total_companies: int
    total_products: int
    total_queries: int
    pending_queries: int
    resolved_queries: int
    # Extended counters (default 0 for backwards compat).
    escalated_queries: int = 0
    total_managers: int = 0
    total_agents: int = 0
    total_customers: int = 0
    total_assignments: int = 0
    inactive_users: int = 0


class OwnerStats(BaseModel):
    company_name: str
    total_products: int
    pending_queries: int
    resolved_queries: int
    total_team_members: int
    escalated_queries: int = 0
    products_missing_docs: int = 0
    high_priority_pending: int = 0


class SalesRepStats(BaseModel):
    active_queries: int
    resolved_queries: int
    escalated_queries: int
    efficiency_score: float
    avg_response_time: float


class ManagerStats(BaseModel):
    total_queries: int
    resolved_queries: int
    active_sales_reps: int
    sentiment_score: float


class TeamMemberOut(BaseModel):
    id: str
    full_name: Optional[str]
    email: str
    role: str
    is_active: bool = True
    active_queries: int
    resolved_queries: int
