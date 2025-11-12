import { Router } from 'express';
import db, { initDB } from '../db';
import { nanoid } from 'nanoid';

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
 * POST /api/classes
 * Body: { name, section, teacherId, code? }
 * - Validates teacher exists
 * - Prevents duplicate (name + section) per teacher
 * - Generates id and code if missing
 */
router.post('/', async (req, res) => {
  await initDB();
  const { name, section, teacherId } = req.body || {};
  let { code, id } = req.body || {};

  if (!String(name || '').trim() || !String(section || '').trim() || !String(teacherId || '').trim()) {
    return res.status(400).json({ error: 'name, section and teacherId are required' });
  }

  // ensure teacher exists
  const teacher = (db.data!.users || []).find(
    u => String(u.id) === String(teacherId) || String(u.email) === String(teacherId)
  );
  if (!teacher || teacher.role !== 'teacher') {
    return res.status(400).json({ error: 'Invalid teacherId' });
  }

  // duplicate check (name+section per teacher)
  const classes = db.data!.classes || [];
  const dup = classes.find(
    c =>
      String(c.teacherId) === String(teacherId) &&
      String(c.name || '').trim().toLowerCase() === String(name).trim().toLowerCase() &&
      String(c.section || '').trim().toLowerCase() === String(section).trim().toLowerCase()
  );
  if (dup) {
    return res.status(409).json({ error: 'Class with this name and section already exists for this teacher' });
  }

  // generate id/code if missing
  const genId = () => `cls_${Date.now()}`;
  const genCode = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = '';
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  };
  id = id || genId();
  code = (code && String(code).trim().toUpperCase()) || genCode();

  const newClass = {
    id: String(id),
    name: String(name).trim(),
    section: String(section).trim(),
    code,
    teacherId: String(teacherId),
    studentCount: 0,
  };

  db.data!.classes = classes.concat(newClass);
  await db.write();
  return res.status(201).json(newClass);
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
