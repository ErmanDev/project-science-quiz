// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDB } from './db';

import authRouter from './routes/auth';
import usersRouter from './routes/users';
import quizzesRouter from './routes/quizzes';
import submissionsRouter from './routes/submissions';
import announcementsRouter from './routes/announcements';
import classRoutes from './routes/classes';
import quizBankRoutes from './routes/quizBank';
import notificationsRouter from './routes/notifications';
import classStudentsRouter from './routes/classStudents';

const app = express();

// --- middleware ---
app.use(cors());
app.use(express.json());

// --- health first ---
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- routes (mount each ONCE) ---
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/classes', classRoutes);
app.use('/api/quiz-bank', quizBankRoutes);
app.use('/api/notifications', notificationsRouter);
app.use('/api/class-students', classStudentsRouter);

// --- global error handler ---
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- bootstrap exactly once ---
const PORT = Number(process.env.PORT || 4000);

initDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`API running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('[FATAL] Failed to init DB:', err);
    process.exit(1);
  });

// Optional: export app for testing
export default app;
