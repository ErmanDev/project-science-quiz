import { Router } from 'express';
import db from '../db';

const router = Router();

/**
 * GET /api/classes
 * Supports filters: teacherId, code, id list, etc. (keep what you have)
 * Before returning, compute `studentCount` from db.data.classStudents.
 */
router.get('/', async (req, res) => {
  await db.read();
  const { teacherId, code } = req.query;

  let items = db.data!.classes || [];

  if (teacherId) {
    items = items.filter(c => String(c.teacherId) === String(teacherId));
  }
  if (code) {
    items = items.filter(c => String(c.code).toUpperCase() === String(code).toUpperCase());
  }

  const roster = db.data!.classStudents || [];
  const countMap = new Map<string, number>();
  for (const r of roster) {
    const key = String(r.classId);
    countMap.set(key, (countMap.get(key) || 0) + 1);
  }

  const withCounts = items.map(c => ({
    ...c,
    studentCount: countMap.get(String(c.id)) || 0,
  }));

  res.json(withCounts);
});

/**
 * GET /api/classes/:id
 * Return one class with up-to-date studentCount
 */
router.get('/:id', async (req, res) => {
  await db.read();
  const item = (db.data!.classes || []).find(c => String(c.id) === String(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });

  const count = (db.data!.classStudents || []).filter(r => String(r.classId) === String(item.id)).length;
  res.json({ ...item, studentCount: count });
});

export default router;
