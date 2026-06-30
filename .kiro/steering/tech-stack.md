# Tech Stack & Conventions

## Project Structure
- `db/` — SQL files only (schema, migrations, seed data)
- `backend/` — Node.js + Express API server
- `frontend/` — React app

## Technology Choices
| Layer | Technology | Deployment |
|-------|-----------|------------|
| Database | PostgreSQL | Neon |
| Backend | Node.js + Express | Render |
| Frontend | React | Vercel |

## Conventions
- Database: write plain SQL (`.sql`) files in `db/`. Use PostgreSQL syntax (Neon-compatible).
- Backend: Express REST API, environment variables via `.env` (DATABASE_URL from Neon).
- Frontend: React, calls backend API via configurable base URL.
