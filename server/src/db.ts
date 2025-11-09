// server/src/db.ts
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import fs from 'fs';

// ✅ Always resolve from this file’s directory -> .../server/data/db.json
export const DATA_DIR = path.resolve(__dirname, '..', 'data');
export const DATA_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export type DBSchema = {
  users: any[];
  quizzes: any[];
  students: any[];
  messages: any[];
  badges: any[];
  classes: any[];
  submissions: any[];
  quizBank: any[];
  announcements: any[];
  notifications: any[];
  classStudents: any[]; // ✅ you were missing this in the type
};

const defaultData: DBSchema = {
  users: [],
  quizzes: [],
  students: [],
  messages: [],
  badges: [],
  classes: [],
  submissions: [],
  quizBank: [],
  announcements: [],
  notifications: [],
  classStudents: [],
};

const adapter = new JSONFile<DBSchema>(DATA_FILE);
const db = new Low<DBSchema>(adapter, defaultData);

// --- Gamification defaults / helpers (shared with users route) ---
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

export async function initDB() {
  await db.read();
  db.data ||= { ...defaultData };

  // ensure all top-level arrays exist (handles old files)
  for (const k of Object.keys(defaultData) as (keyof DBSchema)[]) {
    if (!Array.isArray(db.data[k])) db.data[k] = defaultData[k];
  }

  // ✅ Startup migration: backfill existing users with level/exp/accuracy
  let dirty = false;
  for (const u of db.data.users) {
    if (ensureUserStats(u)) dirty = true;
  }
  if (dirty) {
    await db.write();
    console.log('[DB] migrated users with level/exp/accuracy →', DATA_FILE);
  } else {
    // First-time write creates the file; subsequent calls are cheap no-ops.
    await db.write();
  }

  console.log('[DB] loaded', DATA_FILE);
}

export default db;
