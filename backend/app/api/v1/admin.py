import hashlib
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import get_current_active_admin
from app.core import security
from app.core.exceptions import BadRequestError, ConflictError, NotFoundError
from app.db.session import get_db
from app.models import (
    ActivityLog,
    AGENT_ROLE_VALUES,
    AuthEvent,
    Company,
    Product,
    ProductDocument,
    Query as QueryModel,
    QueryStatus,
    User,
    UserCompanyAssignment,
    UserRole,
)
from app.schemas.assignment import (
    UserCompanyAssignmentCreate,
    UserCompanyAssignmentOut,
    UserCompanyAssignmentUpdate,
)
from app.schemas.audit import AuditEntry, RagDiagnostics, ReindexResult, SystemLogEntry
from app.schemas.common import Msg
from app.schemas.company import CompanyCreate, CompanyOut, CompanyUpdate
from app.schemas.stats import AdminStats
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services.email_service import send_response_email

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
# Stats
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    async def count(stmt):
        return (await db.execute(stmt)).scalar_one()

    return {
        "total_users": await count(select(func.count(User.id))),
        "inactive_users": await count(select(func.count(User.id)).where(User.is_active == False)),  # noqa: E712
        "total_companies": await count(select(func.count(Company.id))),
        "total_products": await count(select(func.count(Product.id))),
        "total_queries": await count(select(func.count(QueryModel.id))),
        "pending_queries": await count(
            select(func.count(QueryModel.id)).where(QueryModel.status == QueryStatus.PENDING)
        ),
        "resolved_queries": await count(
            select(func.count(QueryModel.id)).where(QueryModel.status == QueryStatus.RESOLVED)
        ),
        "escalated_queries": await count(
            select(func.count(QueryModel.id)).where(QueryModel.status == QueryStatus.ESCALATED)
        ),
        "total_managers": await count(
            select(func.count(User.id)).where(User.role == UserRole.MANAGER.value)
        ),
        "total_agents": await count(
            select(func.count(User.id)).where(User.role.in_(AGENT_ROLE_VALUES))
        ),
        "total_customers": await count(
            select(func.count(User.id)).where(User.role == UserRole.CUSTOMER.value)
        ),
        "total_assignments": await count(select(func.count(UserCompanyAssignment.id))),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Users
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/users", response_model=List[UserOut])
async def list_users(
    role: Optional[str] = Query(None, description="Filter by role string"),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None, description="Email or full_name substring"),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    stmt = select(User).options(joinedload(User.company)).order_by(User.created_at.desc())
    if role:
        stmt = stmt.where(User.role == role)
    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(or_(User.email.ilike(like), User.full_name.ilike(like)))

    users = (await db.execute(stmt)).unique().scalars().all()
    user_ids = [u.id for u in users]

    # Fetch UCA rows for these users in one shot.
    uca_map: dict[str, list[dict]] = {uid: [] for uid in user_ids}
    if user_ids:
        rows = (
            await db.execute(
                select(UserCompanyAssignment, Company.name)
                .join(Company, Company.id == UserCompanyAssignment.company_id)
                .where(UserCompanyAssignment.user_id.in_(user_ids))
            )
        ).all()
        for uca, company_name in rows:
            uca_map[uca.user_id].append({"id": uca.company_id, "name": company_name})

    out: List[UserOut] = []
    for user in users:
        data = UserOut.from_orm(user)
        # Primary company comes from users.company_id (Owner/Admin) or first UCA row otherwise.
        if user.company:
            data.company_name = user.company.name
            primary = [{"id": user.company.id, "name": user.company.name}]
        else:
            primary = []
            data.company_name = "Unassigned"

        # Merge primary + UCA assignments, de-duplicated by company_id.
        merged: dict[str, dict] = {c["id"]: c for c in primary}
        for c in uca_map.get(user.id, []):
            merged.setdefault(c["id"], c)
        data.assigned_companies = list(merged.values())
        out.append(data)
    return out


@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise NotFoundError("User not found")

    old_role = user.role
    old_active = user.is_active

    if user_update.role is not None:
        user.role = user_update.role
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.company_id is not None:
        user.company_id = user_update.company_id
    if user_update.company_ids is not None:
        user.company_id = user_update.company_ids[0] if user_update.company_ids else None

    # AuthEvent: role change
    if user_update.role is not None and old_role != user.role:
        db.add(AuthEvent(
            user_id=user.id,
            kind="role_change",
            event_metadata={"old_role": old_role, "new_role": user.role, "actor": current_admin.id},
        ))
    # AuthEvent: activation change
    if user_update.is_active is not None and old_active != user.is_active:
        db.add(AuthEvent(
            user_id=user.id,
            kind="account_activated" if user.is_active else "account_deactivated",
            event_metadata={"actor": current_admin.id},
        ))

    await db.commit()
    await db.refresh(user)
    return user


@router.post("/users", response_model=UserOut)
async def admin_create_user(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise BadRequestError("User already exists")

    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=security.get_password_hash(user_in.password),
        role=(user_in.role or UserRole.AGENT.value),
        is_active=True,
        company_id=user_in.company_id,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    db.add(AuthEvent(
        user_id=new_user.id,
        kind="provisioned",
        event_metadata={"actor": current_admin.id, "role": new_user.role},
    ))
    await db.commit()

    email_body = f"""
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #6d28d9;">Welcome to Smart Sales</h2>
      <p>Hello {new_user.full_name},</p>
      <p>An administrator has created your access account.</p>
      <div style="background:#f8fafc;padding:15px;border-radius:8px;margin:20px 0;border:1px solid #e2e8f0;">
        <p><strong>Email:</strong> {user_in.email}</p>
        <p><strong>Temporary password:</strong> {user_in.password}</p>
        <p><strong>Role:</strong> {new_user.role}</p>
      </div>
      <p>Please sign in and change your password as soon as possible.</p>
    </div>
    """
    background_tasks.add_task(
        send_response_email, user_in.email, "Welcome to Smart Sales — account created", email_body
    )
    return new_user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    if user_id == current_admin.id:
        raise BadRequestError("You cannot delete your own account.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise NotFoundError("User not found")

    # Last-Admin guard.
    if user.role == UserRole.ADMIN.value:
        remaining_admins = (
            await db.execute(
                select(func.count(User.id)).where(
                    User.role == UserRole.ADMIN.value, User.id != user.id
                )
            )
        ).scalar_one()
        if remaining_admins == 0:
            raise BadRequestError("Cannot delete the last Admin account.")

    # Null out any queries the user owned.
    await db.execute(
        update(QueryModel).where(QueryModel.sales_rep_id == user.id).values(sales_rep_id=None)
    )

    await db.delete(user)
    await db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# Companies
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/companies", response_model=CompanyOut)
async def create_company(
    company_in: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    hashed_id = hashlib.sha256(company_in.name.encode()).hexdigest()[:16]
    if (await db.execute(select(Company).where(Company.id == hashed_id))).scalars().first():
        raise ConflictError("A company with that name already exists.")

    new_company = Company(
        id=hashed_id,
        name=company_in.name,
        description=company_in.description,
        config=company_in.config,
    )
    db.add(new_company)
    await db.commit()
    await db.refresh(new_company)
    return new_company


@router.get("/companies", response_model=List[CompanyOut])
async def list_companies(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    result = await db.execute(select(Company))
    companies = result.scalars().all()

    now = datetime.utcnow()
    one_week_ago = now - timedelta(days=7)
    one_month_ago = now - timedelta(days=30)
    out = []
    for company in companies:
        async def scalar(stmt):
            return (await db.execute(stmt)).scalar_one()

        product_count = await scalar(
            select(func.count(Product.id)).where(Product.company_id == company.id)
        )
        user_count = await scalar(
            select(func.count(User.id)).where(User.company_id == company.id)
        )
        sales_rep_count = await scalar(
            select(func.count(User.id)).where(
                User.company_id == company.id,
                User.role.in_(AGENT_ROLE_VALUES),
            )
        )
        weekly_tokens = (await db.execute(
            select(func.sum(QueryModel.tokens)).where(
                QueryModel.company_id == company.id,
                QueryModel.created_at >= one_week_ago,
            )
        )).scalar() or 0
        monthly_tokens = (await db.execute(
            select(func.sum(QueryModel.tokens)).where(
                QueryModel.company_id == company.id,
                QueryModel.created_at >= one_month_ago,
            )
        )).scalar() or 0
        manager_names = (await db.execute(
            select(User.full_name).where(
                User.company_id == company.id,
                User.role == UserRole.MANAGER.value,
            )
        )).scalars().all()
        manager_name_str = ", ".join([m for m in manager_names if m]) if manager_names else "Unassigned"

        admin_suspended = getattr(company, "admin_suspended", False) or False
        manager_suspended = getattr(company, "manager_suspended", False) or False

        out.append(
            CompanyOut(
                id=company.id,
                name=company.name,
                description=company.description,
                config=company.config,
                product_count=product_count,
                user_count=user_count,
                sales_rep_count=sales_rep_count,
                manager_name=manager_name_str,
                is_active=not (admin_suspended and manager_suspended),
                admin_suspended=admin_suspended,
                manager_suspended=manager_suspended,
                created_at=getattr(company, "created_at", None) or now,
                total_tokens=company.total_tokens or 0,
                weekly_tokens=weekly_tokens,
                monthly_tokens=monthly_tokens,
            )
        )
    return out


@router.put("/companies/{company_id}", response_model=CompanyOut)
async def update_company(
    company_id: str,
    company_update: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalars().first()
    if not company:
        raise NotFoundError("Company not found")

    for key, value in company_update.dict(exclude_unset=True).items():
        setattr(company, key, value)
    await db.commit()
    await db.refresh(company)
    return company


@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalars().first()
    if not company:
        raise NotFoundError("Company not found")

    # Hard-cascade everything tenant-scoped. Order matters where FKs are not cascade-configured.
    await db.execute(delete(UserCompanyAssignment).where(UserCompanyAssignment.company_id == company_id))
    await db.execute(delete(ActivityLog).where(ActivityLog.company_id == company_id))
    # Documents follow products via ORM cascade='all, delete-orphan'.
    await db.execute(delete(Product).where(Product.company_id == company_id))
    await db.execute(delete(QueryModel).where(QueryModel.company_id == company_id))
    # Detach users that pointed at this tenant via the legacy single FK.
    await db.execute(update(User).where(User.company_id == company_id).values(company_id=None))

    await db.delete(company)
    await db.commit()
    # NOTE: vector collection drop will happen here once embedding_service lands.


# ─────────────────────────────────────────────────────────────────────────────
# UserCompanyAssignment (UCA)
# ─────────────────────────────────────────────────────────────────────────────


_UCA_ALLOWED_ROLES = {"Manager", "Agent", "Reviewer", "Curator"}


async def _expand_uca(db: AsyncSession, uca: UserCompanyAssignment) -> UserCompanyAssignmentOut:
    # Fetch related names for display.
    company = (await db.execute(select(Company).where(Company.id == uca.company_id))).scalars().first()
    user = (await db.execute(select(User).where(User.id == uca.user_id))).scalars().first()
    manager = None
    if uca.manager_id:
        manager = (await db.execute(select(User).where(User.id == uca.manager_id))).scalars().first()
    return UserCompanyAssignmentOut(
        id=uca.id,
        user_id=uca.user_id,
        user_email=user.email if user else None,
        user_full_name=user.full_name if user else None,
        company_id=uca.company_id,
        company_name=company.name if company else None,
        role_in_company=uca.role_in_company,
        manager_id=uca.manager_id,
        manager_full_name=manager.full_name if manager else None,
        assigned_by=uca.assigned_by,
        assigned_at=uca.assigned_at,
        is_primary=uca.is_primary,
        status=uca.status,
    )


@router.get("/users/{user_id}/assignments", response_model=List[UserCompanyAssignmentOut])
async def list_user_assignments(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    user = (await db.execute(select(User).where(User.id == user_id))).scalars().first()
    if not user:
        raise NotFoundError("User not found")
    rows = (
        await db.execute(
            select(UserCompanyAssignment)
            .where(UserCompanyAssignment.user_id == user_id)
            .order_by(UserCompanyAssignment.assigned_at.desc())
        )
    ).scalars().all()
    return [await _expand_uca(db, r) for r in rows]


@router.post("/users/{user_id}/assignments", response_model=UserCompanyAssignmentOut)
async def create_user_assignment(
    user_id: str,
    body: UserCompanyAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    if body.user_id != user_id:
        raise BadRequestError("Path user_id and body user_id must match.")
    if body.role_in_company not in _UCA_ALLOWED_ROLES:
        raise BadRequestError(
            f"role_in_company must be one of {sorted(_UCA_ALLOWED_ROLES)}; Owner/Admin/etc. use users.company_id."
        )

    user = (await db.execute(select(User).where(User.id == user_id))).scalars().first()
    if not user:
        raise NotFoundError("User not found")
    company = (await db.execute(select(Company).where(Company.id == body.company_id))).scalars().first()
    if not company:
        raise NotFoundError("Company not found")

    # Duplicate check (also enforced by UNIQUE constraint, but emit a clean error).
    dup = (
        await db.execute(
            select(UserCompanyAssignment).where(
                UserCompanyAssignment.user_id == user_id,
                UserCompanyAssignment.company_id == body.company_id,
            )
        )
    ).scalars().first()
    if dup:
        raise ConflictError("This user is already assigned to that company.")

    # Manager target validation: Agent + Reviewer rows must point at a Manager that's assigned to the same company.
    if body.role_in_company in ("Agent", "Reviewer"):
        if not body.manager_id:
            raise BadRequestError("manager_id is required for Agent and Reviewer assignments.")
        mgr = (await db.execute(select(User).where(User.id == body.manager_id))).scalars().first()
        if not mgr:
            raise NotFoundError("manager_id user not found")
        if mgr.role != UserRole.MANAGER.value:
            raise BadRequestError("manager_id user is not a Manager.")
        mgr_in_tenant = (
            await db.execute(
                select(UserCompanyAssignment).where(
                    UserCompanyAssignment.user_id == body.manager_id,
                    UserCompanyAssignment.company_id == body.company_id,
                    UserCompanyAssignment.role_in_company == "Manager",
                    UserCompanyAssignment.status == "active",
                )
            )
        ).scalars().first()
        # Also accept the legacy users.company_id pointer.
        if not mgr_in_tenant and mgr.company_id != body.company_id:
            raise BadRequestError(
                "manager_id is not assigned to that company; assign the Manager first."
            )

    # If is_primary=true, clear other primary flags for this user.
    if body.is_primary:
        await db.execute(
            update(UserCompanyAssignment)
            .where(UserCompanyAssignment.user_id == user_id)
            .values(is_primary=False)
        )

    uca = UserCompanyAssignment(
        user_id=user_id,
        company_id=body.company_id,
        role_in_company=body.role_in_company,
        manager_id=body.manager_id,
        assigned_by=current_admin.id,
        is_primary=body.is_primary,
        status="active",
    )
    db.add(uca)
    await db.commit()
    await db.refresh(uca)
    return await _expand_uca(db, uca)


@router.patch("/assignments/{assignment_id}", response_model=UserCompanyAssignmentOut)
async def update_assignment(
    assignment_id: str,
    body: UserCompanyAssignmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    uca = (await db.execute(select(UserCompanyAssignment).where(UserCompanyAssignment.id == assignment_id))).scalars().first()
    if not uca:
        raise NotFoundError("Assignment not found")
    if body.status is not None:
        uca.status = body.status
    if body.is_primary is not None:
        if body.is_primary:
            await db.execute(
                update(UserCompanyAssignment)
                .where(UserCompanyAssignment.user_id == uca.user_id)
                .values(is_primary=False)
            )
        uca.is_primary = body.is_primary
    if body.manager_id is not None:
        uca.manager_id = body.manager_id
    await db.commit()
    await db.refresh(uca)
    return await _expand_uca(db, uca)


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    uca = (await db.execute(select(UserCompanyAssignment).where(UserCompanyAssignment.id == assignment_id))).scalars().first()
    if not uca:
        raise NotFoundError("Assignment not found")
    await db.delete(uca)
    await db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# System: logs + diagnostics + reindex
# ─────────────────────────────────────────────────────────────────────────────


LOG_FILE = Path("logs/app.log")  # structlog JSONL


@router.get("/system/logs", response_model=List[SystemLogEntry])
async def get_system_logs(
    since: Optional[datetime] = Query(None),
    level: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    request_id: Optional[str] = Query(None),
    current_admin: User = Depends(get_current_active_admin),
):
    """Tail the structured JSONL log file. Returns most-recent first.
    If `logs/app.log` does not exist, returns []. (Logging file is configured by core.logging.)
    """
    if not LOG_FILE.exists():
        return []

    out: list[SystemLogEntry] = []
    # Read the file in reverse-line order, cheap for small log files. For big logs, do a tail.
    try:
        with LOG_FILE.open("r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception:
        return []

    for raw in reversed(lines):
        raw = raw.strip()
        if not raw:
            continue
        try:
            entry = json.loads(raw)
        except json.JSONDecodeError:
            continue
        # structlog typically writes {"timestamp": ..., "level": ..., "event": ..., ...}
        ts_str = entry.get("timestamp") or entry.get("time")
        try:
            ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00")) if ts_str else datetime.utcnow()
        except (ValueError, AttributeError):
            ts = datetime.utcnow()
        lvl = (entry.get("level") or entry.get("severity") or "INFO").upper()
        msg = entry.get("event") or entry.get("message") or ""
        rid = entry.get("request_id")
        extra = {k: v for k, v in entry.items() if k not in {"timestamp", "time", "level", "severity", "event", "message", "request_id"}}

        if since and ts < since:
            continue
        if level and lvl != level.upper():
            continue
        if request_id and rid != request_id:
            continue

        out.append(SystemLogEntry(timestamp=ts, level=lvl, message=msg, request_id=rid, extra=extra or None))
        if len(out) >= limit:
            break
    return out


@router.get("/system/diagnostics", response_model=RagDiagnostics)
async def get_system_diagnostics(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    """Real RAG / vector-store diagnostics. Mostly zero today (vector store service not yet built);
    returns the right *shape* so the frontend works end-to-end."""
    from app.core.config import settings

    last_hour_queries = (
        await db.execute(
            select(func.count(QueryModel.id)).where(
                QueryModel.created_at >= datetime.utcnow() - timedelta(hours=1)
            )
        )
    ).scalar_one()
    return RagDiagnostics(
        embedding_model=getattr(settings, "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"),
        vector_store=getattr(settings, "VECTOR_STORE", "in_memory"),
        per_tenant_collections=0,
        total_vectors=0,
        avg_query_latency_ms=0.0,
        cache_hit_rate=0.0,
        last_hour_queries=last_hour_queries,
        failed_queries_24h=0,
        judge_block_rate_24h=0.0,
        rebuilding_collections=[],
    )


@router.post("/companies/{company_id}/reindex", response_model=ReindexResult)
async def reindex_company(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    """Rebuild the per-tenant vector collection from product_documents.
    Today returns counts only — the actual embedding pipeline lands with the
    embedding_service module from the backend skill. Frontend wiring is complete.
    """
    company = (await db.execute(select(Company).where(Company.id == company_id))).scalars().first()
    if not company:
        raise NotFoundError("Company not found")
    started = time.perf_counter()
    doc_count = (
        await db.execute(
            select(func.count(ProductDocument.id))
            .join(Product, Product.id == ProductDocument.product_id)
            .where(Product.company_id == company_id)
        )
    ).scalar_one()
    db.add(ActivityLog(
        company_id=company_id,
        action="TENANT_REINDEX_STUB",
        entity_name=company.name,
        details=f"Reindex requested by admin {current_admin.email}. Embedding service pending; counts only.",
    ))
    await db.commit()
    return ReindexResult(
        company_id=company_id,
        chunks_indexed=0,
        documents_seen=doc_count,
        duration_ms=int((time.perf_counter() - started) * 1000),
        note="Vector store service not yet wired; this is a counting stub.",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Audit (real) — merges activity_logs + auth_events
# ─────────────────────────────────────────────────────────────────────────────


@router.get("/audit", response_model=List[AuditEntry])
async def get_audit(
    from_: Optional[datetime] = Query(None, alias="from"),
    to: Optional[datetime] = Query(None),
    actor: Optional[str] = Query(None, description="actor user_id"),
    company: Optional[str] = Query(None, alias="company"),
    kind: Optional[str] = Query(None, description="ACTIVITY | AUTH"),
    limit: int = Query(200, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_active_admin),
):
    items: list[AuditEntry] = []

    if kind in (None, "ACTIVITY"):
        a_stmt = select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit)
        if from_:
            a_stmt = a_stmt.where(ActivityLog.created_at >= from_)
        if to:
            a_stmt = a_stmt.where(ActivityLog.created_at <= to)
        if company:
            a_stmt = a_stmt.where(ActivityLog.company_id == company)
        for row in (await db.execute(a_stmt)).scalars().all():
            items.append(
                AuditEntry(
                    id=row.id,
                    timestamp=row.created_at,
                    kind="ACTIVITY",
                    company_id=row.company_id,
                    entity_type=row.action,
                    entity_id=None,
                    summary=f"{row.action}: {row.entity_name}",
                    details={"raw_details": row.details} if row.details else None,
                )
            )

    if kind in (None, "AUTH"):
        ae_stmt = (
            select(AuthEvent, User.email)
            .join(User, User.id == AuthEvent.user_id, isouter=True)
            .order_by(AuthEvent.created_at.desc())
            .limit(limit)
        )
        if from_:
            ae_stmt = ae_stmt.where(AuthEvent.created_at >= from_)
        if to:
            ae_stmt = ae_stmt.where(AuthEvent.created_at <= to)
        if actor:
            ae_stmt = ae_stmt.where(AuthEvent.user_id == actor)
        for ae, email in (await db.execute(ae_stmt)).all():
            items.append(
                AuditEntry(
                    id=ae.id,
                    timestamp=ae.created_at,
                    kind="AUTH",
                    actor_user_id=ae.user_id,
                    actor_email=email,
                    entity_type=ae.kind,
                    summary=f"{ae.kind} ({email or 'unknown'})",
                    details=ae.event_metadata,
                )
            )

    items.sort(key=lambda i: i.timestamp, reverse=True)
    return items[:limit]


# Legacy stubs left in place with deprecation note — they 308 to new endpoints.
@router.get("/audit-logs", response_model=Msg, deprecated=True)
async def legacy_audit_logs():
    return {"msg": "Deprecated. Use /api/v1/admin/audit."}


@router.get("/neural-diagnostics", response_model=Msg, deprecated=True)
async def legacy_neural_diagnostics():
    return {"msg": "Deprecated. Use /api/v1/admin/system/diagnostics."}
