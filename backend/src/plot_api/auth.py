"""Registration and login endpoints for the PLOT API."""

from hashlib import sha256
import secrets
import time
from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from pwdlib import PasswordHash
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from plot_api.models import SessionLocal, User, UserSession

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

router = APIRouter(prefix="/auth", tags=["Auth"])
bearer_scheme = HTTPBearer(auto_error=False)
password_hasher = PasswordHash.recommended()
DUMMY_PASSWORD_HASH = password_hasher.hash("dummy-password-for-unknown-user")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Password cannot consist only of spaces")
        return value


class RegisterResponse(BaseModel):
    id: int
    email: EmailStr


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=RegisterResponse,
)
def register(data: RegisterRequest) -> RegisterResponse:
    email = str(data.email).lower()

    with SessionLocal() as db:
        existing = db.scalar(
            select(User).where(func.lower(User.email) == email)
        )
        if existing is not None:
            raise HTTPException(
                status_code=409,
                detail="Email already registered",
            )

        user = User(
            email=email,
            password_hash=password_hasher.hash(data.password),
        )
        db.add(user)

        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            # A parallel request may have registered this email already.
            duplicate = db.scalar(
                select(User.id).where(func.lower(User.email) == email)
            )
            if duplicate is not None:
                raise HTTPException(
                    status_code=409,
                    detail="Email already registered",
                ) from exc
            # Other database errors should not be disguised as a duplicate email.
            raise

        db.refresh(user)
        return RegisterResponse(id=user.id, email=user.email)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class LoginResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest) -> LoginResponse:
    """Verify credentials and store a 24-hour session in SQLite."""
    email = str(data.email).lower()

    with SessionLocal() as db:
        user = db.scalar(select(User).where(func.lower(User.email) == email))

        # Verify against a dummy hash for unknown users to reduce timing leaks.
        stored_hash = user.password_hash if user is not None else DUMMY_PASSWORD_HASH
        valid_password = password_hasher.verify(data.password, stored_hash)
        if user is None or not valid_password:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = secrets.token_urlsafe(32)
        db.add(
            UserSession(
                token_hash=sha256(token.encode("utf-8")).hexdigest(),
                user_id=user.id,
                expires_at=int(time.time()) + 24 * 60 * 60,
            )
        )
        db.commit()

    return LoginResponse(access_token=token)


def _invalid_session() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired session token",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme)
    ],
) -> User:
    if credentials is None:
        raise _invalid_session()

    token_hash = sha256(
        credentials.credentials.encode("utf-8")
    ).hexdigest()

    with SessionLocal() as db:
        session = db.get(UserSession, token_hash)

        if session is None or session.expires_at <= int(time.time()):
            raise _invalid_session()

        user = db.get(User, session.user_id)

        if user is None:
            raise _invalid_session()

        return user


@router.get("/me", response_model=RegisterResponse)
def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> RegisterResponse:
    return RegisterResponse(
        id=current_user.id,
        email=current_user.email
    )
