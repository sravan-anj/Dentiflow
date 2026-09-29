# DentiFlow / Oralix — Backend Server

Node.js, TypeScript, and Express REST API backend for DentiFlow / Oralix.

## Features
- **Authentication & RBAC:** PBKDF2-SHA256 password hashing (210,000 iterations), session validation, role enforcement (Patient, Doctor, Admin, Receptionist).
- **Password Reset:** Cryptographic token generation, 30-minute expiration, email dispatch via Resend/SMTP.
- **RESTful Endpoints:** Patients, Appointments, Billing, Clinical Notes, Inventory, AI Assistant, Analytics.
- **Data Persistence:** Lightweight JSON document stores with atomic operations.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
The server will run on `http://localhost:3001`.

### 4. Run Automated Tests
```bash
npm run test
```
Runs both the authentication test suite (`test_auth.ts`) and the domain matrix validation suite (`test_domain_matrix.ts`).
