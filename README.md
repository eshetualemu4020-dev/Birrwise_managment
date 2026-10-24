# BirrWise — Student Finance Tracker

A full-stack personal-finance application for students (Ethiopian Birr, ETB).

- **Backend** — Node.js + Express (REST API), Sequelize ORM
  - **SQLite** by default (zero setup) or **MySQL** via `DB_DIALECT=mysql`
  - JWT authentication, bcrypt password hashing
  - Budgets, savings goals, recurring income/expenses, email notifications
- **Frontend** — React 19 + Vite, Chart.js, React Router
  - Theme switching (light/dark), responsive sidebar layout, CSV export

## Requirements

- Node.js 20+ (tested on v24)
- npm

## Quick start

```bash
# install everything (root + backend + frontend)
npm run install-all

# copy and adjust environment variables
cp backend/.env.example backend/.env

# run backend (5000) and frontend (5173) together
npm run dev
```

Then open <http://localhost:5173>.

### Running the servers separately

```bash
npm run dev --prefix backend    # http://localhost:5000
npm run dev --prefix frontend   # http://localhost:5173
```

Vite proxies `/api` and `/uploads` to the backend, so no CORS setup is needed
during development.

## Project structure

```
dave/
├─ backend/
│  ├─ src/
│  │  ├─ config/db.js                 # SQLite / MySQL connection
│  │  ├─ models/                      # User, Income, Expense, Budget, SavingsGoal…
│  │  ├─ controllers/                 # auth, income, expense, budget, savings, notifications…
│  │  ├─ middleware/                  # JWT auth, role guard, uploads, sessions
│  │  ├─ routes/                      # one router per resource
│  │  ├─ services/emailService.js     # password-reset emails (SMTP or Ethereal)
│  │  ├─ jobs/cronJobs.js             # recurring transactions, budget alerts
│  │  └─ index.js                     # app entry, associations, migrations
│  ├─ .env.example
│  └─ database.sqlite                 # created automatically for SQLite
├─ frontend/
│  └─ src/
│     ├─ pages/                       # Landing, Login, Register, ForgotPassword,
│     │                               # ResetPassword, Student*
│     ├─ components/StudentLayout.jsx # student sidebar / topbar shell
│     └─ context/ThemeContext.jsx     # light/dark theme
└─ package.json                       # `npm run dev` runs both servers
```


## Scope

This build ships a **single student experience**. Every registered account
lands on `/student/dashboard` with income, expenses, budgets, savings goals,
transactions and reports. There are **no admin or advisor consoles** and no AI
assistant — those sections of earlier drafts were removed.

A user still carries a `role` column (used by the account-suspension flow),
but no route branches on it.

A `/dashboard` redirect stub used to forward logged-in users to
`/student/dashboard`. It has been removed, so `/dashboard` now falls through to
the catch-all redirect and lands on `/login`.

## API overview

All protected routes expect `Authorization: Bearer <token>`.

| Method | Endpoint                                                  | Notes                              |
| ------ | --------------------------------------------------------- | ---------------------------------- |
| `POST` | `/api/auth/register`                                      | Create account                     |
| `POST` | `/api/auth/login`                                         | Returns JWT                        |
| `GET`  | `/api/auth/me`                                            | Current profile (403 if suspended) |
| `POST` | `/api/auth/forgot-password`                               | Emails a reset link                |
| `POST` | `/api/auth/reset-password`                                | `{ token, newPassword }`           |
| `PUT`  | `/api/auth/change-password`                               | `{ currentPassword, newPassword }` |
| `GET`  | `/api/income` · `/api/expenses`                           | List records                       |
| …      | `/api/budgets`, `/api/savings-goals`, `/api/transactions` | Feature CRUD                       |
| `GET`  | `/api/notifications`                                      | In-app notifications               |

There is no chat/AI endpoint: `/api/chat` and `controllers/chatController.js`
were removed because nothing in the frontend ever called them.

A health check is available at `GET /api/health`.

## Password reset flow

1. `POST /api/auth/forgot-password` with an email.
2. A 15-minute JWT is issued. Only its **SHA-256 hash** is stored on the user row
   (`resetPasswordToken`), alongside `resetPasswordExpires`.
3. The emailed link points to `FRONTEND_URL/reset-password?token=…`.
4. `POST /api/auth/reset-password` verifies the token, its hash, its expiry and the
   `tokenVersion` snapshot, then updates the password and invalidates any
   outstanding reset links.

In development with no `SMTP_HOST` configured, the email is **not** delivered —
the backend console prints an Ethereal preview URL you can open to get the link.

## Notes

- Database tables are created automatically on first start (`sequelize.sync`).
  A small `migrateColumns()` helper adds newer columns to existing SQLite tables.
- Changing a password invalidates previously issued reset links via `tokenVersion`.
