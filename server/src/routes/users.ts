import { Router } from 'express';
import db, { initDB } from '../db';
import type { User } from '../types';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth';


const router = Router();


// List users (admin-only ideally). Here: teacher can list students in their class.
router.get('/', requireAuth, async (req, res) => {
  await initDB();
  const { role, classId } = req.query as { role?: string; classId?: string };

  let users = db.data!.users || [];

  // If classId is provided, resolve the set of studentIds from classStudents, then filter users.
  if (classId) {
    const memberships = (db.data!.classStudents || []).filter(
      (r: any) => String(r.classId) === String(classId)
    );

    // Deduplicate by studentId (keep latest joinedAt if duplicates exist)
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
    const studentIds = new Set(Array.from(latestBy.keys()));

    users = users.filter(u => studentIds.has(String(u.id)));
  }

  if (role) users = users.filter(u => u.role === role);

  // strip passwordHash before sending
  const safe = users.map(({ passwordHash, ...u }) => u);
  res.json(safe);
});


// Create student (teacher action)
router.post('/students', requireAuth, async (req, res) => {
    await initDB();
    const teacher = (req as any).user;
    const { email, name, password, classId } = req.body || {};
    if (!email || !name || !password) return res.status(400).json({ error: 'email, name, password required' });
    const exists = db.data!.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
    if (exists) return res.status(409).json({ error: 'Email already used' });
    const now = new Date().toISOString();
    const student: User = {
        id: nanoid(),
        role: 'student',
        email,
        name,
        passwordHash: bcrypt.hashSync(password, 10),
        classId,
        createdAt: now,
        updatedAt: now,
    };
    db.data!.users.push(student);
    await db.write();
    res.status(201).json({ id: student.id, role: student.role, email: student.email, name: student.name, classId: student.classId });
});


export default router;