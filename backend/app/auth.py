from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import Any
import secrets

from app.database import get_db
from app.models.models import User, UserRole as ModelUserRole, PasswordResetToken
from app.schemas.schemas import UserCreate, UserResponse, Token
from app.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_user_by_email,
    get_user_by_username
)

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user_email = get_user_by_email(db, email=user.email)
    if db_user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    db_user_username = get_user_by_username(db, username=user.username)
    if db_user_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        department=user.department,
        division=user.division,
        role=ModelUserRole.USER
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user

@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

# パスワードリセットトークンを生成
def generate_password_reset_token(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(48)
    expiry = datetime.utcnow() + timedelta(hours=1)
    reset_token = PasswordResetToken(user_id=user.id, token=token, expires_at=expiry)
    db.add(reset_token)
    db.commit()
    return token

# メール送信の仮実装
def send_password_reset_email(email: str, token: str):
    reset_link = f"http://localhost:3000/reset-password/{token}"
    print(f"Send to {email}: Click here to reset your password: {reset_link}")

@router.post("/auth/reset-password")
def reset_password(email: str = Body(..., embed=True), db: Session = Depends(get_db)) -> Any:
    user = get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="The user with this email does not exist.")

    token = generate_password_reset_token(db, user)
    send_password_reset_email(user.email, token)
    return {"message": "Password reset email sent"}

@router.post("/auth/reset-password/{token}")
def submit_password_reset(token: str, new_password: str = Body(..., embed=True), db: Session = Depends(get_db)):
    reset_token = db.query(PasswordResetToken).filter_by(token=token).first()
    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid token")

    if reset_token.expires_at < datetime.utcnow():
        db.delete(reset_token)
        db.commit()
        raise HTTPException(status_code=400, detail="Token has expired")

    user = db.query(User).filter_by(id=reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(new_password)
    db.delete(reset_token)
    db.commit()

    return {"message": "Password has been reset successfully"}