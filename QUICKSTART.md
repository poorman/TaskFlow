# TaskFlow - Quick Start Guide

## Prerequisites
- Docker & Docker Compose installed
- Node.js 20+ (for local frontend development)
- Python 3.11+ (for local backend development)

## Quick Start (Docker - Recommended)

1. **Clone/Navigate to project:**
   ```bash
   cd taskflow
   ```

2. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d --build
   ```

4. **Initialize database:**
   ```bash
   docker-compose exec backend python init_db.py
   ```

5. **Access the application:**
   - Frontend: http://localhost:3014
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - PostgreSQL: localhost:5433
   - Redis: localhost:6380

6. **Create your first account:**
   - Go to http://localhost:3014
   - Click "Sign up"
   - Enter your email and password
   - You'll automatically get a free tier organization

7. **Start using TaskFlow:**
   - Create a project
   - Add tasks
   - View analytics dashboard

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Data Pipeline Worker
```bash
# Terminal 1: Worker
cd backend
celery -A data-pipeline.pipeline_worker worker --loglevel=info

# Terminal 2: Scheduler
cd backend
celery -A data-pipeline.pipeline_worker beat --loglevel=info
```

## Troubleshooting

### Database not initializing
```bash
docker-compose down -v
docker-compose up -d --build
docker-compose exec backend python init_db.py
```

### Frontend not connecting to backend
- Check that `NEXT_PUBLIC_API_URL` in frontend is set to `http://localhost:8000`
- Verify backend is running on port 8000
- Check browser console for CORS errors

### Celery worker errors
- Ensure Redis is running
- Check that database is accessible
- Verify DATABASE_URL is correct in environment

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│  PostgreSQL │
│  (Next.js)  │◀────│  (FastAPI)  │◀────│             │
└─────────────┘     └─────────────┘     └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │    Redis    │
                     │  (Cache/    │
                     │   Queue)    │
                     └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   Celery    │
                     │  (Pipeline) │
                     └─────────────┘
```

## Key Features to Explore

1. **Multi-Tenant SaaS**: Register a new account - creates organization automatically
2. **Task Management**: Create projects and tasks
3. **Kanban Board**: Drag and drop tasks between statuses
4. **Analytics Dashboard**: View productivity metrics and charts
5. **Real-Time Updates**: WebSocket support for live updates
6. **Data Pipeline**: Background jobs process analytics (check logs)

## Next Steps

1. Read `README.md` for detailed documentation
2. Check `PORTFOLIO_PRESENTATION.md` for interview preparation
3. Explore API documentation at http://localhost:8000/docs
4. Review code structure in `/backend` and `/frontend`

## For Portfolio Demo

1. Start all services: `docker-compose up -d`
2. Initialize database: `docker-compose exec backend python init_db.py`
3. Open http://localhost:3014
4. Register account → Create project → Add tasks → View analytics
5. Show API docs at http://localhost:8000/docs
6. Explain data pipeline and architecture

