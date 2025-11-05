import { Router } from 'express';
import db from '../db';

const router = Router();

// GET /api/announcements?classId=...
router.get('/', async (req, res) => {
  await db.read();
  const { classId } = req.query;
  let list = db.data.announcements || [];
  if (classId) list = list.filter(a => a.classId === String(classId));
  res.json(list);
});

// POST /api/announcements
router.post('/', async (req, res) => {
  await db.read();
  const { title, body, senderId, classId, date } = req.body;
  if (!title || !body || !senderId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const ann = {
    id: `ann_${Date.now()}`,
    title: String(title),
    body: String(body),
    senderId: String(senderId),
    classId: classId ? String(classId) : null,
    date: date ? String(date) : new Date().toISOString(),
  };
  db.data.announcements.push(ann);
  await db.write();
  res.json(ann);
});

// **PATCH /api/announcements/:id**
router.patch('/:id', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const { title, body, date } = req.body;

  const list = db.data.announcements || [];
  const idx = list.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Announcement not found' });

  if (typeof title === 'string') list[idx].title = title;
  if (typeof body === 'string') list[idx].body = body;
  if (typeof date === 'string') list[idx].date = date;

  await db.write();
  res.json(list[idx]);
});

// **DELETE /api/announcements/:id**
router.delete('/:id', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const list = db.data.announcements || [];
  const idx = list.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Announcement not found' });

  const removed = list.splice(idx, 1)[0];
  await db.write();
  res.json(removed);
});

export default router;
