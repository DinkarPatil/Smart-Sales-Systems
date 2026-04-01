from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

import hashlib

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    # Pre-hash with SHA-256 to solve the bcrypt 72-byte limit once and for all
    pre_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(pre_hash, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate a hashed password from a plain password."""
    # Pre-hash with SHA-256 to solve the bcrypt 72-byte limit once and for all
    pre_hash = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(pre_hash)

def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=1)
    now = datetime.utcnow()
    expires = now + delta
    encoded_jwt = jwt.encode(
        {"exp": expires, "nbf": now, "sub": email, "type": "password_reset"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt

def verify_password_reset_token(token: str) -> Union[str, None]:
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if decoded_token["type"] != "password_reset":
            return None
        return decoded_token["sub"]
    except jwt.JWTError:
        return None
