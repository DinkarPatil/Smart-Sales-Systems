from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import BadRequestError, ForbiddenError, UnauthorizedError
from app.db.session import get_db
from app.models import AGENT_ROLE_VALUES, User, UserRole
from app.schemas.auth import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise UnauthorizedError()
        token_data = TokenData(email=email)
    except JWTError as exc:
        raise UnauthorizedError() from exc

    result = await db.execute(select(User).where(User.email == token_data.email))
    user = result.scalars().first()
    if user is None:
        raise UnauthorizedError()
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise BadRequestError("Inactive user")
    return current_user


def _require_role(required: UserRole, message: str):
    async def _checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role != required:
            raise ForbiddenError(message)
        return current_user

    return _checker


def _require_role_in(allowed: frozenset[str], message: str):
    """Role guard that accepts any of `allowed` role string values.
    Used during the SalesRep -> Agent rename window so both values pass.
    """

    async def _checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed:
            raise ForbiddenError(message)
        return current_user

    return _checker


get_current_active_admin = _require_role(UserRole.ADMIN, "Administrative clearance required")
get_current_active_auditor = _require_role(UserRole.AUDITOR, "Auditor clearance required")
get_current_active_billing = _require_role(UserRole.BILLING, "Billing clearance required")
get_current_active_owner = _require_role(UserRole.OWNER, "Owner clearance required")
get_current_active_curator = _require_role(UserRole.CURATOR, "Curator clearance required")
get_current_active_manager = _require_role(UserRole.MANAGER, "Managerial clearance required")
get_current_active_reviewer = _require_role(UserRole.REVIEWER, "Reviewer clearance required")
get_current_active_customer = _require_role(UserRole.CUSTOMER, "Customer access required")
# Accept both "Agent" and legacy "SalesRep" during the rename window.
get_current_active_agent = _require_role_in(AGENT_ROLE_VALUES, "Agent clearance required")
# Legacy alias — same guard. Drop after rename window closes.
get_current_active_sales_rep = get_current_active_agent
