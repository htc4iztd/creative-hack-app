from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models.models import PoCPlan, TeamMember, User, Notification, BusinessPlan
from app.schemas.schemas import (
    PoCPlanCreate, 
    PoCPlanResponse, 
    PoCPlanUpdate, 
    PoCPlanDetailResponse,
    TeamMemberCreate,
    TeamMemberResponse
)
from app.auth_logic import get_current_active_user, get_current_admin_user

router = APIRouter()

@router.post("/", response_model=PoCPlanResponse)
def create_poc_plan(
    poc_plan: PoCPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new PoC plan
    """
    # If business_plan_id is provided, check if it exists and is selected
    if poc_plan.business_plan_id:
        business_plan = db.query(BusinessPlan).filter(BusinessPlan.id == poc_plan.business_plan_id).first()
        if not business_plan:
            raise HTTPException(status_code=404, detail="Business plan not found")
        if not business_plan.is_selected:
            raise HTTPException(status_code=400, detail="Business plan is not selected for PoC phase")
    
    db_poc_plan = PoCPlan(
        **poc_plan.dict(),
        creator_id=current_user.id
    )
    db.add(db_poc_plan)
    db.commit()
    db.refresh(db_poc_plan)
    
    # Automatically add creator as a team member
    team_member = TeamMember(
        user_id=current_user.id,
        poc_plan_id=db_poc_plan.id,
        role="creator"
    )
    db.add(team_member)
    db.commit()
    
    return db_poc_plan

@router.get("/", response_model=List[PoCPlanResponse])
def read_poc_plans(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    technical_only: Optional[bool] = None,
    business_plan_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all PoC plans with optional filters
    """
    query = db.query(PoCPlan)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (PoCPlan.title.ilike(search_term)) |
            (PoCPlan.description.ilike(search_term))
        )
    
    if technical_only is not None:
        query = query.filter(PoCPlan.is_technical_only == technical_only)
    
    if business_plan_id:
        query = query.filter(PoCPlan.business_plan_id == business_plan_id)
    
    poc_plans = query.offset(skip).limit(limit).all()
    
    # Add team member count to each PoC plan
    for plan in poc_plans:
        plan.team_member_count = db.query(TeamMember).filter(TeamMember.poc_plan_id == plan.id).count()
    
    return poc_plans

