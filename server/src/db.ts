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

export async function initDB() {
  await db.read();
  db.data ||= { ...defaultData };

  // ensure all top-level arrays exist (handles old files)
  for (const k of Object.keys(defaultData) as (keyof DBSchema)[]) {
    if (!Array.isArray(db.data[k])) db.data[k] = defaultData[k];
  }

  // First-time write creates the file; subsequent calls are cheap no-ops.
  await db.write();
  console.log('[DB] loaded', DATA_FILE);
}

export default db;
