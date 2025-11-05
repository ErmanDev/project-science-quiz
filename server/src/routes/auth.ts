import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db, { initDB } from '../db';
import type { User } from '../types';
import { signToken } from '../middleware/auth';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    await initDB();
    const { email, name, password, role = 'teacher', classId } = req.body || {};
    if (!email || !name || !password) return res.status(400).json({ error: 'email, name, password required' });

    const exists = db.data!.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
    if (exists) return res.status(409).json({ error: 'Email already used' });

    const now = new Date().toISOString();
    const user: User = {
      id: nanoid(),
      role,
      email,
      name,
      passwordHash: bcrypt.hashSync(password, 10),
      classId,
      createdAt: now,
      updatedAt: now,
    };
    db.data!.users.push(user);
    await db.write();

    const token = signToken({ id: user.id, role: user.role });
    res.status(201).json({ user: { id: user.id, role: user.role, email: user.email, name: user.name, classId: user.classId }, token });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    await initDB();
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = db.data!.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ id: user.id, role: user.role });
    res.json({ user: { id: user.id, role: user.role, email: user.email, name: user.name, classId: user.classId }, token });
  } catch (err) {
    next(err);
  }
});

export default router;
