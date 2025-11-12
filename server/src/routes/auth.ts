// server/src/routes/auth.ts
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { nanoid } from 'nanoid';
import db, { initDB } from '../db';

// If you already add cookieParser() in index.ts, remove the local use below.
const router = Router();

// util: strip hash and ensure xp field for frontend compatibility
function safeUser(u: any) {
  const { passwordHash, ...rest } = u || {};
  // Ensure xp field exists for frontend compatibility (map from exp if needed)
  if (rest.exp !== undefined && rest.xp === undefined) {
    rest.xp = rest.exp;
  }
  return rest;
}

router.use(cookieParser());

const makeToken = (id: string) => `token_${id}_${Date.now()}`;

router.post('/register', async (req, res) => {
  await db.read();
  const { email, name, password, role, studentId, employeeId } = req.body || {};

  if (!email || !name || !password || !role) {
    return res.status(400).json({ error: 'Missing fields.' });
  }
  if (!['student', 'teacher'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  // Get the registration ID based on role
  const registrationId = role === 'student' ? studentId : employeeId;
  if (!registrationId || !String(registrationId).trim()) {
    return res.status(400).json({ error: `${role === 'student' ? 'Student ID' : 'Employee ID'} is required.` });
  }

  const users = db.data!.users || [];
  
  // Check if email already exists
  const emailExists = users.find((u: any) => String(u.email).toLowerCase() === String(email).toLowerCase());
  if (emailExists) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  // Check if registration ID already exists
  const idExists = users.find((u: any) => String(u.id) === String(registrationId));
  if (idExists) {
    return res.status(409).json({ error: `${role === 'student' ? 'Student ID' : 'Employee ID'} already registered.` });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const id = String(registrationId).trim(); // Use registration ID as the primary ID

  const newUser = {
    id,
    role,
    email: String(email),
    name: String(name),
    passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // gamification defaults
    level: 1,
    exp: 0,
    accuracy: 0,
  };

  db.data!.users = users;
  db.data!.users.push(newUser);
  await db.write();

  return res.json({
    token: makeToken(id),
      user: {
        id: newUser.id,
        role: newUser.role,
        email: newUser.email,
        name: newUser.name,
        level: newUser.level,
        exp: newUser.exp,
        xp: newUser.exp, // Also include xp for frontend compatibility
        accuracy: newUser.accuracy,
      },
  });
});

router.post('/login', async (req, res) => {
  try {
    await initDB();
    const { email, password, portal } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Auto-provision default admin user with username/password = "admin"
    // This only triggers when trying to log in as admin/admin.
    if (String(email).toLowerCase() === 'admin' && String(password) === 'admin') {
      const existingAdmin = (db.data!.users || []).find(
        (u) => u.email?.toLowerCase() === 'admin' && u.role === 'admin'
      );
      if (!existingAdmin) {
        const id = nanoid();
        const now = new Date().toISOString();
        const adminUser = {
          id,
          role: 'admin' as const,
          email: 'admin',
          name: 'Administrator',
          passwordHash: bcrypt.hashSync('admin', 10),
          createdAt: now,
          updatedAt: now,
          level: 1,
          exp: 0,
          accuracy: 0,
        };
        db.data!.users = db.data!.users || [];
        db.data!.users.push(adminUser as any);
        await db.write();
      }
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
