import { Router } from 'express';
import db from '../db';

const router = Router();

/**
 * GET /api/rankings?classId=cls_123
 * Returns student rankings for a class based on EXP (desc). Includes level and accuracy.
 */
router.get('/', async (req, res) => {
  const classId = String(req.query.classId || '');
  if (!classId) return res.status(400).json({ error: 'classId is required' });

  await db.read();
  const { classStudents = [], users = [] } = db.data!;

  // Find studentIds in the class
  const studentIds = new Set(
    classStudents
      .filter((cs: any) => String(cs.classId) === classId)
      .map((cs: any) => String(cs.studentId))
  );

  // Collect user info for those students
  const students = users
    .filter((u: any) => u.role === 'student' && studentIds.has(String(u.id)))
    .map((u: any) => ({
      id: String(u.id),
      name: String(u.name || 'Student'),
      exp: Number(u.exp || 0),
      level: Number(u.level || 1),
      accuracy: Number(u.accuracy || 0),
    }))
    .sort((a: any, b: any) => b.exp - a.exp)
    .map((s: any, idx: number) => ({ rank: idx + 1, ...s }));

  return res.json({ classId, total: students.length, rankings: students });
});

export default router;

