// server/src/routes/classStudents.ts
import { Router } from 'express';
import db, { initDB } from '../db';

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
 * POST /api/class-students/join
 * Body: { studentId: string, classCode: string }
 * - Accepts studentId as user id OR email
 * - Finds class by code (case-insensitive)
 * - Creates membership if not already present
 * - Returns { id, classId, studentId, joinedAt }
 */
router.post('/join', async (req, res) => {
  await initDB();
  const { studentId, classCode } = req.body || {};

  const sid = String(studentId || '').trim();
  const code = String(classCode || '').trim().toUpperCase();

  if (!sid || !code) {
    return res.status(400).json({ error: 'studentId and classCode are required' });
  }

  // Resolve student by id or email
  const users = db.data!.users || [];
  const student =
    users.find(u => String(u.id) === sid) ||
    users.find(u => String(u.email).toLowerCase() === sid.toLowerCase());

  if (!student || student.role !== 'student') {
    return res.status(400).json({ error: 'Invalid studentId' });
  }

  // Find class by code (case-insensitive)
  const klass = (db.data!.classes || []).find(c => String(c.code).toUpperCase() === code);
  if (!klass) {
    return res.status(404).json({ error: 'Class not found for provided code' });
  }

  // Prevent duplicate membership
  const memberships = db.data!.classStudents || [];
  const exists = memberships.find(
    (m: any) => String(m.classId) === String(klass.id) &&
      (String(m.studentId) === String(student.id) || String(m.userId) === String(student.id))
  );
  if (exists) {
    return res.status(200).json({
      id: String(exists.id ?? `${klass.id}:${student.id}`),
      classId: String(klass.id),
      studentId: String(student.id),
      joinedAt: exists.joinedAt ?? null,
      alreadyMember: true,
    });
  }

  const membership = {
    id: `clsstu_${Date.now()}`,
    classId: String(klass.id),
    studentId: String(student.id),
    joinedAt: new Date().toISOString(),
  };

  db.data!.classStudents = memberships.concat(membership);
  await db.write();

  return res.status(201).json({
    id: membership.id,
    classId: membership.classId,
    studentId: membership.studentId,
    joinedAt: membership.joinedAt,
  });
});

/**
 * POST /api/class-students
 * Body: { studentId: string, classId?: string, classCode?: string }
 * - Convenience endpoint for clients posting to the base path
 * - Delegates to the same logic as /join
 */
router.post('/', async (req, res) => {
  await initDB();
  const { studentId, classId, classCode } = req.body || {};

  // Resolve class via classId or classCode
  let klass: any = null;
  if (classId) {
    klass = (db.data!.classes || []).find(c => String(c.id) === String(classId));
  } else if (classCode) {
    const code = String(classCode).trim().toUpperCase();
    klass = (db.data!.classes || []).find(c => String(c.code).toUpperCase() === code);
  }
  if (!klass) {
    return res.status(404).json({ error: 'Class not found' });
  }

  // Reuse join logic by crafting a request-like payload
  req.body = { studentId, classCode: klass.code };
  // Call the handler indirectly by duplicating minimal logic (no next() here)

  // Resolve student
  const sid = String(studentId || '').trim();
  if (!sid) return res.status(400).json({ error: 'studentId is required' });
  const users = db.data!.users || [];
  const student =
    users.find(u => String(u.id) === sid) ||
    users.find(u => String(u.email).toLowerCase() === sid.toLowerCase());
  if (!student || student.role !== 'student') {
    return res.status(400).json({ error: 'Invalid studentId' });
  }

  // Prevent duplicate membership
  const memberships = db.data!.classStudents || [];
  const exists = memberships.find(
    (m: any) => String(m.classId) === String(klass.id) &&
      (String(m.studentId) === String(student.id) || String(m.userId) === String(student.id))
  );
  if (exists) {
    return res.status(200).json({
      id: String(exists.id ?? `${klass.id}:${student.id}`),
      classId: String(klass.id),
      studentId: String(student.id),
      joinedAt: exists.joinedAt ?? null,
      alreadyMember: true,
    });
  }

  const membership = {
    id: `clsstu_${Date.now()}`,
    classId: String(klass.id),
    studentId: String(student.id),
    joinedAt: new Date().toISOString(),
  };
  db.data!.classStudents = memberships.concat(membership);
  await db.write();

  return res.status(201).json({
    id: membership.id,
    classId: membership.classId,
    studentId: membership.studentId,
    joinedAt: membership.joinedAt,
  });
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
