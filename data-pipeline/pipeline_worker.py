"""
Data Pipeline Worker - Demonstrates pipeline experience
Processes analytics events, generates reports, and maintains data quality
"""
from celery import Celery
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pandas as pd
from datetime import datetime, timedelta
import json
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.config import settings
from app.models import AnalyticsEvent, Task, Project, Organization

# Celery app
celery_app = Celery(
    "taskflow_pipeline",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Database session
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


@celery_app.task(name="process_analytics_batch")
def process_analytics_batch(batch_id: str, start_time: str, end_time: str):
    """
    Process a batch of analytics events
    Demonstrates: Data pipeline, batch processing, ETL operations
    """
    db = SessionLocal()
    try:
        start = datetime.fromisoformat(start_time)
        end = datetime.fromisoformat(end_time)
        
        # Extract: Get events from database
        events = db.query(AnalyticsEvent).filter(
            AnalyticsEvent.created_at >= start,
            AnalyticsEvent.created_at < end
        ).all()
        
        if not events:
            return {"status": "success", "processed": 0}
        
        # Transform: Convert to DataFrame for processing
        data = []
        for event in events:
            data.append({
                "id": event.id,
                "organization_id": event.organization_id,
                "event_type": event.event_type,
                "user_id": event.user_id,
                "project_id": event.project_id,
                "task_id": event.task_id,
                "created_at": event.created_at,
                **event.metadata
            })
        
        df = pd.DataFrame(data)
        
        # Transform: Aggregate and compute metrics
        metrics = {}
        
        # Events by type
        events_by_type = df.groupby("event_type").size().to_dict()
        metrics["events_by_type"] = events_by_type
        
        # Events by organization
        events_by_org = df.groupby("organization_id").size().to_dict()
        metrics["events_by_organization"] = events_by_org
        
        # Task completion rate
        task_created = df[df["event_type"] == "task_created"].shape[0]
        task_completed = df[df["event_type"] == "task_completed"].shape[0]
        if task_created > 0:
            metrics["completion_rate"] = (task_completed / task_created) * 100
        else:
            metrics["completion_rate"] = 0
        
        # Load: Store metrics (could write to separate analytics table or Redis)
        # For now, we'll return the metrics
        
        return {
            "status": "success",
            "batch_id": batch_id,
            "processed": len(events),
            "metrics": metrics,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@celery_app.task(name="generate_daily_report")
def generate_daily_report(organization_id: int, date: str = None):
    """
    Generate daily productivity report for an organization
    Demonstrates: Reporting pipeline, data aggregation
    """
    db = SessionLocal()
    try:
        if date:
            target_date = datetime.fromisoformat(date).date()
        else:
            target_date = datetime.utcnow().date()
        
        start = datetime.combine(target_date, datetime.min.time())
        end = datetime.combine(target_date, datetime.max.time())
        
        # Extract task data
        tasks = db.query(Task).join(Project).filter(
            Project.organization_id == organization_id,
            Task.created_at >= start,
            Task.created_at < end
        ).all()
        
        # Transform: Generate report
        report = {
            "date": target_date.isoformat(),
            "organization_id": organization_id,
            "tasks_created": len(tasks),
            "tasks_by_status": {},
            "tasks_by_priority": {},
            "users_active": set(),
            "projects_active": set()
        }
        
        for task in tasks:
            report["tasks_by_status"][task.status.value] = report["tasks_by_status"].get(task.status.value, 0) + 1
            report["tasks_by_priority"][task.priority.value] = report["tasks_by_priority"].get(task.priority.value, 0) + 1
            if task.assignee_id:
                report["users_active"].add(task.assignee_id)
            report["projects_active"].add(task.project_id)
        
        report["users_active"] = len(report["users_active"])
        report["projects_active"] = len(report["projects_active"])
        
        # Load: Could store in reports table or send via email
        return {
            "status": "success",
            "report": report
        }
    
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@celery_app.task(name="cleanup_old_analytics")
def cleanup_old_analytics(days_to_keep: int = 90):
    """
    Cleanup old analytics events to maintain database performance
    Demonstrates: Data lifecycle management in pipelines
    """
    db = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        # Archive or delete old events
        deleted_count = db.query(AnalyticsEvent).filter(
            AnalyticsEvent.created_at < cutoff_date
        ).delete()
        
        db.commit()
        
        return {
            "status": "success",
            "deleted_count": deleted_count,
            "cutoff_date": cutoff_date.isoformat()
        }
    
    except Exception as e:
        db.rollback()
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@celery_app.task(name="calculate_productivity_metrics")
def calculate_productivity_metrics(organization_id: int):
    """
    Calculate productivity metrics for an organization
    Demonstrates: Complex aggregations, metric calculation
    """
    db = SessionLocal()
    try:
        # Get tasks from last 30 days
        start_date = datetime.utcnow() - timedelta(days=30)
        
        tasks = db.query(Task).join(Project).filter(
            Project.organization_id == organization_id,
            Task.created_at >= start_date
        ).all()
        
        metrics = {
            "organization_id": organization_id,
            "period_days": 30,
            "total_tasks": len(tasks),
            "completed_tasks": sum(1 for t in tasks if t.status.value == "done"),
            "average_completion_time_hours": None,
            "velocity_trend": []
        }
        
        # Calculate average completion time
        completed_tasks = [t for t in tasks if t.status.value == "done" and t.completed_at]
        if completed_tasks:
            completion_times = [
                (t.completed_at - t.created_at).total_seconds() / 3600
                for t in completed_tasks
            ]
            metrics["average_completion_time_hours"] = sum(completion_times) / len(completion_times)
        
        # Weekly velocity
        for i in range(4):
            week_start = start_date + timedelta(weeks=i)
            week_end = week_start + timedelta(days=7)
            week_tasks = [t for t in tasks if week_start <= t.created_at < week_end]
            week_completed = sum(1 for t in week_tasks if t.status.value == "done")
            metrics["velocity_trend"].append({
                "week": i + 1,
                "start": week_start.isoformat(),
                "tasks_created": len(week_tasks),
                "tasks_completed": week_completed
            })
        
        return {
            "status": "success",
            "metrics": metrics,
            "calculated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


# Periodic tasks configuration
celery_app.conf.beat_schedule = {
    "process-hourly-analytics": {
        "task": "process_analytics_batch",
        "schedule": 3600.0,  # Every hour
    },
    "generate-daily-reports": {
        "task": "generate_daily_report",
        "schedule": 86400.0,  # Daily at midnight
    },
    "cleanup-old-analytics": {
        "task": "cleanup_old_analytics",
        "schedule": 604800.0,  # Weekly
    },
}

if __name__ == "__main__":
    celery_app.start()

