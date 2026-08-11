# Auth Application

This repository contains a **full‑stack authentication** example built with:

- **Node.js + Express** backend (REST API) using **MySQL** (via Sequelize)
- **React** frontend scaffolded with **Vite**
- JWT‑based authentication stored in `localStorage`
- Modern, premium UI (glass‑morphism cards, gradient background, Google Font *Inter*)

## Project structure
```
/auth-app
├─ backend/      # Express server
│  ├─ src/
│  │  ├─ config/db.js
│  │  ├─ models/User.js
│  │  ├─ routes/auth.js
│  │  └─ index.js
│  ├─ .env.example
│  └─ package.json
├─ frontend/     # React app (Vite)
│  ├─ src/
│  │  ├─ components/   (optional reusable UI)
│  │  ├─ pages/Login.jsx
│  │  ├─ pages/Register.jsx
│  │  ├─ App.jsx
│  │  ├─ main.jsx
│  │  └─ index.css
│  ├─ index.html
│  ├─ package.json
│  └─ vite.config.js
├─ setup.sql      # MySQL table creation script
└─ README.md
```

## Setup
1. **Clone** the repo.
2. **Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env   # edit with your MySQL credentials and a JWT secret
   npm run dev   # starts on http://localhost:5000
   ```
3. **Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev   # starts on http://localhost:5173 (proxied to backend)
   ```
4. Open the frontend URL in a browser and you should see the login & register pages.

## License
MIT
