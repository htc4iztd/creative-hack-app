from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, Request
from .routers import business_plans, notifications, poc_plans, users
from app.websocket_manager import manager
from app.auth import router as auth_router
from app.auth_logic import get_current_active_user, get_current_admin_user
from app.models.models import User
import logging

# === ロギング設定 ===
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# === FastAPI アプリケーション作成 ===
app = FastAPI(
    title="Creative.hack Platform",
    description="Platform for KDDI's in-house ideathon and technical contest",
    version="1.0.0"
)

@app.get("/")
def read_root():
    logger.debug("GET / called")
    return {"message": "Welcome to Creative.hack Platform API"}

@app.get("/health")
def health_check():
    logger.debug("GET /health called")
    return {"status": "healthy"}

# === 各ルーターをインクルード ===
logger.debug("Including routers")
app.include_router(business_plans, prefix="/business_plans", tags=["Business Plan"])
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(notifications, prefix="/notifications", tags=["Notifications"])
app.include_router(poc_plans, prefix="/poc-plans", tags=["PoC Plan"])
app.include_router(users, prefix="/users", tags=["Users"])

# === WebSocket エンドポイント ===
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, current_user: User = Depends(get_current_active_user)):
    user_id = current_user.id
    logger.debug(f"WebSocket connection start: user_id={user_id}")
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            logger.debug(f"WebSocket message from user {user_id}: {data}")
    except WebSocketDisconnect:
        logger.debug(f"WebSocket disconnected: user_id={user_id}")
        manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)
