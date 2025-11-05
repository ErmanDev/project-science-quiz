// server/src/routes/quizBank.ts
import { Router } from 'express';
import db from '../db';
import type { DBSchema, QuizBankItem } from '../types';

const router = Router();
const now = () => new Date().toISOString();

// GET /api/quiz-bank?teacherId=abc (teacherId optional; empty means shared/global)
router.get('/', async (req, res) => {
  await db.read();
  const store = db.data as DBSchema;
  const teacherId = String(req.query.teacherId ?? '');

  const list = (store.quizBank ?? []).filter(item => {
    // show global items (teacherId == '') + this teacher’s own items
    return item.teacherId === '' || (teacherId && item.teacherId === teacherId);
  });

  res.json(list);
});

// POST /api/quiz-bank  (create one item)
router.post('/', async (req, res) => {
  const {
    teacherId = '',
    type,                // 'multiple-choice' | 'identification'
    category,            // one of your 4 categories
    question,
    options,             // only for MC
    answer,
    points = 1,
    timeLimit,
    imageUrl
  } = req.body || {};

  if (!type || !category || !question || !answer) {
    return res.status(400).json({ error: 'type, category, question, answer are required' });
  }
  if (type === 'multiple-choice' && (!Array.isArray(options) || options.length < 2)) {
    return res.status(400).json({ error: 'multiple-choice requires options[] (min 2)' });
  }

  await db.read();
  const store = db.data as DBSchema;
  if (!Array.isArray(store.quizBank)) store.quizBank = [];

  const item: QuizBankItem = {
    id: 'qb_' + Math.random().toString(36).slice(2) + Date.now(),
    teacherId: String(teacherId),
    type,
    category,
    question,
    options: type === 'multiple-choice' ? options : undefined,
    answer: String(answer),
    points: Number(points),
    timeLimit: timeLimit ? Number(timeLimit) : undefined,
    imageUrl: imageUrl || undefined,
    createdAt: now(),
    updatedAt: now(),
  };

  store.quizBank.push(item);
  await db.write();
  res.status(201).json(item);
});

// PATCH /api/quiz-bank/:id (partial update)
router.patch('/:id', async (req, res) => {
  await db.read();
  const store = db.data as DBSchema;
  const idx = (store.quizBank ?? []).findIndex(q => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const prev = store.quizBank[idx];
  const next: QuizBankItem = {
    ...prev,
    ...req.body,
    options: (req.body.type ?? prev.type) === 'multiple-choice'
      ? (Array.isArray(req.body.options) ? req.body.options : prev.options)
      : undefined,
    updatedAt: now(),
  };

  store.quizBank[idx] = next;
  await db.write();
  res.json(next);
});

// DELETE /api/quiz-bank/:id
router.delete('/:id', async (req, res) => {
  await db.read();
  const store = db.data as DBSchema;
  const before = store.quizBank.length;
  store.quizBank = store.quizBank.filter(q => q.id !== req.params.id);
  if (store.quizBank.length === before) return res.status(404).json({ error: 'Not found' });

  await db.write();
  res.json({ ok: true });
});

export default router;
