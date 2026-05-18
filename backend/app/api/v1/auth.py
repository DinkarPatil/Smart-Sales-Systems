from datetime import timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core import security
from app.core.config import settings
from app.core.exceptions import BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError
from app.db.session import get_db
from app.models import AuthEvent, User, UserRole
from app.schemas.auth import CustomerCreate, PasswordReset, Token
from app.schemas.common import Msg
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services.email_service import send_response_email

router = APIRouter()


@router.post("/password-recovery/{email}", response_model=Msg)
async def recover_password(email: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        raise NotFoundError("The user with this username does not exist in the system.")

    token = security.generate_password_reset_token(email=email)
    recovery_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    body = (
        f"Hello {user.full_name},<br><br>"
        f"You requested a password reset for your account. Please click the link below to set a new password:<br><br>"
        f"<a href='{recovery_link}' style='padding: 10px 20px; background-color: #4F46E5; "
        f"color: white; text-decoration: none; border-radius: 5px;'>Reset Password</a><br><br>"
        f"If you did not request this, please ignore this email.<br>"
        f"This link will expire in 1 hour."
    )
    await send_response_email(email_to=user.email, subject=f"Password Recovery for {user.full_name}", body=body)
    return {"msg": "Password recovery email sent"}


@router.post("/reset-password/", response_model=Msg)
async def reset_password(payload: PasswordReset, db: AsyncSession = Depends(get_db)):
    email = security.verify_password_reset_token(payload.token)
    if not email:
        raise BadRequestError("Invalid token")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        raise NotFoundError("The user with this username does not exist in the system.")
    if not user.is_active:
        raise BadRequestError("Inactive user")

    user.hashed_password = security.get_password_hash(payload.new_password)
    db.add(user)
    await db.commit()
    return {"msg": "Password updated successfully"}


@router.post("/register", response_model=UserOut)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise BadRequestError("User with this email already exists.")

    is_admin = bool(
        user_in.admin_secret_key and user_in.admin_secret_key == settings.ADMIN_SECRET_KEY
    )

    new_user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=UserRole.ADMIN if is_admin else UserRole.SALES_REP,
        is_active=is_admin,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    if is_admin:
        await send_response_email(
            email_to=new_user.email,
            subject="🚀 Administrative Clearance Granted",
            body=(
                f"Hello {new_user.full_name},<br><br>"
                "You have been successfully onboarded as a <b>System Administrator</b> for the Sales RAG Platform.<br>"
                "You now have unrestricted access to the Admin Panel and command center functions."
            ),
        )
    return new_user


def _request_meta(request: Request) -> dict:
    """Distil IP + UA from a FastAPI request for AuthEvent metadata."""
    fwd = request.headers.get("x-forwarded-for", "")
    ip = (fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else None))
    return {"ip": ip, "user_agent": request.headers.get("user-agent")}


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    meta = _request_meta(request)

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        # Best-effort audit. user_id is null if email is unknown.
        db.add(AuthEvent(
            user_id=user.id if user else None,
            kind="login_fail",
            event_metadata={**meta, "email": form_data.username},
        ))
        await db.commit()
        raise UnauthorizedError("Incorrect email or password")

    if not user.is_active:
        db.add(AuthEvent(
            user_id=user.id,
            kind="login_fail",
            event_metadata={**meta, "reason": "inactive"},
        ))
        await db.commit()
        raise ForbiddenError("Account inactive. Please wait for admin approval.")

    access_token = security.create_access_token(
        subject=user.email,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    db.add(AuthEvent(user_id=user.id, kind="login", event_metadata=meta))
    await db.commit()
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(deps.get_current_active_user)):
    return current_user


@router.put("/me", response_model=UserOut)
async def update_me(
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    if user_in.theme is not None:
        current_user.theme = user_in.theme
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/register/customer", response_model=UserOut)
async def register_customer(
    customer_in: CustomerCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Customer-only self-registration. Creates an inactive user and emails a verification link.
    Staff (Admin/Owner/Manager/Agent/Reviewer/Curator/Auditor/Billing) are provisioned via Admin endpoints.
    """
    result = await db.execute(select(User).where(User.email == customer_in.email))
    if result.scalars().first():
        raise BadRequestError("An account with this email already exists.")

    new_user = User(
        email=customer_in.email,
        hashed_password=security.get_password_hash(customer_in.password),
        full_name=customer_in.full_name,
        role=UserRole.CUSTOMER,
        is_active=False,  # flipped True by /verify-email/{token}
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    verification_token = security.generate_email_verification_token(email=new_user.email)
    verify_link = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    body = (
        f"Hello {new_user.full_name or 'there'},<br><br>"
        "Welcome to Smart Sales. Please confirm your email address to activate your account:<br><br>"
        f"<a href='{verify_link}' style='padding:10px 20px;background-color:#6d28d9;"
        "color:white;text-decoration:none;border-radius:6px;'>Verify my email</a><br><br>"
        "This link expires in 24 hours. If you did not create an account, you can safely ignore this email."
    )
    background_tasks.add_task(
        send_response_email,
        email_to=new_user.email,
        subject="Verify your Smart Sales email",
        body=body,
    )
    return new_user


@router.post("/verify-email/{token}", response_model=Msg)
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    """Consume an email-verification JWT and activate the user. Idempotent: a second call on an
    already-active user returns 400 so the UI can distinguish first-time vs. replayed activation.
    """
    email = security.verify_email_verification_token(token)
    if not email:
        raise BadRequestError("Invalid or expired verification token.")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        raise NotFoundError("Account not found.")
    if user.is_active:
        raise BadRequestError("Email already verified.")

    user.is_active = True
    db.add(user)
    await db.commit()
    return {"msg": "Email verified successfully."}
