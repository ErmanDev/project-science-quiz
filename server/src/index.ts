// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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
import rankingsRouter from './routes/rankings';
import reportsRouter from './routes/reports';
import badgesRouter from './routes/badges';

const app = express();

// --- CORS (allow multiple dev origins) ---
const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173'];
const envOrigins = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const allowedOrigins = envOrigins.length ? envOrigins : defaultOrigins;

app.use(cors({
  origin(origin, cb) {
    // allow non-browser tools (no origin) and allowed dev origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true, // ✅ allow cookies/authorization headers
}));

// --- parsers ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

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
app.use('/api/rankings', rankingsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/badges', badgesRouter);

// --- global error handler ---
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[ERROR]', err);
  // If it's a CORS error, respond with proper headers
  if (String(err?.message || '').startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// --- bootstrap exactly once ---
const PORT = Number(process.env.PORT || 4000);

initDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`API running on http://localhost:${PORT} — allowedOrigins: ${allowedOrigins.join(', ')}`)
    );
  })
  .catch((err) => {
    console.error('[FATAL] Failed to init DB:', err);
    process.exit(1);
  });

export default app;
