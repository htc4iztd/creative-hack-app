import uuid
import secrets
import logging
from datetime import timedelta, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

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

router = APIRouter()
logger = logging.getLogger(__name__)

# === ユーザー登録 ===
@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"[REGISTER] 登録リクエスト: username={user.username}, email={user.email}")

    if get_user_by_email(db, email=user.email):
        logger.warning(f"[REGISTER] 重複メール: {user.email}")
        raise HTTPException(status_code=400, detail="Email already registered")
    if get_user_by_username(db, username=user.username):
        logger.warning(f"[REGISTER] 重複ユーザー名: {user.username}")
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        department=user.department,
        role=user.role,
        is_email_verified=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # メール確認トークン発行
    token = str(uuid.uuid4())
    token_entry = EmailVerificationToken(
        user_id=db_user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(days=1)
    )
    db.add(token_entry)
    db.commit()

    logger.info(f"[REGISTER] 登録成功: user_id={db_user.id}, email={db_user.email}")
    logger.info(f"[REGISTER] メール認証URL: http://localhost:3000/verify-email/{token}")

    return db_user

# === メール認証処理 ===
@router.get("/verify-email/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    logger.info(f"[VERIFY] トークン検証開始: {token}")
    token_entry = db.query(EmailVerificationToken).filter_by(token=token).first()

    if not token_entry:
        logger.warning("[VERIFY] トークンが無効です")
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if token_entry.expires_at < datetime.utcnow():
        logger.warning("[VERIFY] トークンが期限切れです")
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(User).filter_by(id=token_entry.user_id).first()
    user.is_email_verified = True
    db.delete(token_entry)
    db.commit()

    logger.info(f"[VERIFY] メール認証成功: user_id={user.id}")
    return {"message": "Email verified successfully"}

# === ログイン + セッション + 履歴 ===
@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    request: Request = None
):
    logger.info(f"[LOGIN] ログイン試行: username={form_data.username}")
    user = authenticate_user(db, form_data.username, form_data.password)

    if not user:
        logger.warning(f"[LOGIN] 認証失敗: username={form_data.username}")
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    # 多重ログイン防止
    deleted_count = db.query(UserSession).filter_by(user_id=user.id).delete()
    logger.info(f"[LOGIN] 既存セッション削除: count={deleted_count}")

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
    logger.info(f"[LOGIN] ログイン成功: user_id={user.id}, token=発行済")

    return {"access_token": access_token, "token_type": "bearer"}