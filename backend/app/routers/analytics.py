"""Analytics router - demonstrates data pipeline and analytics capabilities"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel
from app.database import get_db
from app.models import Task, Project, Organization, User, AnalyticsEvent, TaskStatus
from app.utils.auth import get_current_active_user

router = APIRouter()


class AnalyticsResponse(BaseModel):
    total_tasks: int
    tasks_by_status: Dict[str, int]
    tasks_by_priority: Dict[str, int]
    tasks_completed_today: int
    tasks_completed_this_week: int
    average_completion_time_hours: float | None
    tasks_overdue: int
    productivity_score: float
    top_contributors: List[Dict[str, Any]]
    total_price: float
    price_by_status: Dict[str, float]
    price_by_priority: Dict[str, float]


class TimeSeriesData(BaseModel):
    date: str
    tasks_created: int
    tasks_completed: int


@router.get("/dashboard", response_model=AnalyticsResponse)
def get_dashboard_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=365)
):
    """Get dashboard analytics - demonstrates data aggregation and pipeline capabilities"""
    org_id = current_user.organization_id
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total tasks
    total_tasks = db.query(Task).join(Project).filter(
        Project.organization_id == org_id
    ).count()
    
    # Tasks by status
    tasks_by_status = db.query(
        Task.status,
        func.count(Task.id).label('count')
    ).join(Project).filter(
        Project.organization_id == org_id
    ).group_by(Task.status).all()
    
    status_dict = {status.value: 0 for status in TaskStatus}
    for status, count in tasks_by_status:
        status_dict[status.value] = count
    
    # Tasks by priority
    tasks_by_priority = db.query(
        Task.priority,
        func.count(Task.id).label('count')
    ).join(Project).filter(
        Project.organization_id == org_id
    ).group_by(Task.priority).all()
    
    priority_dict = {}
    for priority, count in tasks_by_priority:
        priority_dict[priority.value] = count
    
    # Tasks completed today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    tasks_completed_today = db.query(Task).join(Project).filter(
        Project.organization_id == org_id,
        Task.status == TaskStatus.DONE,
        Task.completed_at >= today_start
    ).count()
    
    # Tasks completed this week
    week_start = today_start - timedelta(days=today_start.weekday())
    tasks_completed_this_week = db.query(Task).join(Project).filter(
        Project.organization_id == org_id,
        Task.status == TaskStatus.DONE,
        Task.completed_at >= week_start
    ).count()
    
    # Average completion time
    completed_tasks = db.query(Task).join(Project).filter(
        Project.organization_id == org_id,
        Task.status == TaskStatus.DONE,
        Task.completed_at.isnot(None),
        Task.created_at >= start_date
    ).all()
    
    completion_times = []
    for task in completed_tasks:
        if task.completed_at:
            delta = task.completed_at - task.created_at
            completion_times.append(delta.total_seconds() / 3600)  # Hours
    
    avg_completion_time = sum(completion_times) / len(completion_times) if completion_times else None
    
    # Overdue tasks
    now = datetime.utcnow()
    tasks_overdue = db.query(Task).join(Project).filter(
        Project.organization_id == org_id,
        Task.due_date.isnot(None),
        Task.due_date < now,
        Task.status != TaskStatus.DONE
    ).count()
    
    # Productivity score (0-100)
    if total_tasks > 0:
        completed = status_dict.get('done', 0)
        productivity_score = (completed / total_tasks) * 100
    else:
        productivity_score = 0.0
    
    # Top contributors
    top_contributors = db.query(
        User.id,
        User.full_name,
        User.email,
        func.count(Task.id).label('task_count')
    ).join(Task, User.id == Task.assignee_id).join(
        Project, Task.project_id == Project.id
    ).filter(
        Project.organization_id == org_id,
        Task.created_at >= start_date
    ).group_by(User.id, User.full_name, User.email).order_by(
        func.count(Task.id).desc()
    ).limit(10).all()
    
    contributors = [
        {
            "user_id": u.id,
            "name": u.full_name or u.email,
            "email": u.email,
            "tasks_completed": u.task_count
        }
        for u in top_contributors
    ]
    
    # Price aggregations
    # Total price
    total_price_result = db.query(func.sum(Task.price)).join(Project).filter(
        Project.organization_id == org_id,
        Task.price.isnot(None)
    ).scalar()
    total_price = float(total_price_result) if total_price_result else 0.0
    
    # Price by status
    price_by_status_query = db.query(
        Task.status,
        func.sum(Task.price).label('total_price')
    ).join(Project).filter(
        Project.organization_id == org_id,
        Task.price.isnot(None)
    ).group_by(Task.status).all()
    
    price_by_status = {status.value: 0.0 for status in TaskStatus}
    for status, price_sum in price_by_status_query:
        price_by_status[status.value] = float(price_sum) if price_sum else 0.0
    
    # Price by priority
    price_by_priority_query = db.query(
        Task.priority,
        func.sum(Task.price).label('total_price')
    ).join(Project).filter(
        Project.organization_id == org_id,
        Task.price.isnot(None)
    ).group_by(Task.priority).all()
    
    price_by_priority = {}
    for priority, price_sum in price_by_priority_query:
        price_by_priority[priority.value] = float(price_sum) if price_sum else 0.0
    
    return AnalyticsResponse(
        total_tasks=total_tasks,
        tasks_by_status=status_dict,
        tasks_by_priority=priority_dict,
        tasks_completed_today=tasks_completed_today,
        tasks_completed_this_week=tasks_completed_this_week,
        average_completion_time_hours=avg_completion_time,
        tasks_overdue=tasks_overdue,
        productivity_score=round(productivity_score, 2),
        top_contributors=contributors,
        total_price=round(total_price, 2),
        price_by_status=price_by_status,
        price_by_priority=price_by_priority
    )


@router.get("/timeseries", response_model=List[TimeSeriesData])
def get_timeseries_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=365)
):
    """Get time series analytics - demonstrates data pipeline for time-series analysis"""
    org_id = current_user.organization_id
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get daily task creation and completion counts
    created_by_date = db.query(
        func.date(Task.created_at).label('date'),
        func.count(Task.id).label('count')
    ).join(Project).filter(
        Project.organization_id == org_id,
        Task.created_at >= start_date
    ).group_by(func.date(Task.created_at)).all()
    
    completed_by_date = db.query(
        func.date(Task.completed_at).label('date'),
        func.count(Task.id).label('count')
    ).join(Project).filter(
        Project.organization_id == org_id,
        Task.status == TaskStatus.DONE,
        Task.completed_at >= start_date,
        Task.completed_at.isnot(None)
    ).group_by(func.date(Task.completed_at)).all()
    
    # Create date range
    date_range = {}
    for i in range(days):
        date = (datetime.utcnow() - timedelta(days=i)).date()
        date_range[date] = {"created": 0, "completed": 0}
    
    # Fill in data
    for date, count in created_by_date:
        if date in date_range:
            date_range[date]["created"] = count
    
    for date, count in completed_by_date:
        if date in date_range:
            date_range[date]["completed"] = count
    
    # Convert to response format
    result = [
        TimeSeriesData(
            date=str(date),
            tasks_created=data["created"],
            tasks_completed=data["completed"]
        )
        for date, data in sorted(date_range.items())
    ]
    
    return result

