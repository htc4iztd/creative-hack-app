# === 目的 ===
# 指摘された3つの新しいDBテーブルをビジネスロジックに統合
# - ユーザーの多重ログイン防止: user_sessions
# - ログイン履歴の保存: user_login_history
# - メールアドレス認証: email_verification_tokens

from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import Any
import secrets
from app.database import get_db
from app.models.models import (
    User, UserRole as ModelUserRole, PasswordResetToken,
    UserSession, UserLoginHistory, EmailVerificationToken
)
from app.schemas.schemas import UserCreate, UserResponse, Token
from app.auth_logic import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_user_by_email,
    get_user_by_username
)
import uuid

router = APIRouter()

# === ユーザー登録 ===
@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        department=user.department,
        division=user.division,
        role=ModelUserRole.USER,
        is_email_verified=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # メール確認トークン発行
    token = str(uuid.uuid4())
    token_entry = EmailVerificationToken(user_id=db_user.id, token=token, expires_at=datetime.utcnow() + timedelta(days=1))
    db.add(token_entry)
    db.commit()
    print(f"[DEBUG] Verification: http://localhost:3000/verify-email/{token}")

    return db_user

# === メール認証処理 ===
@router.get("/verify-email/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    token_entry = db.query(EmailVerificationToken).filter_by(token=token).first()
    if not token_entry or token_entry.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.query(User).filter_by(id=token_entry.user_id).first()
    user.is_email_verified = True
    db.delete(token_entry)
    db.commit()
    return {"message": "Email verified successfully"}

# === ログイン + セッション + 履歴 ===
@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    request: Request = None
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    # 多重ログイン防止（既存セッション削除）
    db.query(UserSession).filter_by(user_id=user.id).delete()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    # セッション保存
    new_session = UserSession(
        user_id=user.id,
        token=access_token,
        expires_at=datetime.utcnow() + access_token_expires
    )
    db.add(new_session)

    # ログイン履歴保存
    login_history = UserLoginHistory(
        user_id=user.id,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    db.add(login_history)

    db.commit()

    return {"access_token": access_token, "token_type": "bearer"}