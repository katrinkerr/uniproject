from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from pwdlib import PasswordHash
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from plot_api.models import SessionLocal, User

router = APIRouter(prefix="/auth", tags=["Auth"])
password_hasher = PasswordHash.recommended()


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

            duplicate = db.scalar(
                select(User.id).where(func.lower(User.email) == email)
            )

            if duplicate is not None:
                raise HTTPException(
                    status_code=409,
                    detail="Email already registered",
                ) from exc

            raise

        db.refresh(user)
        return RegisterResponse(id=user.id, email=user.email)