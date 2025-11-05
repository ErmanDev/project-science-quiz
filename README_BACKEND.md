# Backend for the TypeScript/Vite App

This adds a minimal Express + TypeScript backend with JWT auth and a simple JSON database.

## Quick Start

```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev
```

API will be at `http://localhost:3001/api`.

Demo accounts:
- Teacher: `teacher@sciquest.app` / `password123`
- Student: `student@sciquest.app` / `password123`

## Frontend Integration

- A new file `src/api.ts` was added. Use it like:

```ts
import { api, setToken, loadToken } from './src/api';

// on login
const { token, user } = await api.login(email, password);
setToken(token);
```

- You can set `VITE_API_BASE` in your frontend `.env` (e.g., `VITE_API_BASE=http://localhost:3001/api`).

## Endpoints

- `GET /api/health`
- `POST /api/auth/login` — { email, password }
- `POST /api/auth/register` — { name, email, password, role, classId? }
- `GET /api/quizzes` (auth)
- `GET /api/quizzes/:id` (auth)
- `POST /api/quizzes/:id/submit` (auth) — { answers: { [questionId]: string | boolean } }
- `GET /api/classes/:classId/students` (auth)
- `GET /api/messages` (auth)
- `GET /api/badges` (auth)
```

## Data

Uses a JSON file at `server/data/db.json` via LowDB. Replace with a real DB (Postgres/MySQL) later if needed.
### Using SQLite right now

1) From project root, run the API:
```bash
cd server
npm install
npm run dev
```
2) The `server/database.sqlite` file is already included and pre-seeded with demo data.
3) Frontend: set `VITE_API_BASE=http://localhost:3001/api` then `npm run dev` in the frontend.


## Teacher CRUD Endpoints (NEW)

- `POST /api/quizzes` *(teacher)* — create quiz
  ```json
  { "topic":"Matter", "subpart":"States of Matter", "dueDate":"2025-12-01", "mode":"Solo" }
  ```
- `POST /api/quizzes/:id/questions` *(teacher)* — add one or many questions
  ```json
  [
    { "type":"multiple-choice","question":"Which is a solid?","options":["Water","Ice","Steam","Cloud"],"answer":"Ice","points":5 }
  ]
  ```
- `PATCH /api/quizzes/:id` *(teacher)* — update quiz
  ```json
  { "topic":"Earth & Space (Updated)" }
  ```
- `DELETE /api/quizzes/:id/questions/:qid` *(teacher)* — delete a question
- `DELETE /api/quizzes/:id` *(teacher)* — delete a quiz (cascades questions)
