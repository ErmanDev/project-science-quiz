import { Router } from 'express';
import db from '../db';

const router = Router();

// GET /api/announcements?classId=...&studentId=...
// - If classId is provided => filter announcements for that class
// - If studentId is provided => returns announcements for all classes the student is a member of
// - If both are provided => intersection (i.e., announcements for that class only, still validating membership list)
router.get('/', async (req, res) => {
  await db.read();
  const { classId, studentId } = req.query as { classId?: string; studentId?: string };

  let list = db.data.announcements || [];

  // Filter by classId first if supplied
  if (classId) list = list.filter(a => String(a.classId) === String(classId));

  // If studentId is supplied, narrow to classes they belong to
  if (studentId) {
    const memberships = (db.data.classStudents || []).filter(
      (m: any) =>
        String(m.studentId ?? m.userId ?? m.id) === String(studentId)
    );
    const classIds = new Set(memberships.map((m: any) => String(m.classId)));
    list = list.filter(a => a.classId && classIds.has(String(a.classId)));
  }

  // Newest first
  list.sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

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
