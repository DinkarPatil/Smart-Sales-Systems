from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import security
from app.core.config import settings
from app.db.database import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import Token, UserCreate, UserUpdate, UserOut, PasswordResetRequest, PasswordReset, Msg
from app.api import deps
from app.services.email_service import send_response_email

router = APIRouter()

@router.post("/password-recovery/{email}", response_model=Msg)
async def recover_password(email: str, db: AsyncSession = Depends(get_db)):
    """
    Password Recovery
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    password_reset_token = security.generate_password_reset_token(email=email)
    
    # We use a simple HTML template for the recovery email
    recovery_link = f"{settings.FRONTEND_URL}/reset-password?token={password_reset_token}"
    subject = f"Password Recovery for {user.full_name}"
    body = (
        f"Hello {user.full_name},<br><br>"
        f"You requested a password reset for your account. Please click the link below to set a new password:<br><br>"
        f"<a href='{recovery_link}' style='padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;'>Reset Password</a><br><br>"
        f"If you did not request this, please ignore this email.<br>"
        f"This link will expire in 1 hour."
    )
    
    await send_response_email(email_to=user.email, subject=subject, body=body)
    return {"msg": "Password recovery email sent"}

@router.post("/reset-password/", response_model=Msg)
async def reset_password(
    password_reset: PasswordReset,
    db: AsyncSession = Depends(get_db),
):
    """
    Reset password
    """
    email = security.verify_password_reset_token(password_reset.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
        
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    hashed_password = security.get_password_hash(password_reset.new_password)
    user.hashed_password = hashed_password
    db.add(user)
    await db.commit()
    return {"msg": "Password updated successfully"}

@router.post("/register", response_model=UserOut)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists."
        )
    
    # Logic for Admin role via Secret Key
    is_admin = False
    if user_in.admin_secret_key and user_in.admin_secret_key == settings.ADMIN_SECRET_KEY:
        is_admin = True
    
    new_user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=UserRole.ADMIN if is_admin else UserRole.SALES_REP,
        is_active=True if is_admin else False # Admins are active, others need approval
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Dispatch Onboarding Email for Admins
    if is_admin:
        await send_response_email(
            email_to=new_user.email,
            subject="🚀 Administrative Clearance Granted",
            body=(
                f"Hello {new_user.full_name},<br><br>"
                "You have been successfully onboarded as a <b>System Administrator</b> for the Sales RAG Platform.<br>"
                "You now have unrestricted access to the Admin Panel and command center functions."
            )
        )

    return new_user

@router.post("/login", response_model=Token)
async def login(
    db: AsyncSession = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account inactive. Please wait for admin approval."
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(deps.get_current_active_user)):
    return current_user

@router.put("/me", response_model=UserOut)
async def update_me(
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if user_in.theme is not None:
        current_user.theme = user_in.theme
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user
