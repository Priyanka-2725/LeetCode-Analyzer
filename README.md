# LeetCode Analyzer

LeetCode Analyzer is a full-stack analytics platform that analyzes any public LeetCode profile and returns practical, data-driven insights.

It combines:
- profile analysis from LeetCode GraphQL data
- historical tracking and trend analytics
- productivity pattern detection
- recommendation generation for learning focus
- optional ML-based prediction (risk, growth, decline)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Option 1: Docker Compose (recommended)](#option-1-docker-compose-recommended)
  - [Option 2: Local Development](#option-2-local-development)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Example API Calls](#example-api-calls)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Deployment Notes](#deployment-notes)
- [Roadmap](#roadmap)
- [License](#license)

## Features

- Analyze by username or LeetCode profile URL
- Difficulty and topic-based performance breakdown
- Consistency score, growth rate, and topic mastery metrics
- Historical snapshots for trend lines
- Submission event history with topic/difficulty enrichment
- Productivity patterns from activity history
- Goal forecast endpoint (target-based projection)
- CSV export for historical analytics
- Optional ML prediction service integration
- Graceful fallback behavior if MongoDB or Redis is unavailable

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Framer Motion

### Backend
- Node.js
- Express
- TypeScript
- Axios
- Mongoose
- Redis client

### Data and Infrastructure
- MongoDB
- Redis
- Python FastAPI ML microservice
- Docker + Docker Compose

## Architecture

```text
Frontend (React/Vite)
    |
    |  HTTP /api/*
    v
Backend API (Express + TypeScript)
    |\
    | \-- Redis (response cache)
    | \-- MongoDB (analysis + snapshots + events)
    | \-- ML Service (FastAPI /predict)
    \
     \-- LeetCode GraphQL (upstream profile data)
```

## Project Structure

```text
LeetCode Analysis/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── data/problems.json
│   └── src/
│       ├── config/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       └── types/
└── ml_service/
    ├── Dockerfile
    ├── main.py
    ├── requirements.txt
    └── test_predict.py
```

## Getting Started

### Prerequisites

- Docker Desktop (for Docker mode)
- OR local runtimes:
  - Node.js 18+
  - npm 9+
  - Python 3.10+
  - MongoDB (optional but recommended)
  - Redis (optional but recommended)

### Option 1: Docker Compose (recommended)

From repository root:

```bash
docker compose up --build -d
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- Backend Health: http://localhost:5001/health
- ML Service: http://localhost:8000
- MongoDB: localhost:27017
- Redis: localhost:6379

Useful commands:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f ml-service
docker compose down
```

### Option 2: Local Development

Run each service in a separate terminal.

#### 1) Backend

```bash
cd backend
npm install
npm run dev
```

Backend default URL: http://localhost:5000

#### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: http://localhost:5173

#### 3) ML Service (optional but recommended)

```bash
cd ml_service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

ML service URL: http://localhost:8000

## Environment Variables

### Backend

| Variable | Default | Description |
|---|---|---|
| PORT | 5000 | Backend server port |
| NODE_ENV | development | Runtime mode |
| MONGODB_URI | mongodb://localhost:27017/leetcode-analyzer | MongoDB connection string |
| REDIS_URL | redis://localhost:6379 | Redis connection string |
| CACHE_TTL_SECONDS | 3600 | Cache TTL (seconds) |
| FRONTEND_URL | http://localhost:5173 | Allowed CORS origins (comma-separated) |
| ML_SERVICE_URL | http://localhost:8000 | Base URL for ML service |
| ML_TIMEOUT_MS | 5000 | Timeout for ML requests |

### Frontend

| Variable | Scope | Default | Description |
|---|---|---|---|
| VITE_BACKEND_URL | dev server proxy (vite.config.ts) | http://localhost:5000 | Proxy target used in local dev |
| VITE_API_URL | build/runtime API base | empty string | If set, Axios uses this full base URL |

Notes:
- In local development, keeping `VITE_API_URL` empty allows relative `/api/*` calls through Vite proxy.
- In Docker frontend build, an nginx config proxies `/api/*` to the backend container.

### ML Service

| Variable | Default | Description |
|---|---|---|
| ALLOWED_ORIGINS | http://localhost:5000 | CORS allow-list for ML API |

## API Reference

Base URLs:
- Local backend: `http://localhost:5000`
- Docker backend: `http://localhost:5001`

### Health Check

`GET /health`

Returns backend status and timestamp.

### Analyze Profile

`POST /api/analyze`

Request body:

```json
{
  "username": "leetcode_user"
}
```

You can also pass a full LeetCode profile URL:

```json
{
  "username": "https://leetcode.com/u/leetcode_user/"
}
```

Response includes:
- core analysis (solved counts, streak, topics, activity)
- computed analytics (consistency, growth, mastery)
- recommendations / learning output
- `mlPrediction` (when ML service is reachable)
- `cached` flag

### Historical Snapshots

`GET /api/history/:username?days=30`

Returns time-series points for analytics trends.

### Submission Events

`GET /api/events/:username?limit=100`

Returns recent accepted submissions with enriched metadata.

### Productivity Patterns

`GET /api/patterns/:username`

Returns productivity insights derived from historical activity.

### Goal Forecast

`GET /api/forecast/:username?target=500`

Returns target-based progression and estimated completion metrics.

### Export History CSV

`GET /api/export/:username`

Returns historical analytics as downloadable CSV.

## Example API Calls

Using Docker backend (`5001`):

```bash
curl -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"username":"leetcode_user"}'
```

```bash
curl "http://localhost:5001/api/history/leetcode_user?days=60"
```

```bash
curl "http://localhost:5001/api/events/leetcode_user?limit=120"
```

```bash
curl "http://localhost:5001/api/forecast/leetcode_user?target=700"
```

## Testing

### ML Service smoke test

Start ML service first, then:

```bash
cd ml_service
python test_predict.py
```

This runs health + prediction checks against `http://localhost:8000`.

## Troubleshooting

### 1) Frontend cannot reach backend

Symptoms:
- network errors in UI
- `/api/*` calls fail

Checks:
- local dev: verify backend is on `http://localhost:5000`
- Docker: verify backend is on `http://localhost:5001`
- confirm `VITE_BACKEND_URL` / `VITE_API_URL` usage matches your mode

### 2) Empty trend/pattern responses

Possible causes:
- historical snapshots are not persisted yet
- MongoDB is unavailable
- limited activity for target profile

Quick checks:

```bash
curl "http://localhost:5001/api/history/<username>?days=30"
curl "http://localhost:5001/api/events/<username>?limit=50"
```

### 3) Redis unavailable

Behavior:
- app still works
- response caching is disabled automatically

### 4) MongoDB unavailable

Behavior:
- live analysis still works
- historical persistence/export features are reduced or unavailable

### 5) Docker build issues

Use plain progress and no cache to inspect failures:

```bash
docker compose build --no-cache --progress=plain
```

## Deployment Notes

### Frontend

Any static host is suitable (Vercel, Netlify, nginx). Set:
- `VITE_API_URL` to deployed backend URL if not using same-origin proxy

### Backend

Any Node.js host is suitable (Render, Railway, Fly.io, Azure App Service, etc.).

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
node dist/index.js
```

Required external services for full functionality:
- MongoDB instance
- Redis instance
- ML service endpoint (optional but recommended)

## Roadmap

- User authentication and saved dashboards
- Historical range filtering and comparisons
- Deeper topic-level recommendation engine
- Scheduled weekly progress digests
- More robust automated test coverage

## License

This project is intended for educational and portfolio use.
