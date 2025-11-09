// server/src/routes/quizzes.ts
import { Router } from 'express';
import db from '../db';

const router = Router();

// Normalize helper
const normalize = (q: any) => ({
  id: String(q.id ?? ''),
  title: String(q.title ?? 'Untitled'),
  type: q.type ?? 'Normal',
  mode: q.mode ?? 'Classroom',
  status: String(q.status ?? 'draft').toLowerCase(), // 'draft' | 'posted'
  teacherId: String(q.teacherId ?? ''),
  questions: Array.isArray(q.questions)
    ? q.questions.map((qq: any) => ({
        id: String(qq.id ?? ''),
        points: Number.isFinite(qq.points) ? qq.points : 1,
      }))
    : [],
  classIds: Array.isArray(q.classIds) ? q.classIds.map((c: any) => String(c)) : [],
  dueDate: q.dueDate ?? null,
});

// GET /api/quizzes?teacherId=...&status=...
router.get('/', async (req, res) => {
  await db.read();
  const { teacherId, status } = req.query as { teacherId?: string; status?: string };
  let items = (db.data?.quizzes ?? []).map(normalize);
  if (teacherId) items = items.filter(q => q.teacherId === String(teacherId));
  if (status) items = items.filter(q => q.status === String(status).toLowerCase());
  res.json(items);
});

// POST /api/quizzes  (create)
router.post('/', async (req, res) => {
  await db.read();
  const q = req.body ?? {};
  const id = q.id ?? Date.now().toString();
  const newQ = {
    id,
    title: q.title ?? 'Untitled',
    type: q.type ?? 'Normal',
    mode: q.mode ?? 'Classroom',
    status: (q.status ?? 'draft').toLowerCase(),
    teacherId: String(q.teacherId ?? ''),
    questions: Array.isArray(q.questions) ? q.questions : [],
    classIds: Array.isArray(q.classIds) ? q.classIds : [],
    dueDate: q.dueDate ?? null,
  };
  db.data!.quizzes = db.data!.quizzes || [];
  db.data!.quizzes.push(newQ);
  await db.write();
  res.json(normalize(newQ));
});

// PATCH /api/quizzes/:id
router.patch('/:id', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const list = db.data!.quizzes || [];
  const idx = list.findIndex((x: any) => String(x.id) === String(id));
  if (idx < 0) return res.status(404).send('Quiz not found');

  const patch = req.body ?? {};
  const updated = { ...list[idx], ...patch };
  list[idx] = updated;
  await db.write();
  res.json(normalize(updated));
});

// POST /api/quizzes/:id/post
router.post('/:id/post', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const { classIds, dueDate } = req.body || {};
  const list = db.data!.quizzes || [];
  const idx = list.findIndex((x: any) => String(x.id) === String(id));
  if (idx < 0) return res.status(404).send('Quiz not found');

  list[idx].status = 'posted';
  list[idx].classIds = Array.isArray(classIds) ? classIds.map(String) : [];
  list[idx].dueDate = dueDate ?? null;

  await db.write();
  res.json(normalize(list[idx]));
});

// POST /api/quizzes/:id/unpost
router.post('/:id/unpost', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const list = db.data!.quizzes || [];
  const idx = list.findIndex((x: any) => String(x.id) === String(id));
  if (idx < 0) return res.status(404).send('Quiz not found');

  // flip back to draft & clear assignment
  list[idx].status = 'draft';
  list[idx].classIds = [];
  list[idx].dueDate = null;

  await db.write();
  res.json(normalize(list[idx]));
});

export default router;
