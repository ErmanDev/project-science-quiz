import { Router } from 'express';
import db from '../db';
import type { DBSchema } from '../types';

const router = Router();

/**
 * GET /api/quizzes?teacherId=...
 * Returns quizzes for a teacher (both draft and posted)
 */
router.get('/', async (req, res) => {
  try {
    const teacherId = String(req.query.teacherId || '').trim();
    if (!teacherId) return res.status(400).json({ error: 'teacherId is required' });

    await db.read();
    const all = db.data!.quizzes || [];
    const quizzes = all.filter(q => q.teacherId === teacherId);
    return res.json(quizzes);
  } catch (err: any) {
    console.error('GET /quizzes error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/quizzes
 * Body: { title, type, mode, teacherId, status?, questions? }
 */
router.post('/', async (req, res) => {
  try {
    const { title, type, mode, teacherId, status, questions } = req.body || {};

    if (!teacherId) return res.status(400).json({ error: 'teacherId is required' });
    if (!title) return res.status(400).json({ error: 'title is required' });
    if (!type) return res.status(400).json({ error: 'type is required' });
    if (!mode) return res.status(400).json({ error: 'mode is required' });

    await db.read();

    const newQuiz = {
      id: `quiz_${Date.now()}`,
      title: String(title),
      type: String(type) as 'Card Game' | 'Board Game' | 'Normal',
      mode: String(mode) as 'Solo' | 'Team' | 'Classroom',
      teacherId: String(teacherId),
      status: (status === 'posted' ? 'posted' : 'draft') as 'draft' | 'posted',
      questions: Array.isArray(questions) ? questions : [],
      // posting metadata optional
      classIds: [],
      dueDate: undefined as string | undefined,
    };

    db.data!.quizzes.push(newQuiz);
    await db.write();

    return res.status(201).json(newQuiz);
  } catch (err: any) {
    console.error('POST /quizzes error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PATCH /api/quizzes/:id
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.read();

    const idx = db.data!.quizzes.findIndex(q => String(q.id) === String(id));
    if (idx < 0) return res.status(404).json({ error: 'Quiz not found' });

    const patch = req.body || {};
    const updated = { ...db.data!.quizzes[idx], ...patch };

    db.data!.quizzes[idx] = updated;
    await db.write();

    return res.json(updated);
  } catch (err: any) {
    console.error('PATCH /quizzes/:id error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/quizzes/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.read();

    const before = db.data!.quizzes.length;
    db.data!.quizzes = db.data!.quizzes.filter(q => String(q.id) !== String(id));
    if (db.data!.quizzes.length === before) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    await db.write();
    return res.status(204).send();
  } catch (err: any) {
    console.error('DELETE /quizzes/:id error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/quizzes/:id/post
 * Body: { classIds: string[], dueDate: string }
 */
router.post('/:id/post', async (req, res) => {
  try {
    const { id } = req.params;
    const { classIds, dueDate } = req.body || {};
    await db.read();

    const quiz = db.data!.quizzes.find(q => String(q.id) === String(id));
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    quiz.status = 'posted';
    quiz.classIds = Array.isArray(classIds) ? classIds : [];
    quiz.dueDate = dueDate ? String(dueDate) : undefined;

    await db.write();
    return res.json(quiz);
  } catch (err: any) {
    console.error('POST /quizzes/:id/post error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/quizzes/:id/unpost
 */
router.post('/:id/unpost', async (req, res) => {
  try {
    const { id } = req.params;
    await db.read();

    const quiz = db.data!.quizzes.find(q => String(q.id) === String(id));
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    quiz.status = 'draft';
    quiz.classIds = [];
    quiz.dueDate = undefined;

    await db.write();
    return res.json(quiz);
  } catch (err: any) {
    console.error('POST /quizzes/:id/unpost error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
