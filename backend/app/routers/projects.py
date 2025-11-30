"""Projects router"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.database import get_db
from app.models import Project, Organization, User
from app.utils.auth import get_current_active_user

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    color: str = "#3B82F6"


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None
    organization_id: int
    owner_id: int
    is_active: bool
    color: str
    
    class Config:
        from_attributes = True


@router.post("", response_model=ProjectResponse)
def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new project"""
    # Check organization limits
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    project_count = db.query(Project).filter(Project.organization_id == current_user.organization_id).count()
    if project_count >= org.max_projects:
        raise HTTPException(
            status_code=403,
            detail=f"Project limit reached ({org.max_projects} projects)"
        )
    
    project = Project(
        **project_data.model_dump(),
        organization_id=current_user.organization_id,
        owner_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return project


@router.get("", response_model=List[ProjectResponse])
def get_projects(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all projects for organization"""
    projects = db.query(Project).filter(
        Project.organization_id == current_user.organization_id,
        Project.is_active == True
    ).all()
    
    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == current_user.organization_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a project"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == current_user.organization_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    
    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a project (soft delete by setting is_active to False)"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == current_user.organization_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Soft delete by setting is_active to False
    project.is_active = False
    db.commit()
    
    return {"message": "Project deleted successfully"}

