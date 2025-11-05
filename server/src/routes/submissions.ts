import { Router } from 'express';
import db from '../db';

type Submission = {
  id: string;                 // sub_<ts>
  quizId: string;             // quiz id
  studentId: string;          // user id
  classId?: string | null;    // optional: which class the quiz belonged to
  answers: any[];             // your shape
  score?: number | null;
  percent?: number | null;
  submittedAt: string;        // ISO
  gradedAt?: string | null;
};

const router = Router();

/**
 * GET /api/submissions
 * Optional filters:
 *  - quizId
 *  - studentId
 *  - classId
 */
router.get('/', async (req, res) => {
  try {
    await db.read();
    const { quizId, studentId, classId } = req.query as {
      quizId?: string;
      studentId?: string;
      classId?: string;
    };

    let items: Submission[] = (db.data!.submissions as any) || [];
    if (quizId)   items = items.filter(s => String(s.quizId)   === String(quizId));
    if (studentId)items = items.filter(s => String(s.studentId)=== String(studentId));
    if (classId)  items = items.filter(s => String(s.classId)  === String(classId));

    return res.json(items);
  } catch (e) {
    console.error('[submissions.get] error:', e);
    return res.status(500).json({ error: 'Failed to load submissions' });
  }
});

/** GET /api/submissions/:id */
router.get('/:id', async (req, res) => {
  try {
    await db.read();
    const list: Submission[] = (db.data!.submissions as any) || [];
    const row = list.find(s => String(s.id) === String(req.params.id));
    if (!row) return res.status(404).json({ error: 'Not found' });
    return res.json(row);
  } catch (e) {
    console.error('[submissions.get/:id] error:', e);
    return res.status(500).json({ error: 'Failed to read submission' });
  }
});

/**
 * POST /api/submissions
 * Body: { quizId, studentId, classId?, answers, score?, percent? }
 */
router.post('/', async (req, res) => {
  try {
    await db.read();
    db.data!.submissions ||= [];

    const b = req.body || {};
    if (!b.quizId || !b.studentId) {
      return res.status(400).json({ error: 'quizId and studentId are required' });
    }

    const row: Submission = {
      id: `sub_${Date.now()}`,
      quizId: String(b.quizId),
      studentId: String(b.studentId),
      classId: b.classId ? String(b.classId) : null,
      answers: Array.isArray(b.answers) ? b.answers : [],
      score: typeof b.score === 'number' ? b.score : null,
      percent: typeof b.percent === 'number' ? b.percent : null,
      submittedAt: new Date().toISOString(),
      gradedAt: null,
    };

    (db.data!.submissions as any).push(row);
    await db.write();
    return res.status(201).json(row);
  } catch (e) {
    console.error('[submissions.post] error:', e);
    return res.status(500).json({ error: 'Failed to create submission' });
  }
});

/**
 * PATCH /api/submissions/:id
 * Body: { score?, percent?, gradedAt?, answers? }
 */
router.patch('/:id', async (req, res) => {
  try {
    await db.read();
    const list: Submission[] = (db.data!.submissions as any) || [];
    const idx = list.findIndex(s => String(s.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    const patch = req.body || {};
    const updated = {
      ...list[idx],
      ...patch,
      gradedAt: patch.gradedAt ?? list[idx].gradedAt,
    };
    list[idx] = updated;

    await db.write();
    return res.json(updated);
  } catch (e) {
    console.error('[submissions.patch] error:', e);
    return res.status(500).json({ error: 'Failed to update submission' });
  }
});

/** DELETE /api/submissions/:id */
router.delete('/:id', async (req, res) => {
  try {
    await db.read();
    const list: Submission[] = (db.data!.submissions as any) || [];
    const before = list.length;
    db.data!.submissions = list.filter(s => String(s.id) !== String(req.params.id)) as any;
    await db.write();

    if ((db.data!.submissions as any).length === before) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error('[submissions.delete] error:', e);
    return res.status(500).json({ error: 'Failed to delete submission' });
  }
});

export default router;
