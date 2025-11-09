// server/src/routes/auth.ts
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import db, { initDB } from '../db';

// If you already add cookieParser() in index.ts, remove the local use below.
const router = Router();

// util: strip hash
function safeUser(u: any) {
  const { passwordHash, ...rest } = u || {};
  return rest;
}

router.use(cookieParser());

router.post('/login', async (req, res) => {
  try {
    await initDB();
    const { email, password, portal } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = (db.data!.users || []).find(
      (u) => u.email?.toLowerCase() === String(email).toLowerCase()
    );

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(String(password), String(user.passwordHash || ''));
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // ✅ Portal guard (optional). Only enforce if the client specifies a portal.
    if (portal === 'student' && user.role !== 'student') {
      return res.status(403).json({ error: 'Only students are allowed to log in.' });
    }
    if (portal === 'teacher' && user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers are allowed to log in.' });
    }

    // issue token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    // send as httpOnly cookie (and in body if you prefer)
    res
      .cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // set true behind HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('[auth/login] error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token').json({ ok: true });
});

export default router;
