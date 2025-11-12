import { Router } from 'express';
import db, { initDB } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/messages
 * Query:
 *  - classId?: string            → filter by a single class
 *  - studentId?: string          → fetch messages for all classes a student belongs to
 *  - includeAnnouncements?=1     → also include class announcements as message-like items
 */
router.get('/', requireAuth, async (req, res) => {
  await initDB();
  const { classId, studentId, includeAnnouncements } = req.query as {
    classId?: string;
    studentId?: string;
    includeAnnouncements?: string;
  };

  let messages = db.data!.messages || [];

  // filter by classId if provided
  if (classId) {
    messages = messages.filter((m: any) => String(m.classId) === String(classId));
  }

  // If studentId provided, limit to student's classes
  if (studentId) {
    const memberships = (db.data!.classStudents || []).filter(
      (m: any) =>
        String(m.studentId ?? m.userId ?? m.id) === String(studentId)
    );
    const classIds = new Set(memberships.map((m: any) => String(m.classId)));
    messages = messages.filter((m: any) => classIds.has(String(m.classId)));

    // Optionally include announcements as "message" items for student classes
    if (includeAnnouncements === '1' || includeAnnouncements === 'true') {
      const anns = (db.data!.announcements || []).filter((a: any) =>
        a.classId && classIds.has(String(a.classId))
      );
      const users = new Map((db.data!.users || []).map((u: any) => [String(u.id), u]));
      const annAsMsg = anns.map(a => ({
        id: a.id,
        classId: a.classId,
        title: a.title,
        text: a.body,
        senderId: a.senderId,
        senderName: users.get(String(a.senderId))?.name || 'Teacher',
        createdAt: a.date || new Date().toISOString(),
        type: 'announcement',
      }));
      messages = messages.concat(annAsMsg);
    }
  }

  // Newest first
  messages.sort(
    (a: any, b: any) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  res.json(messages);
});

/**
 * POST /api/messages
 * Body: { classId: string, text: string, senderId: string, title?: string }
 */
router.post('/', requireAuth, async (req, res) => {
  await initDB();
  const { classId, text, senderId, title } = req.body || {};
  if (!classId || !text || !senderId) {
    return res.status(400).json({ error: 'classId, text, senderId required' });
  }

  const msg = {
    id: `msg_${Date.now()}`,
    classId: String(classId),
    text: String(text),
    title: typeof title === 'string' ? String(title) : undefined,
    senderId: String(senderId),
    createdAt: new Date().toISOString(),
  };
  db.data!.messages = (db.data!.messages || []).concat(msg);
  await db.write();
  res.status(201).json(msg);
});

export default router;