# BookTracker

A full-stack book reading tracker application built with React, Express, and PostgreSQL.

## Features
- User authentication (register, login, JWT)
- Full CRUD for books
- Filter by reading status (Want to Read, Reading, Finished)
- Star ratings and personal notes
- Reading stats dashboard

## Tech Stack
- **Frontend**: React 18, Vite, DaisyUI (TailwindCSS)
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Testing**: Vitest, React Testing Library, Playwright, ESLint

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Database
```bash
psql -U postgres
CREATE DATABASE booktracker;
\q
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env   # Edit with your DB credentials
npm run dev
```
Backend runs on http://localhost:5000

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173

## Running Tests

### Frontend unit/integration tests
```bash
cd frontend
npm test
```

### Frontend coverage
```bash
cd frontend
npm run test:coverage
```

### E2E tests (requires both servers running)
```bash
cd frontend
npm run test:e2e
```

### Backend tests
```bash
cd backend
npm test
```

### Lint
```bash
cd frontend
npm run lint
```
