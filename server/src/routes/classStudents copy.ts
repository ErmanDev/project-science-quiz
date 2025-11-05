// server/src/routes/classStudents.ts
import { Router } from 'express';
import db from '../db';

const router = Router();

/**
 * GET /api/class-students/by-class/:classId
 * Returns students *inside the class* enriched with user fields (name, email, …)
 * Reads directly from db.json (users + classStudents). Auth optional here.
 */
router.get('/by-class/:classId', async (req, res) => {
  await db.read();
  const { classId } = req.params;

  const memberships = (db.data!.classStudents || []).filter(
    (r: any) => String(r.classId) === String(classId)
  );

  // Deduplicate by studentId (keep the latest joinedAt)
  const latestBy = new Map<string, any>();
  for (const m of memberships) {
    const prev = latestBy.get(m.studentId);
    if (!prev) latestBy.set(m.studentId, m);
    else {
      const newer =
        new Date(m.joinedAt || 0).getTime() >= new Date(prev.joinedAt || 0).getTime();
      if (newer) latestBy.set(m.studentId, m);
    }
  }

  const users = db.data!.users || [];
  const enriched = Array.from(latestBy.values()).map((m) => {
    const u = users.find((x: any) => String(x.id) === String(m.studentId));
    return {
      studentId: m.studentId,
      membershipId: m.id,
      name: u?.name ?? 'Unknown',
      email: u?.email ?? '',
      // Defaults for your UI; replace with real stats if stored elsewhere in db.json
      level: 1,
      streak: 0,
      accuracy: '0%',
      lastActive: 'Today',
      joinedAt: m.joinedAt,
    };
  });

  res.json(enriched);
});

export default router;
