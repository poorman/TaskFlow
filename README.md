# TaskFlow - Multi-Tenant Task Management SaaS

A production-ready task management platform built as a SaaS application, demonstrating full-stack development, data pipelines, multi-tenant architecture, and real-time features.

<img width="1200" height="600" alt="image" src="https://github.com/user-attachments/assets/68ef89a4-2609-4a2d-aa2e-0b5d04990f02" />

## 🎯 Project Purpose

**TaskFlow** is a comprehensive task management system designed for both personal productivity and as a portfolio piece demonstrating skills relevant to quantitative trading firms. This project showcases:

- **Data Pipeline Development**: ETL processes, batch processing, analytics aggregation
- **Python & Backend Development**: FastAPI, database design, API architecture
- **Full-Stack Expertise**: Next.js frontend, TypeScript, real-time features
- **Multi-Tenant SaaS Architecture**: Organization isolation, subscription management, scalability
- **Greenfield Development**: Built from scratch (0-1 product development)

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **Framework**: FastAPI with async/await
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT-based authentication
- **Multi-Tenancy**: Organization-based data isolation
- **Background Jobs**: Celery for asynchronous task processing
- **Real-time**: WebSocket support for live updates
- **API**: RESTful API with OpenAPI documentation

### Frontend (Next.js/TypeScript)
- **Framework**: Next.js 16 with App Router
- **State Management**: Zustand
- **UI**: Tailwind CSS with dark mode
- **Charts**: Recharts for analytics visualization
- **Real-time**: WebSocket integration for live updates

### Data Pipeline
- **Worker**: Celery workers for batch processing
- **Scheduler**: Celery Beat for scheduled jobs
- **ETL**: Extract, Transform, Load operations
- **Analytics**: Aggregation and reporting pipelines
- **Data Lifecycle**: Automated cleanup and archiving

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis 7
- **Message Broker**: Redis (for Celery)

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Running with Docker

1. **Clone and navigate to the project:**
   ```bash
   cd taskflow
   ```

2. **Copy environment file and configure:**
   ```bash
   cp .env.example .env
   ```
   
   **Important**: Edit `.env` and set secure values for:
   - `SECRET_KEY`: Generate with `openssl rand -hex 32`
   - `POSTGRES_PASSWORD`: Set a secure database password
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Optional, for Google OAuth

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

### Local Development

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Data Pipeline Worker
```bash
cd backend
celery -A data-pipeline.pipeline_worker worker --loglevel=info
celery -A data-pipeline.pipeline_worker beat --loglevel=info
```

## 📊 Key Features

### Multi-Tenant SaaS Architecture
- Organization-based data isolation
- Subscription tiers (Free, Pro, Enterprise)
- User management per organization
- Resource limits per subscription tier

### Task Management
- Kanban board with drag-and-drop
- Task statuses: To Do, In Progress, In Review, Done, Blocked
- Priority levels: Low, Medium, High, Urgent
- Task assignment and due dates
- Project organization
- Comments and activity logs

### Analytics & Reporting
- Dashboard analytics with key metrics
- Productivity score calculation
- Task completion trends
- Time-series analysis
- Top contributors tracking
- Completion time analytics

### Data Pipeline
- **Batch Processing**: Processes analytics events in batches
- **ETL Operations**: Extract, Transform, Load for reporting
- **Daily Reports**: Automated daily productivity reports
- **Metric Calculation**: Complex aggregations and analytics
- **Data Lifecycle**: Automated cleanup of old data

### Real-Time Features
- WebSocket support for live task updates
- Real-time analytics updates
- Live collaboration features (ready for implementation)

## 🛠️ Technology Stack

### Backend
- **Python 3.11**: Core backend language
- **FastAPI**: Modern async web framework
- **SQLAlchemy**: ORM for database operations
- **PostgreSQL**: Primary database
- **Redis**: Caching and message broker
- **Celery**: Background task processing
- **JWT**: Authentication
- **WebSockets**: Real-time communication

### Frontend
- **Next.js 16**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Zustand**: State management
- **Recharts**: Data visualization
- **Axios**: HTTP client

