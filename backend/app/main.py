from fastapi import FastAPI
# 各ルーターファイルをインポート
# プロジェクトの構造によって 'app.routers.auth' のようにパスを調整してください
from .routers import business_plans, auth, notifications, poc_plans 
from app.websocket_manager import manager

# Create the FastAPI app
app = FastAPI(
    title="Creative.hack Platform",
    description="Platform for KDDI's in-house ideathon and technical contest",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Creative.hack Platform API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Business Plans ルーターのインクルード（既存）
app.include_router(
    business_plans.router,
    prefix="/plans",
    tags=["Business Plan"]
)

# Auth ルーターのインクルード
# ログイン・登録のエンドポイント
app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

# Notifications ルーターのインクルード
app.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["Notifications"]
)

# PoC Plans ルーターのインクルード
app.include_router(
    poc_plans.router,
    prefix="/poc-plans",
    tags=["PoC Plan"]
)

# Users ルーターのインクルード
app.include_router(
    users.router,
    prefix="/users",
    tags=["Users"]
)

# WebSocket エンドポイント
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, current_user: User = Depends(get_current_active_user)):
    user_id = current_user.id # 認証されたユーザーのID
    await manager.connect(websocket, user_id) # user_id で接続を管理
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received message from user {user_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)