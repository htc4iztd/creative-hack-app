from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Union
from datetime import datetime
from enum import Enum
from app.models.models import UserRole

# User role enum
class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

# Base schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    department: str

class BusinessPlanBase(BaseModel):
    title: str
    description: str
    problem_statement: str
    solution: str
    target_market: str
    business_model: str
    competition: str
    implementation_plan: str

class PoCPlanBase(BaseModel):
    title: str
    description: str
    technical_requirements: str
    implementation_details: str
    timeline: str
    resources_needed: str
    expected_outcomes: str
    business_plan_id: Optional[int] = None
    is_technical_only: bool = False

class VoteBase(BaseModel):
    business_plan_id: int

class TeamMemberBase(BaseModel):
    poc_plan_id: int
    role: str = "technical"  # Default role is technical

class NotificationBase(BaseModel):
    title: str
    message: str
    notification_type: str
    related_id: Optional[int] = None

# Create schemas
class UserCreate(UserBase):
    password: str
    role: UserRole

class BusinessPlanCreate(BusinessPlanBase):
    pass

class PoCPlanCreate(PoCPlanBase):
    pass

class VoteCreate(VoteBase):
    pass

class TeamMemberCreate(TeamMemberBase):
    pass

class NotificationCreate(NotificationBase):
    user_id: int

# Update schemas
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    department: Optional[str] = None
    division: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class BusinessPlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    problem_statement: Optional[str] = None
    solution: Optional[str] = None
    target_market: Optional[str] = None
    business_model: Optional[str] = None
    competition: Optional[str] = None
    implementation_plan: Optional[str] = None
    is_selected: Optional[bool] = None

class PoCPlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    technical_requirements: Optional[str] = None
    implementation_details: Optional[str] = None
    timeline: Optional[str] = None
    resources_needed: Optional[str] = None
    expected_outcomes: Optional[str] = None
    business_plan_id: Optional[int] = None
    is_technical_only: Optional[bool] = None

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

# Response schemas
class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BusinessPlanResponse(BusinessPlanBase):
    id: int
    creator_id: int
    is_selected: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    vote_count: Optional[int] = None

    class Config:
        from_attributes = True

class PoCPlanResponse(PoCPlanBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    team_member_count: Optional[int] = None

    class Config:
        from_attributes = True

class VoteResponse(VoteBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TeamMemberResponse(TeamMemberBase):
    id: int
    user_id: int
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Detailed response schemas with relationships
class BusinessPlanDetailResponse(BusinessPlanResponse):
    creator: UserResponse
    votes: List[VoteResponse] = []
    poc_plans: List[PoCPlanResponse] = []

    class Config:
        from_attributes = True

class PoCPlanDetailResponse(PoCPlanResponse):
    creator: UserResponse
    business_plan: Optional[BusinessPlanResponse] = None
    team_members: List[TeamMemberResponse] = []

    class Config:
        from_attributes = True

class UserDetailResponse(UserResponse):
    business_plans: List[BusinessPlanResponse] = []
    poc_plans: List[PoCPlanResponse] = []
    votes: List[VoteResponse] = []
    team_memberships: List[TeamMemberResponse] = []
    notifications: List[NotificationResponse] = []

    class Config:
        from_attributes = True

# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[UserRole] = None
