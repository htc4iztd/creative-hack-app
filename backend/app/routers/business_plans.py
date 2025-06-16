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
from app.auth import get_current_active_user, get_current_admin_user
from app.websocket_manager import manager
import json
import asyncio

router = APIRouter()

# Background task to broadcast vote updates
async def broadcast_vote_update(business_plan_id: int, vote_count: int):
    message = json.dumps({
        "type": "vote_update",
        "business_plan_id": business_plan_id,
        "vote_count": vote_count
    })
    await manager.broadcast(f"business_plan_{business_plan_id}", message)

@router.post("/{business_plan_id}/apply", response_model=BusinessPlanResponse, status_code=status.HTTP_200_OK)
async def apply_to_plan(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    ユーザーがビジネスプランに参加希望を送信するエンドポイント。
    ビジネスプランの作成者へ通知を送る。
    """
    business_plan = db.query(BusinessPlan).filter(BusinessPlan.id == business_plan_id).first()
    if not business_plan:
        raise HTTPException(status_code=404, detail="Business plan not found")

    # TODO: 1. ここに、誰がどのプランに参加希望したかのレコードをDBに保存するロジックが入る
    # 例: class Application(Base): ... app_id, user_id, business_plan_id, status など
    # db.add(Application(user_id=current_user.id, business_plan_id=business_plan_id))
    # db.commit()
    # db.refresh(application)

    # 2. 通知レコードをデータベースに保存 (オフラインユーザーへの対応も兼ねる)
    notification_message_text = (
        f"{current_user.full_name}さんがあなたのビジネスプラン「{business_plan.title}」に参加希望しました。"
    )
    notification = Notification(
        user_id=business_plan.creator_id, # 通知を受け取るのはプランの投稿ユーザー
        title="新しい参加希望",
        message=notification_message_text,
        notification_type="application", # 通知の種類を識別しやすいように設定
        related_id=business_plan_id
    )
    db.add(notification)
    db.commit()
    db.refresh(notification) # IDなどが取得できるようにリフレッシュ

    # 3. WebSocket経由でリアルタイム通知を送信 (オンラインユーザーへの対応)
    # クライアント側で通知を表示するために必要なデータを含める
    notification_payload = {
        "type": "new_application_notification", # クライアント側でこの通知を識別するためのタイプ
        "id": notification.id,
        "title": notification.title,
        "message": notification.message,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat(), # datetimeオブジェクトはisoformatで文字列に変換
        "business_plan_id": business_plan.id,
        "applicant_id": current_user.id,
        "applicant_name": current_user.full_name # 応募者の名前
    }

    # manager.send_notification_to_user を呼び出し、プランの投稿ユーザーのIDに対して通知を送る
    await manager.send_notification_to_user(business_plan.creator_id, notification_payload)

    return BusinessPlanResponse(
        id=business_plan.id,
        title=business_plan.title,
        description=business_plan.description,
        # 他の必要なフィールドもここにマッピング
        # BusinessPlanResponseのスキーマに合わせて適切に設定
        # 例: creator_id=business_plan.creator_id, is_selected=business_plan.is_selected, etc.
    )

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
        search_term = f"%{search}%"
        query = query.filter(
            (BusinessPlan.title.ilike(search_term)) |
            (BusinessPlan.description.ilike(search_term))
        )
    
    # Add vote count to each business plan
    business_plans = query.offset(skip).limit(limit).all()
    
    # Add vote count to each business plan
    for plan in business_plans:
        plan.vote_count = db.query(Vote).filter(Vote.business_plan_id == plan.id).count()
    
    return business_plans

@router.get("/{business_plan_id}", response_model=BusinessPlanDetailResponse)
def read_business_plan(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific business plan by ID
    """
    business_plan = db.query(BusinessPlan).filter(BusinessPlan.id == business_plan_id).first()
    if business_plan is None:
        raise HTTPException(status_code=404, detail="Business plan not found")
    
    # Add vote count
    business_plan.vote_count = db.query(Vote).filter(Vote.business_plan_id == business_plan.id).count()
    
    return business_plan

@router.put("/{business_plan_id}", response_model=BusinessPlanResponse)
def update_business_plan(
    business_plan_id: int,
    business_plan_update: BusinessPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a business plan
    """
    db_business_plan = db.query(BusinessPlan).filter(BusinessPlan.id == business_plan_id).first()
    if db_business_plan is None:
        raise HTTPException(status_code=404, detail="Business plan not found")
    
    # Check if user is the creator or an admin
    if db_business_plan.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this business plan")
    
    # Update business plan fields
    for field, value in business_plan_update.dict(exclude_unset=True).items():
        if value is not None:
            setattr(db_business_plan, field, value)
    
    db.commit()
    db.refresh(db_business_plan)
    return db_business_plan

@router.delete("/{business_plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_business_plan(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a business plan
    """
    db_business_plan = db.query(BusinessPlan).filter(BusinessPlan.id == business_plan_id).first()
    if db_business_plan is None:
        raise HTTPException(status_code=404, detail="Business plan not found")
    
    # Check if user is the creator or an admin
    if db_business_plan.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this business plan")
    
    db.delete(db_business_plan)
    db.commit()
    return None

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
    # Check if business plan exists
    business_plan = db.query(BusinessPlan).filter(BusinessPlan.id == business_plan_id).first()
    if business_plan is None:
        raise HTTPException(status_code=404, detail="Business plan not found")
    
    # Check if user has already voted for this business plan
    existing_vote = db.query(Vote).filter(
        Vote.user_id == current_user.id,
        Vote.business_plan_id == business_plan_id
    ).first()
    
    if existing_vote:
        raise HTTPException(status_code=400, detail="You have already voted for this business plan")
    
    # Create new vote
    vote = Vote(
        user_id=current_user.id,
        business_plan_id=business_plan_id
    )
    db.add(vote)
    
    # Create notification for business plan creator
    notification = Notification(
        user_id=business_plan.creator_id,
        title="New Vote",
        message=f"{current_user.full_name} voted for your business plan: {business_plan.title}",
        notification_type="vote",
        related_id=business_plan_id
    )
    db.add(notification)
    
    db.commit()
    db.refresh(vote)
    
    # Get updated vote count
    vote_count = db.query(Vote).filter(Vote.business_plan_id == business_plan_id).count()
    
    # Broadcast vote update to WebSocket clients
    background_tasks.add_task(broadcast_vote_update, business_plan_id, vote_count)
    
    return vote

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
    # Check if business plan exists
    business_plan = db.query(BusinessPlan).filter(BusinessPlan.id == business_plan_id).first()
    if business_plan is None:
        raise HTTPException(status_code=404, detail="Business plan not found")
    
    # Check if user has voted for this business plan
    vote = db.query(Vote).filter(
        Vote.user_id == current_user.id,
        Vote.business_plan_id == business_plan_id
    ).first()
    
    if not vote:
        raise HTTPException(status_code=400, detail="You have not voted for this business plan")
    
    db.delete(vote)
    db.commit()
    
    # Get updated vote count
    vote_count = db.query(Vote).filter(Vote.business_plan_id == business_plan_id).count()
    
    # Broadcast vote update to WebSocket clients
    background_tasks.add_task(broadcast_vote_update, business_plan_id, vote_count)
    
    return None

@router.get("/{business_plan_id}/votes", response_model=List[VoteResponse])
def get_business_plan_votes(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get all votes for a business plan (admin only)
    """
    # Check if business plan exists
    business_plan = db.query(BusinessPlan).filter(BusinessPlan.id == business_plan_id).first()
    if business_plan is None:
        raise HTTPException(status_code=404, detail="Business plan not found")
    
    votes = db.query(Vote).filter(Vote.business_plan_id == business_plan_id).all()
    return votes

@router.get("/{business_plan_id}/user-vote", response_model=bool)
def check_user_vote(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Check if the current user has voted for a specific business plan
    """
    # Check if business plan exists
    business_plan = db.query(BusinessPlan).filter(BusinessPlan.id == business_plan_id).first()
    if business_plan is None:
        raise HTTPException(status_code=404, detail="Business plan not found")
    
    # Check if user has voted
    vote = db.query(Vote).filter(
        Vote.user_id == current_user.id,
        Vote.business_plan_id == business_plan_id
    ).first()
    
    return vote is not None

@router.put("/{business_plan_id}/select", response_model=BusinessPlanResponse)
def select_business_plan(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Select a business plan for the next phase (admin only)
    """
    business_plan = db.query(BusinessPlan).filter(BusinessPlan.id == business_plan_id).first()
    if business_plan is None:
        raise HTTPException(status_code=404, detail="Business plan not found")
    
    business_plan.is_selected = True
    
    # Create notification for business plan creator
    notification = Notification(
        user_id=business_plan.creator_id,
        title="Business Plan Selected",
        message=f"Your business plan '{business_plan.title}' has been selected for the next phase!",
        notification_type="selection",
        related_id=business_plan_id
    )
    db.add(notification)
    
    db.commit()
    db.refresh(business_plan)
    return business_plan

@router.put("/{business_plan_id}/unselect", response_model=BusinessPlanResponse)
def unselect_business_plan(
    business_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Unselect a business plan (admin only)
    """
    business_plan = db.query(BusinessPlan).filter(BusinessPlan.id == business_plan_id).first()
    if business_plan is None:
        raise HTTPException(status_code=404, detail="Business plan not found")
    
    business_plan.is_selected = False
    db.commit()
    db.refresh(business_plan)
    return business_plan

@router.get("/selected/list", response_model=List[BusinessPlanResponse])
def get_selected_business_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all selected business plans
    """
    business_plans = db.query(BusinessPlan).filter(BusinessPlan.is_selected == True).all()
    
    # Add vote count to each business plan
    for plan in business_plans:
        plan.vote_count = db.query(Vote).filter(Vote.business_plan_id == plan.id).count()
    
    return business_plans
