# DentiFlow / Oralix — Frontend Application

Modern React 19 + TypeScript + Tailwind CSS interface for DentiFlow / Oralix Dental Management System.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` if custom API URLs are needed:
```bash
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```
The app will run at `http://localhost:3000` and proxy `/api/*` requests to the backend server (default `http://localhost:3001`).

### 4. Build for Production
```bash
npm run build
```
