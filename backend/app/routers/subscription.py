"""Subscription router - SaaS subscription management"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Organization, User
from app.utils.auth import get_current_active_user

router = APIRouter()


class SubscriptionResponse(BaseModel):
    tier: str
    status: str
    max_users: int
    max_projects: int
    max_tasks_per_project: int
    current_users: int
    current_projects: int


@router.get("", response_model=SubscriptionResponse)
def get_subscription(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get organization subscription details"""
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Get current usage
    current_users = db.query(User).filter(User.organization_id == org.id).count()
    from app.models import Project
    current_projects = db.query(Project).filter(Project.organization_id == org.id).count()
    
    return SubscriptionResponse(
        tier=org.subscription_tier.value,
        status=org.subscription_status,
        max_users=org.max_users,
        max_projects=org.max_projects,
        max_tasks_per_project=org.max_tasks_per_project,
        current_users=current_users,
        current_projects=current_projects
    )

