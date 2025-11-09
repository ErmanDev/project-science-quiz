import { Router } from 'express';
import db, { initDB } from '../db';
import type { User } from '../types';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth';
import { applyPercentToProgress } from './progress';

const router = Router();

// ---- Configurable progression rules ----
const DEFAULT_LEVEL = 1;
const DEFAULT_EXP = 0;
const DEFAULT_ACCURACY = 0; // percent, 0..100
const EXP_PER_LEVEL = 100;

function levelFromExp(exp: number) {
  if (!Number.isFinite(exp) || exp < 0) return DEFAULT_LEVEL;
  return Math.floor(exp / EXP_PER_LEVEL) + 1;
}

function clampAccuracy(a: number) {
  if (!Number.isFinite(a)) return DEFAULT_ACCURACY;
  return Math.max(0, Math.min(100, Math.round(a)));
}

/** Ensure a single user has the new gamification fields. */
function ensureUserStats(u: any): boolean {
  let changed = false;
  if (typeof u.exp !== 'number') {
    u.exp = DEFAULT_EXP;
    changed = true;
  }
  if (typeof u.level !== 'number') {
    u.level = levelFromExp(u.exp ?? DEFAULT_EXP);
    changed = true;
  }
  if (typeof u.accuracy !== 'number') {
    u.accuracy = DEFAULT_ACCURACY;
    changed = true;
  } else {
    const bounded = clampAccuracy(u.accuracy);
    if (bounded !== u.accuracy) {
      u.accuracy = bounded;
      changed = true;
    }
  }
  return changed;
}

/** Backfill all existing users with level/exp/accuracy if missing. */
async function migrateUserStatsIfNeeded() {
  await initDB();
  const users = db.data!.users || [];
  let dirty = false;
  for (const u of users) {
    if (ensureUserStats(u)) dirty = true;
  }
  if (dirty) {
    await db.write();
    console.log('[Users] Migrated user stats -> wrote to DB');
  }
}

// ---- OPTIONAL: run a one-time migration on router load (startup) ----
(async () => {
  try {
    await migrateUserStatsIfNeeded();
  } catch (e) {
    console.error('[Users] Startup migration failed:', e);
  }
})();

// List users
router.get('/', requireAuth, async (req, res) => {
  await migrateUserStatsIfNeeded();

  const { role, classId } = req.query as { role?: string; classId?: string };
  let users = db.data!.users || [];

  if (classId) {
    const memberships = (db.data!.classStudents || []).filter(
      (r: any) => String(r.classId) === String(classId)
    );

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

  // Ensure stats present (defensive)
  let dirty = false;
  for (const u of users) {
    if (ensureUserStats(u)) dirty = true;
  }
  if (dirty) await db.write();

  const safe = users.map(({ passwordHash, ...u }) => u);
  res.json(safe);
});

// Get single user
router.get('/:id', requireAuth, async (req, res) => {
  await migrateUserStatsIfNeeded();
  const user = (db.data!.users || []).find(u => String(u.id) === String(req.params.id));
  if (!user) return res.status(404).json({ error: 'Not found' });

  if (ensureUserStats(user)) await db.write();
  const { passwordHash, ...safe } = user as any;
  res.json(safe);
});

router.get('/:id', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const users = db.data?.users || [];
  const u = users.find((x: any) => String(x.id) === String(id));
  if (!u) return res.status(404).json({ error: 'User not found' });

  return res.json({
    id: u.id,
    role: u.role,
    email: u.email,
    name: u.name,
    level: u.level ?? 1,
    xp: u.xp ?? 0,
    accuracy: u.accuracy ?? 0,
  });
});

// Create student
router.post('/students', requireAuth, async (req, res) => {
  await initDB();
  const { email, name, password, classId } = req.body || {};
  if (!email || !name || !password)
    return res.status(400).json({ error: 'email, name, password required' });

  const exists = db.data!.users.find(
    u => u.email.toLowerCase() === String(email).toLowerCase()
  );
  if (exists) return res.status(409).json({ error: 'Email already used' });

  const now = new Date().toISOString();
  const student: User & { level: number; exp: number; accuracy: number } = {
    id: nanoid(),
    role: 'student',
    email,
    name,
    passwordHash: bcrypt.hashSync(password, 10),
    classId,
    createdAt: now,
    updatedAt: now,
    level: DEFAULT_LEVEL,
    exp: DEFAULT_EXP,
    accuracy: DEFAULT_ACCURACY,
  };

  db.data!.users.push(student);
  await db.write();

  const { passwordHash, ...safe } = student as any;
  res.status(201).json(safe);
});

/**
 * Update stats for a user (e.g., after quiz submission).
 * Body:
 *   - addExp? / addXp?  // delta, can be negative
 *   - exp?              // absolute
 *   - correct?, total?  // sets accuracy = (correct/total)*100
 *   - accuracy?         // absolute 0..100
 */
router.patch('/:id/stats', requireAuth, async (req, res) => {
  await initDB();
  const user = (db.data!.users || []).find(u => String(u.id) === String(req.params.id));
  if (!user) return res.status(404).json({ error: 'Not found' });

  let changed = ensureUserStats(user);

  const { addExp, addXp, exp, correct, total, accuracy } = req.body || {};

  if (typeof exp === 'number' && Number.isFinite(exp)) {
    user.exp = Math.max(0, Math.floor(exp));
    changed = true;
  }
  const delta =
    (typeof addExp === 'number' ? addExp : 0) +
    (typeof addXp === 'number' ? addXp : 0);
  if (Number.isFinite(delta) && delta !== 0) {
    user.exp = Math.max(0, Math.floor((user.exp ?? 0) + delta));
    changed = true;
  }

  if (Number.isFinite(correct) && Number.isFinite(total) && total > 0) {
    const acc = (Number(correct) / Number(total)) * 100;
    user.accuracy = clampAccuracy(acc);
    changed = true;
  } else if (Number.isFinite(accuracy)) {
    user.accuracy = clampAccuracy(Number(accuracy));
    changed = true;
  }

  const newLevel = levelFromExp(user.exp ?? 0);
  if (user.level !== newLevel) {
    user.level = newLevel;
    changed = true;
  }

  if (changed) {
    user.updatedAt = new Date().toISOString();
    await db.write();
  }

  const { passwordHash, ...safe } = user as any;
  res.json(safe);
});

router.post('/:id/progress', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const { percent, deltaExp, accuracy } = req.body || {};

  const users = db.data!.users || [];
  const idx = users.findIndex(u => String(u.id) === String(id));
  if (idx === -1) return res.status(404).send('User not found');

  const user = users[idx];
  let next = { ...user };

  if (Number.isFinite(percent)) {
    const p = Number(percent);
    const upd = applyPercentToProgress(next.level, next.exp, p);
    next.level = upd.level;
    next.exp = upd.exp;
    next.accuracy = upd.accuracy;
  } else {
    // direct adjustments (fallback)
    const dExp = Number.isFinite(deltaExp) ? Number(deltaExp) : 0;
    let exp = (Number.isFinite(next.exp) ? Number(next.exp) : 0) + dExp;
    let level = Number.isFinite(next.level) ? Number(next.level) : 1;
    while (exp >= 100) { level += 1; exp -= 100; }
    next.level = level;
    next.exp = exp;
    if (Number.isFinite(accuracy)) {
      next.accuracy = Math.max(0, Math.min(100, Math.round(Number(accuracy))));
    }
  }

  next.updatedAt = new Date().toISOString();
  users[idx] = next;
  db.data!.users = users;
  await db.write();
  res.json(next);
});

export default router;
