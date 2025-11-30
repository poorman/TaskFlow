"""
Initialize database with schema
"""
from app.database import engine, Base
from app.models import (
    Organization, User, Project, Task, TaskComment, 
    TaskActivityLog, AnalyticsEvent
)

if __name__ == "__main__":
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

