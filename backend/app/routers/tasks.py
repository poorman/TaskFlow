"""Tasks router"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import Task, Project, User, Organization, TaskActivityLog, TaskStatus
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskWithDetails
from app.utils.auth import get_current_active_user
from app.services.activity_logger import log_task_activity

router = APIRouter()


def safe_get_is_archived(task: Task) -> bool:
    """Safely get is_archived value, returning False if column doesn't exist"""
    try:
        return getattr(task, 'is_archived', False)
    except Exception:
        return False


def check_organization_access(user: User, project_id: int, db: Session) -> Project:
    """Verify user has access to project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.organization_id != user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return project


@router.post("", response_model=TaskResponse)
def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new task"""
    # Verify project access
    project = check_organization_access(current_user, task_data.project_id, db)
    
    # Check organization limits (if org exists and has limits set)
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if org and org.max_tasks_per_project is not None:
        task_count = db.query(Task).join(Project).filter(Project.id == task_data.project_id).count()
        if task_count >= org.max_tasks_per_project:
            raise HTTPException(
                status_code=403,
                detail=f"Task limit reached ({org.max_tasks_per_project} tasks per project)"
            )
    
    # Prepare task data, ensuring tags is a list
    task_dict = task_data.model_dump(exclude={"project_id"})
    if task_dict.get("tags") is None:
        task_dict["tags"] = []
    
    # Ensure due_date is properly handled (can be None)
    if "due_date" in task_dict and task_dict["due_date"] is None:
        del task_dict["due_date"]
    
    try:
        task = Task(
            **task_dict,
            project_id=task_data.project_id,
            created_by_id=current_user.id
        )
        db.add(task)
        db.commit()
        db.refresh(task)
    except Exception as e:
        db.rollback()
        import logging
        import traceback
        error_msg = f"Failed to create task: {str(e)}\n{traceback.format_exc()}"
        logging.error(error_msg)
        print(error_msg)  # Also print to stdout for docker logs
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create task: {str(e)}"
        )
    
    # Log activity (in a separate transaction to avoid blocking)
    try:
        log_task_activity(db, task.id, current_user.id, "created", None, task_data.model_dump())
    except Exception as e:
        # Log error but don't fail task creation
        import logging
        logging.error(f"Failed to log task activity: {e}")
    
    # Build TaskResponse - Access all attributes while session is still active
    # Convert SQLAlchemy Numeric types to float for JSON serialization
    import logging
    import traceback
    
    # Helper function to safely convert Numeric to float
    def safe_float(value):
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None
    
    try:
        # Access all task attributes while the session is active
        # This ensures we don't have lazy loading issues
        task_response = {
            "id": int(task.id),
            "title": str(task.title),
            "description": task.description if task.description else None,
            "status": task.status,
            "priority": task.priority,
            "project_id": int(task.project_id),
            "assignee_id": int(task.assignee_id) if task.assignee_id else None,
            "created_by_id": int(task.created_by_id),
            "due_date": task.due_date,
            "completed_at": task.completed_at,
            "estimated_hours": safe_float(task.estimated_hours),
            "actual_hours": safe_float(task.actual_hours),
            "price": safe_float(task.price),
            "tags": list(task.tags) if task.tags else [],
            "position_x": safe_float(task.position_x),
            "position_y": safe_float(task.position_y),
            "box_width": safe_float(task.box_width),
            "box_height": safe_float(task.box_height),
            "is_archived": safe_get_is_archived(task),
            "created_at": task.created_at,
            "updated_at": task.updated_at,
        }
        response_obj = TaskResponse(**task_response)
        return response_obj
    except Exception as e:
        error_msg = f"Failed to build task response: {str(e)}\n{traceback.format_exc()}"
        logging.error(error_msg)
        print(error_msg)  # Also print to stdout for docker logs
        
        # Fallback: Try to use model_validate (from_attributes is set in Config)
        try:
            # In Pydantic v2, model_validate uses from_attributes from Config class
            response_obj = TaskResponse.model_validate(task)
            return response_obj
        except Exception as validate_error:
            validate_error_msg = f"model_validate also failed: {str(validate_error)}\n{traceback.format_exc()}"
            logging.error(validate_error_msg)
            print(validate_error_msg)
            # Last resort: Create a minimal response with essential fields
            # The task was created successfully, so we must return a valid response
            try:
                return TaskResponse(
                    id=int(task.id),
                    title=str(task.title),
                    description=task.description if task.description else None,
                    status=task.status,
                    priority=task.priority,
                    project_id=int(task.project_id),
                    assignee_id=int(task.assignee_id) if task.assignee_id else None,
                    created_by_id=int(task.created_by_id),
                    due_date=task.due_date,
                    completed_at=task.completed_at,
                    estimated_hours=safe_float(task.estimated_hours),
                    actual_hours=safe_float(task.actual_hours),
                    price=safe_float(task.price),
                    tags=list(task.tags) if task.tags else [],
                    position_x=safe_float(task.position_x),
                    position_y=safe_float(task.position_y),
                    box_width=safe_float(task.box_width),
                    box_height=safe_float(task.box_height),
                    is_archived=safe_get_is_archived(task),
                    created_at=task.created_at,
                    updated_at=task.updated_at,
                )
            except Exception as final_error:
                # If even minimal response fails, log and raise - this is unexpected
                final_error_msg = f"Complete failure in response building: {str(final_error)}\n{traceback.format_exc()}"
                logging.error(final_error_msg)
                print(final_error_msg)
                # Task was created, but we can't build a response - this is a critical error
                # Return a basic response with minimal fields
                return TaskResponse(
                    id=int(task.id),
                    title=str(task.title),
                    description=None,
                    status=task.status,
                    priority=task.priority,
                    project_id=int(task.project_id),
                    assignee_id=None,
                    created_by_id=int(task.created_by_id),
                    due_date=None,
                    completed_at=None,
                    estimated_hours=None,
                    actual_hours=None,
                    price=None,
                    tags=[],
                    position_x=None,
                    position_y=None,
                    box_width=None,
                    box_height=None,
                    is_archived=safe_get_is_archived(task),
                    created_at=task.created_at,
                    updated_at=None,
                )


