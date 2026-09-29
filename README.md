# DentiFlow / Oralix — Dental Practice Management Platform

This repository is strictly separated into dedicated **frontend** and **backend** applications.

## Directory Structure

```
.
├── frontend/    # Client application (React 19, TypeScript, Tailwind CSS, Vite)
├── backend/     # API server & database (Node.js, Express, TypeScript, PBKDF2 Auth)
├── package.json # Root workspace manager
└── README.md
```

---

## 🚀 Running the Projects

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs the frontend development server on `http://localhost:3000`.

### 2. Backend
```bash
cd backend
npm install
npm run dev
```
Runs the Express API server on `http://localhost:3001`.

### 3. Running from Root
You can also run commands directly from the root workspace:
- Start frontend: `npm run dev:frontend`
- Start backend: `npm run dev:backend`
- Build frontend: `npm run build:frontend`
- Test backend: `npm run test:backend`
