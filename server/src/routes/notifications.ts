// server/src/routes/notifications.ts
import { Router } from 'express';
import db from '../db';

type Notification = {
  id: string;
  title: string;
  body: string;
  recipientType: 'class' | 'user' | 'all';
  recipientId?: string | null;
  createdAt: string;
  createdBy: string;
  read: boolean;
  quizId?: string | number;
};

const router = Router();

// GET /api/notifications?quizId=...&recipientType=...&recipientId=...
router.get('/', async (req, res) => {
  await db.read();
  const { quizId, recipientType, recipientId } = req.query;
  let items = db.data!.notifications || [];

  if (quizId != null) items = items.filter(n => String(n.quizId) === String(quizId));
  if (recipientType != null) items = items.filter(n => n.recipientType === recipientType);
  if (recipientId !== undefined) items = items.filter(n => String(n.recipientId ?? '') === String(recipientId ?? ''));

  res.json(items);
});

// POST /api/notifications
router.post('/', async (req, res) => {
  await db.read();
  db.data!.notifications ||= [];

  const n: Notification = {
    id: `ntf_${Date.now()}`,
    title: req.body.title,
    body: req.body.body,
    recipientType: req.body.recipientType,
    recipientId: req.body.recipientId ?? null,
    createdAt: req.body.createdAt || new Date().toISOString(),
    createdBy: req.body.createdBy,
    read: !!req.body.read,
    quizId: req.body.quizId,
  };

  db.data!.notifications.push(n);
  await db.write();
  res.status(201).json(n);
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  await db.read();
  const before = db.data!.notifications.length;
  db.data!.notifications = db.data!.notifications.filter(n => n.id !== req.params.id);
  await db.write();

  if (db.data!.notifications.length === before) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json({ ok: true });
});

export default router;