@router.get("", response_model=List[TaskWithDetails])
def get_tasks(
    project_id: Optional[int] = Query(None),
    status: Optional[TaskStatus] = Query(None),
    assignee_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """Get tasks with filtering (excludes archived tasks)"""
    query = db.query(Task).join(Project).filter(
        Project.organization_id == current_user.organization_id,
        Task.is_archived == False  # Filter out archived tasks
    )
    
    if project_id:
        query = query.filter(Task.project_id == project_id)
    
    if status:
        query = query.filter(Task.status == status)
    
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)
    
    tasks = query.offset(skip).limit(limit).all()
    
    # Enrich with details
    result = []
    for task in tasks:
        # Build the response data manually
        task_dict = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "project_id": task.project_id,
            "assignee_id": task.assignee_id,
            "created_by_id": task.created_by_id,
            "due_date": task.due_date,
            "completed_at": task.completed_at,
            "estimated_hours": float(task.estimated_hours) if task.estimated_hours else None,
            "actual_hours": float(task.actual_hours) if task.actual_hours else None,
            "price": float(task.price) if task.price else None,
            "tags": task.tags if task.tags else [],
            "position_x": float(task.position_x) if task.position_x else None,
            "position_y": float(task.position_y) if task.position_y else None,
            "box_width": float(task.box_width) if task.box_width else None,
            "box_height": float(task.box_height) if task.box_height else None,
            "is_archived": safe_get_is_archived(task),
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "assignee_name": task.assignee.full_name or task.assignee.email if task.assignee else None,
            "creator_name": task.creator.full_name or task.creator.email if task.creator else None,
            "project_name": task.project.name if task.project else "",
        }
        result.append(TaskWithDetails(**task_dict))
    
    return result


