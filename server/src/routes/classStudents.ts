// server/src/routes/classStudents.ts
import { Router } from 'express';
import db from '../db';

const router = Router();

/**
 * GET /api/class-students?studentId=...
 * Returns: [{ classId: string, studentId: string, ... }]
 */
router.get('/', async (req, res) => {
  await db.read();
  const { studentId, classId } = req.query as { studentId?: string; classId?: string };

  let items = db.data?.classStudents ?? [];

  if (studentId) {
    items = items.filter((m: any) => String(m.studentId ?? m.userId ?? m.id) === String(studentId));
  }
  if (classId) {
    items = items.filter((m: any) => String(m.classId) === String(classId));
  }

  // Normalize shape
  const normalized = items.map((m: any) => ({
    classId: String(m.classId),
    studentId: String(m.studentId ?? m.userId ?? m.id),
    id: String(m.id ?? `${m.classId}:${m.studentId}`),
    level: m.level ?? 1,
    joinedAt: m.joinedAt ?? null,
  }));

  res.json(normalized);
});

/**
 * (Optional) GET /api/class-students/by-class/:classId
 * Used by ClassDetailScreen
 */
router.get('/by-class/:classId', async (req, res) => {
  await db.read();
  const { classId } = req.params;

  const roster = (db.data?.classStudents ?? []).filter(
    (m: any) => String(m.classId) === String(classId)
  );

  const users = new Map(
    (db.data?.users ?? []).map((u: any) => [String(u.id ?? u.userId ?? u.email), u])
  );

  const enriched = roster.map((m: any) => {
    const key = String(m.studentId ?? m.userId ?? m.id);
    const u = users.get(key) || {};
    return {
      studentId: key,
      membershipId: String(m.id ?? ''),
      name: u.name ?? m.name ?? 'Unknown',
      email: u.email ?? '',
      level: m.level ?? u.level ?? 1,
      streak: m.streak ?? u.streak ?? 0,
      accuracy: (m.accuracy ?? u.accuracy ?? 0) + '%',
      lastActive: m.lastActive ?? u.lastActive ?? 'Today',
      joinedAt: m.joinedAt ?? null,
    };
  });

  // dedupe by studentId
  const seen = new Set<string>();
  const result = enriched.filter(s => !seen.has(s.studentId) && (seen.add(s.studentId), true));

  res.json(result);
});

export default router;
