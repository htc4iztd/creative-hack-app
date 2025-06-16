from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, Table, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

# User role enum
class UserRole(enum.Enum):
    USER = "user"
    ADMIN = "admin"

# User model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    department = Column(String)
    division = Column(String)
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    business_plans = relationship("BusinessPlan", back_populates="creator")
    poc_plans = relationship("PoCPlan", back_populates="creator")
    votes = relationship("Vote", back_populates="user")
    team_memberships = relationship("TeamMember", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

# Business Plan model
class BusinessPlan(Base):
    __tablename__ = "business_plans"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    problem_statement = Column(Text)
    solution = Column(Text)
    target_market = Column(Text)
    business_model = Column(Text)
    competition = Column(Text)
    implementation_plan = Column(Text)
    creator_id = Column(Integer, ForeignKey("users.id"))
    is_selected = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="business_plans")
    votes = relationship("Vote", back_populates="business_plan")
    poc_plans = relationship("PoCPlan", back_populates="business_plan")

# Vote model
class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    business_plan_id = Column(Integer, ForeignKey("business_plans.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="votes")
    business_plan = relationship("BusinessPlan", back_populates="votes")

# PoC Plan model
class PoCPlan(Base):
    __tablename__ = "poc_plans"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    technical_requirements = Column(Text)
    implementation_details = Column(Text)
    timeline = Column(Text)
    resources_needed = Column(Text)
    expected_outcomes = Column(Text)
    creator_id = Column(Integer, ForeignKey("users.id"))
    business_plan_id = Column(Integer, ForeignKey("business_plans.id"), nullable=True)
    is_technical_only = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="poc_plans")
    business_plan = relationship("BusinessPlan", back_populates="poc_plans")
    team_members = relationship("TeamMember", back_populates="poc_plan")

# Team Member model
class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    poc_plan_id = Column(Integer, ForeignKey("poc_plans.id"))
    role = Column(String)  # e.g., "technical", "support"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="team_memberships")
    poc_plan = relationship("PoCPlan", back_populates="team_members")

# Notification model
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    notification_type = Column(String)  # e.g., "vote", "team_join", "selection"
    related_id = Column(Integer)  # ID of related entity (business plan, poc plan, etc.)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")
