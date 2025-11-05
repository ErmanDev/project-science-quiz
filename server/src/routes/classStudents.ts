import { Router } from 'express';
import db from '../db';

const router = Router();

/**
 * GET /api/class-students
 * Optional filters: classId, studentId
 * Always return 200 with an array (never 404).
 */
router.get('/', async (req, res) => {
  await db.read();
  const { classId, studentId } = req.query;

  let items = db.data!.classStudents || [];
  if (classId)   items = items.filter(r => String(r.classId)   === String(classId));
  if (studentId) items = items.filter(r => String(r.studentId) === String(studentId));

  res.json(items);
});

/**
 * POST /api/class-students
 * Body: { classId: string, studentId: string }
 * Idempotent: if already joined, return 409 with a message.
 */
router.post('/', async (req, res) => {
  await db.read();
  const { classId, studentId } = req.body || {};
  if (!classId || !studentId) {
    return res.status(400).json({ error: 'classId and studentId are required' });
  }

  db.data!.classStudents ||= [];
  const exists = db.data!.classStudents.some(
    r => String(r.classId) === String(classId) && String(r.studentId) === String(studentId)
  );
  if (exists) return res.status(409).json({ error: 'Already joined' });

  const row = {
    id: `clsstu_${Date.now()}`,
    classId: String(classId),
    studentId: String(studentId),
    joinedAt: new Date().toISOString(),
  };
  db.data!.classStudents.push(row);

  // update studentCount on class (optional but nice)
  db.data!.classes ||= [];
  const cls = db.data!.classes.find(c => String(c.id) === String(classId));
  if (cls) {
    const count = db.data!.classStudents.filter(r => String(r.classId) === String(classId)).length;
    cls.studentCount = count;
  }

  await db.write();
  res.status(201).json(row);
});

export default router;