### Data Pipeline
- **Celery**: Distributed task queue
- **Pandas**: Data manipulation and analysis
- **PostgreSQL**: Data storage
- **Redis**: Message broker

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Orchestration
- **PostgreSQL**: Database
- **Redis**: Cache and queue

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── app/
│   │   ├── routers/          # API routes
│   │   ├── schemas/          # Pydantic models
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Utilities
│   │   ├── database.py       # DB configuration
│   │   ├── config.py         # Settings
│   │   └── main.py           # FastAPI app
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile
│   └── init_db.py            # DB initialization
│
├── frontend/
│   ├── app/                  # Next.js app directory
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── login/            # Auth pages
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   ├── lib/                  # Utilities & API client
│   ├── store/                # Zustand stores
│   ├── package.json
│   └── Dockerfile
│
├── data-pipeline/
│   ├── pipeline_worker.py    # Celery tasks
│   ├── requirements.txt
│   └── README.md
│
├── docker-compose.yml        # Docker orchestration
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## 🎓 Skills Demonstrated (Relevant to Trading Firm Role)

### 1. **Data Pipeline Development** ✅
   - ETL operations for analytics data
   - Batch processing of events
   - Time-series data aggregation
   - Automated reporting pipelines
   - Data lifecycle management

### 2. **Python Expertise** ✅
   - FastAPI backend development
   - Asynchronous programming
   - Data processing with Pandas
   - Background job processing with Celery
   - Database design and optimization

### 3. **Full-Stack Development** ✅
   - RESTful API design
   - Real-time features (WebSockets)
   - Modern frontend with Next.js
   - State management
   - Type safety with TypeScript

### 4. **System Architecture** ✅
   - Multi-tenant SaaS architecture
   - Microservices-ready design
   - Scalable database schema
   - Background job processing
   - Real-time communication

### 5. **Greenfield Development** ✅
   - Built from scratch (0-1 product)
   - Complete system design
   - End-to-end implementation
   - Production-ready codebase

### 6. **Team Collaboration** ✅
   - Code organization and structure
   - API documentation (OpenAPI)
   - Docker for easy deployment
   - Clear project structure

## 📈 Use Cases for Portfolio Presentation

When presenting this project for the trading firm role, emphasize:

1. **Data Pipeline Experience**: "Built a complete ETL pipeline for processing analytics events, similar to processing trade data in a trading system"

2. **Python Development**: "Developed a production-ready FastAPI backend with async/await, database optimization, and background job processing"

3. **Multi-Tenant Architecture**: "Designed and implemented a SaaS architecture with organization isolation, similar to handling multiple trading strategies or accounts"

4. **Real-Time Features**: "Implemented WebSocket-based real-time updates, similar to real-time market data streaming"

5. **Analytics & Reporting**: "Built analytics aggregation pipelines that process large volumes of data efficiently"

6. **Greenfield Development**: "Designed and built a complete system from scratch, demonstrating ability to architect and implement new products"

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Organization-level data isolation
- SQL injection prevention (SQLAlchemy ORM)
- CORS configuration
- Environment-based configuration

## 📝 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🧪 Testing

```bash
# Backend tests (to be implemented)
cd backend
pytest

# Frontend tests (to be implemented)
cd frontend
npm test
```

## 🚢 Deployment

The application is containerized and ready for deployment to:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- Kubernetes
- Any Docker-compatible platform

## 📄 License

This project is built as a portfolio demonstration.

## 👤 Author

Built by Peter Bieda for portfolio demonstration, showcasing skills relevant to quantitative trading firm software engineering roles.

---

## 🎯 Key Highlights for Interview

1. **Demonstrates Pipeline Experience**: Complete ETL pipeline with batch processing, data aggregation, and reporting
2. **Python Proficiency**: Production-ready FastAPI backend with async operations and data processing
3. **Full-Stack Capability**: Modern frontend and backend, showing ability to work across the stack
4. **Architecture Skills**: Multi-tenant SaaS design showing understanding of scalable systems
5. **Greenfield Development**: Built from scratch, demonstrating ability to architect new systems
6. **Production-Ready**: Dockerized, documented, and deployable codebase

This project demonstrates the exact skills needed for a software engineering role supporting quant teams, data pipelines, and trading infrastructure at a quantitative trading firm.

