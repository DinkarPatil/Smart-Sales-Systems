from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


RoleInCompany = Literal["Manager", "Agent", "Reviewer", "Curator"]
AssignmentStatus = Literal["active", "paused"]


class UserCompanyAssignmentCreate(BaseModel):
    user_id: str
    company_id: str
    role_in_company: RoleInCompany
    manager_id: Optional[str] = None
    is_primary: bool = False


class UserCompanyAssignmentUpdate(BaseModel):
    status: Optional[AssignmentStatus] = None
    is_primary: Optional[bool] = None
    manager_id: Optional[str] = None


class UserCompanyAssignmentOut(BaseModel):
    id: str
    user_id: str
    user_email: Optional[str] = None
    user_full_name: Optional[str] = None
    company_id: str
    company_name: Optional[str] = None
    role_in_company: str
    manager_id: Optional[str] = None
    manager_full_name: Optional[str] = None
    assigned_by: Optional[str] = None
    assigned_at: datetime
    is_primary: bool
    status: str

    class Config:
        from_attributes = True