@router.get("/{task_id}", response_model=TaskWithDetails)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific task (can retrieve archived tasks by ID)"""
    task = db.query(Task).join(Project).filter(
        Task.id == task_id,
        Project.organization_id == current_user.organization_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Build the response data manually
    task_dict = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "project_id": task.project_id,
        "assignee_id": task.assignee_id,
        "created_by_id": task.created_by_id,
        "due_date": task.due_date,
        "completed_at": task.completed_at,
        "estimated_hours": float(task.estimated_hours) if task.estimated_hours else None,
        "actual_hours": float(task.actual_hours) if task.actual_hours else None,
        "tags": task.tags if task.tags else [],
        "position_x": float(task.position_x) if task.position_x else None,
        "position_y": float(task.position_y) if task.position_y else None,
        "box_width": float(task.box_width) if task.box_width else None,
        "box_height": float(task.box_height) if task.box_height else None,
        "is_archived": task.is_archived if hasattr(task, 'is_archived') else False,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "assignee_name": task.assignee.full_name or task.assignee.email if task.assignee else None,
        "creator_name": task.creator.full_name or task.creator.email if task.creator else None,
        "project_name": task.project.name if task.project else "",
    }
    
    return TaskWithDetails(**task_dict)


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a task"""
    task = db.query(Task).join(Project).filter(
        Task.id == task_id,
        Project.organization_id == current_user.organization_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    old_data = {
        "status": task.status,
        "assignee_id": task.assignee_id,
        "priority": task.priority
    }
    
    update_data = task_update.model_dump(exclude_unset=True)
    
    # Handle status change
    if "status" in update_data:
        new_status = update_data["status"]
        # Convert string status to TaskStatus enum if needed
        if isinstance(new_status, str):
            try:
                new_status = TaskStatus(new_status)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")
        
        if new_status == TaskStatus.DONE and task.status != TaskStatus.DONE:
            update_data["completed_at"] = datetime.utcnow()
        elif new_status != TaskStatus.DONE:
            update_data["completed_at"] = None
        update_data["status"] = new_status
    
    try:
        for field, value in update_data.items():
            setattr(task, field, value)
        
        db.commit()
        db.refresh(task)
    except Exception as e:
        db.rollback()
        import logging
        import traceback
        error_msg = f"Failed to update task: {str(e)}\n{traceback.format_exc()}"
        logging.error(error_msg)
        print(error_msg)  # Also print to stdout for docker logs
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update task: {str(e)}"
        )
    
    # Log activity
    try:
        log_task_activity(db, task.id, current_user.id, "updated", old_data, update_data)
    except Exception as e:
        # Log error but don't fail task update
        import logging
        logging.error(f"Failed to log task activity: {e}")
    
    # Build TaskResponse manually to avoid serialization issues
    try:
        task_response = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status.value if hasattr(task.status, 'value') else str(task.status),
            "priority": task.priority.value if hasattr(task.priority, 'value') else str(task.priority),
            "project_id": task.project_id,
            "assignee_id": task.assignee_id,
            "created_by_id": task.created_by_id,
            "due_date": task.due_date,
            "completed_at": task.completed_at,
            "estimated_hours": float(task.estimated_hours) if task.estimated_hours else None,
            "actual_hours": float(task.actual_hours) if task.actual_hours else None,
            "price": float(task.price) if task.price else None,
            "tags": task.tags if task.tags else [],
            "position_x": float(task.position_x) if task.position_x else None,
            "position_y": float(task.position_y) if task.position_y else None,
            "box_width": float(task.box_width) if task.box_width else None,
            "box_height": float(task.box_height) if task.box_height else None,
            "is_archived": safe_get_is_archived(task),
            "created_at": task.created_at,
            "updated_at": task.updated_at,
        }
        return TaskResponse(**task_response)
    except Exception as e:
        import logging
        import traceback
        error_msg = f"Failed to serialize task response: {str(e)}\n{traceback.format_exc()}"
        logging.error(error_msg)
        print(error_msg)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to serialize task response: {str(e)}"
        )


@router.patch("/{task_id}/archive", response_model=TaskResponse)
def archive_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Archive a task (marks it as archived but doesn't delete it)"""
    task = db.query(Task).join(Project).filter(
        Task.id == task_id,
        Project.organization_id == current_user.organization_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Mark task as archived
    task.is_archived = True
    db.commit()
    db.refresh(task)
    
    # Log activity
    try:
        log_task_activity(db, task.id, current_user.id, "archived", None, {"is_archived": True})
    except Exception as e:
        import logging
        logging.error(f"Failed to log task activity: {e}")
    
    # Build response
    task_response = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status.value if hasattr(task.status, 'value') else str(task.status),
        "priority": task.priority.value if hasattr(task.priority, 'value') else str(task.priority),
        "project_id": task.project_id,
        "assignee_id": task.assignee_id,
        "created_by_id": task.created_by_id,
        "due_date": task.due_date,
        "completed_at": task.completed_at,
        "estimated_hours": float(task.estimated_hours) if task.estimated_hours else None,
        "actual_hours": float(task.actual_hours) if task.actual_hours else None,
        "tags": task.tags if task.tags else [],
        "position_x": float(task.position_x) if task.position_x else None,
        "position_y": float(task.position_y) if task.position_y else None,
        "box_width": float(task.box_width) if task.box_width else None,
        "box_height": float(task.box_height) if task.box_height else None,
        "is_archived": safe_get_is_archived(task),
        "created_at": task.created_at,
        "updated_at": task.updated_at,
    }
    
    return TaskResponse(**task_response)


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a task"""
    task = db.query(Task).join(Project).filter(
        Task.id == task_id,
        Project.organization_id == current_user.organization_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    
    return {"message": "Task deleted successfully"}

