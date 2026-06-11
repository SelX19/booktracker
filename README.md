# BookTracker

A full-stack book reading tracker application built with React, Express, and PostgreSQL.

## Features
- User authentication (register, login, JWT)
- Full CRUD for books (create, read, update, delete)
- Filter by reading status (Want to Read, Reading, Finished)
- Star ratings and personal notes
- Reading stats dashboard

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, DaisyUI (TailwindCSS) |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Backend Testing | Vitest, Supertest |
| Frontend Testing | Vitest, React Testing Library |
| E2E Testing | Playwright |
| Static Analysis | ESLint |

## Live Demo

- **Frontend**: https://booktracker-frontend-13zm.onrender.com
- **Backend API**: https://booktracker-backend-se6x.onrender.com

> Note: Hosted on Render's free tier — first load may take 30–60 seconds while the service wakes up.

## Project's Core Structure

```
booktracker/
├── backend/
│   ├── src/
│   │   ├── db/           # PostgreSQL pool configuration
│   │   ├── middleware/   # JWT authentication middleware
│   │   └── routes/       # auth.js, books.js
│   ├── tests/            # Vitest test suites (backend unit tests)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # BookCard, BookModal, Navbar
│   │   ├── context/      # AuthContext
│   │   ├── pages/        # Dashboard, Books, Login, Register pages
│   │   ├── services/     # api.js (Axios)
│   │   └── test/         # setup.js
│   ├── tests/            # Vitest + Playwright test suites (frontend unit tests)
│   │   └── e2e/          # Playwright specs
│   └── package.json
└── README.md
```

## Local Setup

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
cp .env.example .env   # Edit with your DB credentials and JWT_SECRET
npm run dev
```
Backend runs on `http://localhost:5001`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

---

## Testing

The project includes a structured multi-layer testing strategy covering static analysis, unit testing, integration testing, and end-to-end system testing.

### Test Structure

```
backend/
  tests/
    auth.test.js          # Unit tests — authentication routes
    books.test.js         # Unit tests — book CRUD routes

frontend/
  tests/
    LoginPage.test.jsx    # Unit tests — login form
    RegisterPage.test.jsx # Unit tests — registration form
    BookModal.test.jsx    # Unit tests — add/edit book modal
    BookCard.test.jsx     # Unit tests — book card component
    e2e/
      booktracker.spec.js # Playwright E2E tests
```

---

### Backend Unit Tests (Vitest + Supertest)

Tests the authentication and book routes in isolation using mocked database and middleware dependencies.

**Coverage: 98.21% statements — 31 tests, 2 test files**

```bash
cd backend
npm test
```

To run with coverage report:
```bash
cd backend
npm run test:coverage
```

| Suite | Tests | Coverage |
|---|---|---|
| auth.test.js | 11 | 100% all metrics |
| books.test.js | 20 | 97.36% statements, 96.15% branches |

---

### Frontend Unit Tests (Vitest + React Testing Library)

Tests React components in isolation using mocked API calls, AuthContext, and router. Covers form validation, boundary values, submission flows, and error handling.

**Coverage: 100% on all tested components — 57 tests, 4 test files**

```bash
cd frontend
npx vitest run --coverage
```

| Suite | Tests | Components Covered |
|---|---|---|
| LoginPage.test.jsx | 10 | LoginPage.jsx |
| RegisterPage.test.jsx | 12 | RegisterPage.jsx |
| BookModal.test.jsx | 18 | BookModal.jsx |
| BookCard.test.jsx | 17 | BookCard.jsx |

> `BooksPage`, `DashboardPage`, `Navbar`, and `AuthContext` are excluded from unit testing scope and covered by the Playwright E2E suite instead.

---

### Integration Testing (Postman)

Tests the full API chain against the live deployed backend — no mocks, real database, real JWT flow.

**12 tests across 3 request groups**

| Group | Requests | Description |
|---|---|---|
| User Authentication Flow (INT-AUTH) | 4 | Register, duplicate check, login, wrong password |
| Protected Route Access (INT-BOOK) | 2 | Unauthenticated rejection, authenticated access |
| Full CRUD Chain (INT-CRUD) | 6 | Create → Read → Update → Stats → Delete → 404 |

Import the Postman collection from `docs/BookTracker_Integration_Tests.json` (if included) or recreate using the base URL above.

---

### E2E Tests (Playwright)

Tests the full system in a real browser against the deployed frontend and backend — authentication flows, book management CRUD, filtering, navigation, and route protection.

**18 tests across 3 suites**

```bash
cd frontend
npx playwright test --headed
```

To run headlessly (CI mode):
```bash
cd frontend
npx playwright test
```

To view the HTML report after a run:
```bash
cd frontend
npx playwright show-report
```

| Suite | Tests | Covers |
|---|---|---|
| Authentication | 7 | Register, login, wrong password, logout, route protection |
| Book Management | 7 | Add, edit, delete, filter by status |
| Navigation | 4 | Navbar links, dashboard stats, view all |

> E2E tests run against the deployed Render URLs by default (configured in `playwright.config.js`). Ensure both services are awake before running.

---

### Static Analysis (ESLint)

```bash
cd frontend
npm run lint
```

ESLint is configured via `.eslintrc.cjs` with React and accessibility rules.

---

### Full Test Summary

| Layer | Tool | Tests | Status |
|---|---|---|---|
| Static Analysis | ESLint | — | Configured |
| Backend Unit | Vitest + Supertest | 31 | All pass |
| Frontend Unit | Vitest + RTL | 57 | All pass |
| Integration | Postman | 12 | All pass |
| E2E / System | Playwright | 18 | 12/18 pass* |

> *6 E2E tests require timeout adjustments for Render cold-start latency — in progress.