@router.get("/{poc_plan_id}", response_model=PoCPlanDetailResponse)
def read_poc_plan(
    poc_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific PoC plan by ID
    """
    poc_plan = db.query(PoCPlan).filter(PoCPlan.id == poc_plan_id).first()
    if poc_plan is None:
        raise HTTPException(status_code=404, detail="PoC plan not found")
    
    # Add team member count
    poc_plan.team_member_count = db.query(TeamMember).filter(TeamMember.poc_plan_id == poc_plan.id).count()
    
    return poc_plan

@router.put("/{poc_plan_id}", response_model=PoCPlanResponse)
def update_poc_plan(
    poc_plan_id: int,
    poc_plan_update: PoCPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a PoC plan
    """
    db_poc_plan = db.query(PoCPlan).filter(PoCPlan.id == poc_plan_id).first()
    if db_poc_plan is None:
        raise HTTPException(status_code=404, detail="PoC plan not found")
    
    # Check if user is the creator or an admin
    if db_poc_plan.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this PoC plan")
    
    # If business_plan_id is being updated, check if it exists and is selected
    if poc_plan_update.business_plan_id:
        business_plan = db.query(BusinessPlan).filter(BusinessPlan.id == poc_plan_update.business_plan_id).first()
        if not business_plan:
            raise HTTPException(status_code=404, detail="Business plan not found")
        if not business_plan.is_selected:
            raise HTTPException(status_code=400, detail="Business plan is not selected for PoC phase")
    
    # Update PoC plan fields
    for field, value in poc_plan_update.dict(exclude_unset=True).items():
        if value is not None:
            setattr(db_poc_plan, field, value)
    
    db.commit()
    db.refresh(db_poc_plan)
    return db_poc_plan

@router.delete("/{poc_plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_poc_plan(
    poc_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a PoC plan
    """
    db_poc_plan = db.query(PoCPlan).filter(PoCPlan.id == poc_plan_id).first()
    if db_poc_plan is None:
        raise HTTPException(status_code=404, detail="PoC plan not found")
    
    # Check if user is the creator or an admin
    if db_poc_plan.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this PoC plan")
    
    db.delete(db_poc_plan)
    db.commit()
    return None

@router.post("/{poc_plan_id}/team", response_model=TeamMemberResponse)
def join_poc_team(
    poc_plan_id: int,
    team_member: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Join a PoC team
    """
    # Check if PoC plan exists
    poc_plan = db.query(PoCPlan).filter(PoCPlan.id == poc_plan_id).first()
    if poc_plan is None:
        raise HTTPException(status_code=404, detail="PoC plan not found")
    
    # Check if user is already a team member
    existing_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.poc_plan_id == poc_plan_id
    ).first()
    
    if existing_member:
        raise HTTPException(status_code=400, detail="You are already a member of this team")
    
    # Create new team member
    db_team_member = TeamMember(
        user_id=current_user.id,
        poc_plan_id=poc_plan_id,
        role=team_member.role
    )
    db.add(db_team_member)
    
    # Create notification for PoC plan creator
    notification = Notification(
        user_id=poc_plan.creator_id,
        title="New Team Member",
        message=f"{current_user.full_name} joined your PoC team for: {poc_plan.title}",
        notification_type="team_join",
        related_id=poc_plan_id
    )
    db.add(notification)
    
    db.commit()
    db.refresh(db_team_member)
    return db_team_member

@router.delete("/{poc_plan_id}/team", status_code=status.HTTP_204_NO_CONTENT)
def leave_poc_team(
    poc_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Leave a PoC team
    """
    # Check if PoC plan exists
    poc_plan = db.query(PoCPlan).filter(PoCPlan.id == poc_plan_id).first()
    if poc_plan is None:
        raise HTTPException(status_code=404, detail="PoC plan not found")
    
    # Check if user is a team member
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.poc_plan_id == poc_plan_id
    ).first()
    
    if not team_member:
        raise HTTPException(status_code=400, detail="You are not a member of this team")
    
    # Don't allow the creator to leave
    if team_member.role == "creator":
        raise HTTPException(status_code=400, detail="As the creator, you cannot leave the team")
    
    db.delete(team_member)
    
    # Create notification for PoC plan creator
    if current_user.id != poc_plan.creator_id:
        notification = Notification(
            user_id=poc_plan.creator_id,
            title="Team Member Left",
            message=f"{current_user.full_name} left your PoC team for: {poc_plan.title}",
            notification_type="team_leave",
            related_id=poc_plan_id
        )
        db.add(notification)
    
    db.commit()
    return None

@router.get("/{poc_plan_id}/team", response_model=List[TeamMemberResponse])
def get_poc_team_members(
    poc_plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all team members for a PoC plan
    """
    # Check if PoC plan exists
    poc_plan = db.query(PoCPlan).filter(PoCPlan.id == poc_plan_id).first()
    if poc_plan is None:
        raise HTTPException(status_code=404, detail="PoC plan not found")
    
    team_members = db.query(TeamMember).filter(TeamMember.poc_plan_id == poc_plan_id).all()
    return team_members

@router.delete("/{poc_plan_id}/team/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    poc_plan_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Remove a team member (creator or admin only)
    """
    # Check if PoC plan exists
    poc_plan = db.query(PoCPlan).filter(PoCPlan.id == poc_plan_id).first()
    if poc_plan is None:
        raise HTTPException(status_code=404, detail="PoC plan not found")
    
    # Check if user is the creator or an admin
    if poc_plan.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to remove team members")
    
    # Check if user is a team member
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == user_id,
        TeamMember.poc_plan_id == poc_plan_id
    ).first()
    
    if not team_member:
        raise HTTPException(status_code=404, detail="User is not a member of this team")
    
    # Don't allow removing the creator
    if team_member.role == "creator":
        raise HTTPException(status_code=400, detail="Cannot remove the creator from the team")
    
    db.delete(team_member)
    
    # Create notification for removed user
    notification = Notification(
        user_id=user_id,
        title="Removed from Team",
        message=f"You have been removed from the PoC team for: {poc_plan.title}",
        notification_type="team_remove",
        related_id=poc_plan_id
    )
    db.add(notification)
    
    db.commit()
    return None
