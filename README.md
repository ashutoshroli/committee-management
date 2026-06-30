# Committee Management System

A full-stack web application for managing a savings committee/chit-fund group with members, monthly instalments, loans (reducing balance interest), and fund tracking.

## Tech Stack

| Layer | Technology | Deployment |
|-------|-----------|------------|
| Database | PostgreSQL | Neon |
| Backend | Node.js + Express | Render |
| Frontend | React + Vite + Tailwind CSS | Vercel |

## Project Structure

```
committee-management/
├── db/              → SQL schema & migrations (Neon PostgreSQL)
├── backend/         → Node.js + Express REST API
└── frontend/        → React (Vite + Tailwind CSS)
```

## Features

- **Auth & Roles**: Login with JWT. Roles: Super Admin, Admin, Sub Admin, Manager
- **Member Management**: CRUD operations, committee roles (President, Secretary, Treasurer, Member)
- **Loan System**: 
  - Monthly reducing balance interest
  - Flexible payments (Full EMI, Interest-only, Partial, Custom amount)
  - Compound interest on unpaid amounts
  - Foreclosure (no penalty)
  - Auto-calculation of tenure & schedule
- **Monthly Instalments**: Generate & collect monthly contributions with late fine
- **Dashboard**: Fund overview, collection stats, active loans
- **Settings**: Configure committee name, instalment amount, interest rate, late fines, grace period

## Setup

### Database (Neon)
1. Create a Neon PostgreSQL database
2. Run `db/schema.sql` to create tables

### Backend
```bash
cd backend
cp .env.example .env   # Configure DATABASE_URL, JWT_SECRET
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env   # Configure VITE_API_URL
npm install
npm run dev
```

## Default Login
- Email: `admin@committee.com`
- Password: `admin123` (change after first login)

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/dashboard/stats | Dashboard stats |
| GET/POST | /api/members | List/Create members |
| GET/PUT/DELETE | /api/members/:id | Member CRUD |
| GET/POST | /api/loans | List/Create loans |
| POST | /api/loans/:id/payment | Record loan payment |
| POST | /api/loans/:id/foreclose | Foreclose loan |
| POST | /api/instalments/generate | Generate monthly instalments |
| POST | /api/instalments/:id/pay | Record instalment payment |
| GET/PUT | /api/settings | Committee settings |
| GET/POST | /api/users | User management |
