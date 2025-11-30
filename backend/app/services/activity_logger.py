"""Activity logging service - part of data pipeline"""
from sqlalchemy.orm import Session
from app.models import TaskActivityLog, AnalyticsEvent
from typing import Dict, Any
from datetime import datetime


def log_task_activity(
    db: Session,
    task_id: int,
    user_id: int,
    action: str,
    old_value: Dict[str, Any] | None,
    new_value: Dict[str, Any] | None
):
    """Log task activity for audit trail"""
    activity_log = TaskActivityLog(
        task_id=task_id,
        user_id=user_id,
        action=action,
        old_value=old_value or {},
        new_value=new_value or {}
    )
    db.add(activity_log)
    
    # Also create analytics event for pipeline processing
    # Use a separate try-except to ensure activity logging doesn't fail
    try:
        from app.models import Task
        from sqlalchemy.orm import joinedload
        # Load task with project relationship to avoid lazy loading issues
        task = db.query(Task).options(joinedload(Task.project)).filter(Task.id == task_id).first()
        if task and task.project:
            analytics_event = AnalyticsEvent(
                organization_id=task.project.organization_id,
                event_type=f"task_{action}",
                user_id=user_id,
                project_id=task.project_id,
                task_id=task_id,
                extra_data={
                    "action": action,
                    "old_value": old_value,
                    "new_value": new_value
                }
            )
            db.add(analytics_event)
    except Exception as e:
        # Log error but don't fail - analytics is optional
        import logging
        logging.warning(f"Failed to create analytics event: {e}")
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        import logging
        logging.error(f"Failed to commit activity log: {e}")
        raise

