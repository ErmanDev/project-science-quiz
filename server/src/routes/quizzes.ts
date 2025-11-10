// server/src/routes/quizzes.ts
import { Router } from 'express';
import db from '../db';

const router = Router();

// Normalize DB quiz to a stable shape for clients
const normalize = (q: any) => ({
  id: String(q.id ?? ''),
  title: String(q.title ?? 'Untitled'),
  type: q.type ?? 'Normal',                // 'Card Game' | 'Board Game' | 'Normal'
  mode: q.mode ?? 'Classroom',             // 'Solo' | 'Team' | 'Classroom'
  status: String(q.status ?? 'draft').toLowerCase(), // 'draft' | 'posted'
  teacherId: String(q.teacherId ?? ''),
  questions: Array.isArray(q.questions)
    ? q.questions.map((qq: any) => ({
        id: String(qq.id ?? ''),
        type: qq.type ?? 'multiple-choice',
        category: qq.category ?? undefined,
        question: String(qq.question ?? ''),
        options: Array.isArray(qq.options) ? qq.options : undefined,
        answer: qq.answer ?? undefined,
        points: Number.isFinite(qq.points) ? Number(qq.points) : 1,
        timeLimit: Number.isFinite(qq.timeLimit) ? Number(qq.timeLimit) : undefined,
        imageUrl: qq.imageUrl ?? undefined,
      }))
    : [],
  classIds: Array.isArray(q.classIds) ? q.classIds.map((c: any) => String(c)) : [],
  dueDate: q.dueDate ?? null,
});

// GET /api/quizzes?teacherId=...&status=...&classId=cls1,cls2
router.get('/', async (req, res) => {
  await db.read();
  const { teacherId, status, classId } = req.query as {
    teacherId?: string;
    status?: string;
    classId?: string; // CSV of class ids
  };

  let items = (db.data?.quizzes ?? []).map(normalize);

  if (teacherId) {
    items = items.filter(q => q.teacherId === String(teacherId));
  }
  if (status) {
    items = items.filter(q => q.status === String(status).toLowerCase());
  }
  if (classId) {
    const wanted = String(classId)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (wanted.length) {
      items = items.filter(q =>
        Array.isArray(q.classIds) && q.classIds.some(cid => wanted.includes(String(cid)))
      );
    }
  }

  res.json(items);
});

// GET /api/quizzes/:id  -> return one quiz (with questions)
router.get('/:id', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const list = db.data?.quizzes ?? [];
  const found = list.find((q: any) => String(q.id) === String(id));
  if (!found) return res.status(404).send('Quiz not found');
  return res.json(normalize(found));
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

  list[idx].status = 'draft';
  list[idx].classIds = [];
  list[idx].dueDate = null;

  await db.write();
  res.json(normalize(list[idx]));
});

// DELETE /api/quizzes/:id  <-- add this to enable deletion from the UI
router.delete('/:id', async (req, res) => {
  await db.read();
  const { id } = req.params;

  const list = db.data!.quizzes || [];
  const idx = list.findIndex((x: any) => String(x.id) === String(id));
  if (idx < 0) return res.status(404).send('Quiz not found');

  // Remove the quiz
  const [removed] = list.splice(idx, 1);

  // Optional clean-up: remove notifications linked to this quiz (if you use quizId there)
  if (Array.isArray(db.data!.notifications)) {
    db.data!.notifications = db.data!.notifications.filter((n: any) => String(n.quizId) !== String(id));
  }

  await db.write();
  res.json({ ok: true, deletedId: String(id), quiz: normalize(removed) });
});

export default router;
