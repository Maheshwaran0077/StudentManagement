# Campus Guardian 360

An AI-Driven Smart Campus Safety and Operations System.

## Services

| Service | Port | Tech |
|---------|------|------|
| Frontend | 5173 | React + Vite |
| Backend  | 5000 | Node.js + Express |
| AI Service | 8000 | Python + FastAPI |
| MongoDB | 27017 | MongoDB Atlas |

## Quick Start

### 1. Backend
```bash
cd backend
npm install
node src/server.js
```

### 2. AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
