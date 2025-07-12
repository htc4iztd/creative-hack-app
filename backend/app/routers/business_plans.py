# app/routers/business_plans.py

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models.models import BusinessPlan, Vote, User, Notification
from app.schemas.schemas import (
    BusinessPlanCreate,
    BusinessPlanResponse,
    BusinessPlanUpdate,
    BusinessPlanDetailResponse,
    VoteCreate,
    VoteResponse
)
from app.auth_logic import get_current_active_user, get_current_admin_user
from app.websocket_manager import manager
import json
import asyncio

router = APIRouter()

# -----------------------------------------------------------------------------
# Background task to broadcast vote updates
# -----------------------------------------------------------------------------
async def broadcast_vote_update(business_plan_id: int, vote_count: int):
    """
    投票数が更新されたときに、WebSocket クライアントへ通知を行う
    """
    message = json.dumps({
        "type": "vote_update",
        "business_plan_id": business_plan_id,
        "vote_count": vote_count
    })
    # ConnectionManager.broadcast は message だけを受け取る想定
    await manager.broadcast(message)


# -----------------------------------------------------------------------------
# 参加希望エンドポイント（ダミー）
# -----------------------------------------------------------------------------
@router.post(
    "/business_plans/{business_plan_id}/apply",
    response_model=BusinessPlanResponse
)
async def apply_to_plan(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    ユーザーがビジネスプランに参加希望を送信するエンドポイント
    （実際の保存ロジックは未実装）
    """
    business_plan = (
        db.query(BusinessPlan)
        .filter(BusinessPlan.id == business_plan_id)
        .first()
    )
    if not business_plan:
        raise HTTPException(status_code=404, detail="Business plan not found")

    # オフライン用通知保存
    notification = Notification(
        user_id=business_plan.creator_id,
        title="新しい参加希望",
        message=(
            f"{current_user.full_name}さんがあなたのビジネスプラン「"
            f"{business_plan.title}」に参加を希望しました。"
        ),
        notification_type="application_request",
        related_id=business_plan.id
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    # リアルタイム通知
    payload = {
        "type": "new_notification",
        "notification_data": {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "is_read": notification.is_read,
            "created_at": notification.created_at.isoformat(),
            "notification_type": notification.notification_type,
            "related_id": notification.related_id,
            "applicant_id": current_user.id,
            "applicant_name": current_user.full_name
        }
    }
    await manager.send_notification_to_user(business_plan.creator_id, payload)

    return {"message": "参加希望を送信しました。"}


# -----------------------------------------------------------------------------
# ビジネスプラン作成
# -----------------------------------------------------------------------------
@router.post("/", response_model=BusinessPlanResponse)
def create_business_plan(
    business_plan: BusinessPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new business plan
    """
    db_business_plan = BusinessPlan(
        **business_plan.dict(),
        creator_id=current_user.id
    )
    db.add(db_business_plan)
    db.commit()
    db.refresh(db_business_plan)
    return db_business_plan


# -----------------------------------------------------------------------------
# ビジネスプラン一覧取得
# -----------------------------------------------------------------------------
@router.get("/", response_model=List[BusinessPlanResponse])
def read_business_plans(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all business plans with optional search
    """
    query = db.query(BusinessPlan)

    if search:
        term = f"%{search}%"
        query = query.filter(
            (BusinessPlan.title.ilike(term)) |
            (BusinessPlan.description.ilike(term))
        )

    plans = query.offset(skip).limit(limit).all()

    # 各プランに投票数を設定
    for plan in plans:
        plan.vote_count = (
            db.query(Vote)
            .filter(Vote.business_plan_id == plan.id)
            .count()
        )

    return plans


# -----------------------------------------------------------------------------
# ビジネスプラン詳細取得
# -----------------------------------------------------------------------------
@router.get("/{business_plan_id}", response_model=BusinessPlanDetailResponse)
def read_business_plan(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific business plan by ID
    """
    business_plan = (
        db.query(BusinessPlan)
        .filter(BusinessPlan.id == business_plan_id)
        .first()
    )
    if not business_plan:
        raise HTTPException(status_code=404, detail="Business plan not found")

    business_plan.vote_count = (
        db.query(Vote)
        .filter(Vote.business_plan_id == business_plan.id)
        .count()
    )

    return business_plan


# -----------------------------------------------------------------------------
# ビジネスプラン更新
# -----------------------------------------------------------------------------
@router.put("/{business_plan_id}", response_model=BusinessPlanResponse)
def update_business_plan(
    business_plan_id: int,
    update: BusinessPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a business plan
    """
    db_plan = (
        db.query(BusinessPlan)
        .filter(BusinessPlan.id == business_plan_id)
        .first()
    )
    if not db_plan:
        raise HTTPException(status_code=404, detail="Business plan not found")

    if db_plan.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update")

    for field, value in update.dict(exclude_unset=True).items():
        setattr(db_plan, field, value)

    db.commit()
    db.refresh(db_plan)
    return db_plan


# -----------------------------------------------------------------------------
# ビジネスプラン削除
# -----------------------------------------------------------------------------
@router.delete("/{business_plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_business_plan(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a business plan
    """
    db_plan = (
        db.query(BusinessPlan)
        .filter(BusinessPlan.id == business_plan_id)
        .first()
    )
    if not db_plan:
        raise HTTPException(status_code=404, detail="Business plan not found")

    if db_plan.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete")

    db.delete(db_plan)
    db.commit()
    return None


# -----------------------------------------------------------------------------
# 投票エンドポイント
# -----------------------------------------------------------------------------
@router.post("/{business_plan_id}/vote", response_model=VoteResponse)
def vote_for_business_plan(
    business_plan_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Vote for a business plan
    """
    plan = (
        db.query(BusinessPlan)
        .filter(BusinessPlan.id == business_plan_id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Business plan not found")

    existing = (
        db.query(Vote)
        .filter(
            Vote.user_id == current_user.id,
            Vote.business_plan_id == business_plan_id
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already voted")

    vote = Vote(user_id=current_user.id, business_plan_id=business_plan_id)
    db.add(vote)

    notification = Notification(
        user_id=plan.creator_id,
        title="New Vote",
        message=f"{current_user.full_name} voted for your business plan: {plan.title}",
        notification_type="vote",
        related_id=business_plan_id
    )
    db.add(notification)

    db.commit()
    db.refresh(vote)

    new_count = (
        db.query(Vote)
        .filter(Vote.business_plan_id == business_plan_id)
        .count()
    )
    background_tasks.add_task(broadcast_vote_update, business_plan_id, new_count)

    return vote


# -----------------------------------------------------------------------------
# 投票取消エンドポイント
# -----------------------------------------------------------------------------
@router.delete("/{business_plan_id}/vote", status_code=status.HTTP_204_NO_CONTENT)
def remove_vote_from_business_plan(
    business_plan_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Remove vote from a business plan
    """
    plan = (
        db.query(BusinessPlan)
        .filter(BusinessPlan.id == business_plan_id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Business plan not found")

    vote = (
        db.query(Vote)
        .filter(
            Vote.user_id == current_user.id,
            Vote.business_plan_id == business_plan_id
        )
        .first()
    )
    if not vote:
        raise HTTPException(status_code=400, detail="You have not voted")

    db.delete(vote)
    db.commit()

    new_count = (
        db.query(Vote)
        .filter(Vote.business_plan_id == business_plan_id)
        .count()
    )
    background_tasks.add_task(broadcast_vote_update, business_plan_id, new_count)

    return None


# -----------------------------------------------------------------------------
# 管理者用：特定プランの全投票取得
# -----------------------------------------------------------------------------
@router.get("/{business_plan_id}/votes", response_model=List[VoteResponse])
def get_business_plan_votes(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get all votes for a business plan (admin only)
    """
    plan = (
        db.query(BusinessPlan)
        .filter(BusinessPlan.id == business_plan_id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Business plan not found")
    return (
        db.query(Vote)
        .filter(Vote.business_plan_id == business_plan_id)
        .all()
    )


# -----------------------------------------------------------------------------
# 投票済プラン判定エンドポイント
# -----------------------------------------------------------------------------
@router.get("/{business_plan_id}/user-vote", response_model=bool)
def check_user_vote(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Check if the current user has voted for a specific business plan
    """
    plan = (
        db.query(BusinessPlan)
        .filter(BusinessPlan.id == business_plan_id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Business plan not found")
    vote = (
        db.query(Vote)
        .filter(
            Vote.user_id == current_user.id,
            Vote.business_plan_id == business_plan_id
        )
        .first()
    )
    return vote is not None


# -----------------------------------------------------------------------------
# 管理者用：プラン選定
# -----------------------------------------------------------------------------
@router.put("/{business_plan_id}/select", response_model=BusinessPlanResponse)
def select_business_plan(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Select a business plan for the next phase (admin only)
    """
    plan = (
        db.query(BusinessPlan)
        .filter(BusinessPlan.id == business_plan_id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Business plan not found")
    plan.is_selected = True

    notification = Notification(
        user_id=plan.creator_id,
        title="Business Plan Selected",
        message=f"Your business plan '{plan.title}' has been selected for the next phase!",
        notification_type="selection",
        related_id=business_plan_id
    )
    db.add(notification)

    db.commit()
    db.refresh(plan)
    return plan


# -----------------------------------------------------------------------------
# 管理者用：プラン選定解除
# -----------------------------------------------------------------------------
@router.put("/{business_plan_id}/unselect", response_model=BusinessPlanResponse)
def unselect_business_plan(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Unselect a business plan (admin only)
    """
    plan = (
        db.query(BusinessPlan)
        .filter(BusinessPlan.id == business_plan_id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Business plan not found")
    plan.is_selected = False
    db.commit()
    db.refresh(plan)
    return plan


# -----------------------------------------------------------------------------
# 選定済プラン一覧
# -----------------------------------------------------------------------------
@router.get("/selected/list", response_model=List[BusinessPlanResponse])
def get_selected_business_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all selected business plans
    """
    plans = (
        db.query(BusinessPlan)
        .filter(BusinessPlan.is_selected == True)
        .all()
    )
    for plan in plans:
        plan.vote_count = (
            db.query(Vote)
            .filter(Vote.business_plan_id == plan.id)
            .count()
        )
    return plans