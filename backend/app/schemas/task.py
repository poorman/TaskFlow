"""Task schemas"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models import TaskStatus, TaskPriority


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    project_id: int
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    price: Optional[float] = None
    tags: Optional[List[str]] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    price: Optional[float] = None
    tags: Optional[List[str]] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    box_width: Optional[float] = None
    box_height: Optional[float] = None
    is_archived: Optional[bool] = None  # Temporarily disabled in model until migration


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    project_id: int
    assignee_id: Optional[int]
    created_by_id: int
    due_date: Optional[datetime]
    completed_at: Optional[datetime]
    estimated_hours: Optional[float]
    actual_hours: Optional[float]
    price: Optional[float]
    tags: List[str]
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    box_width: Optional[float] = None
    box_height: Optional[float] = None
    is_archived: bool = False  # Always False until migration adds column to database
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class TaskWithDetails(TaskResponse):
    assignee_name: Optional[str] = None
    creator_name: Optional[str] = None
    project_name: str

