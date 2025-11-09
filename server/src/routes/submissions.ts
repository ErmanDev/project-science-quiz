import { Router } from 'express';
import db from '../db';
import { nanoid } from 'nanoid';

const router = Router();

const XP_PER_LEVEL = 500;

// helper to recompute accuracy (% correct over all answered points)
function recomputeAccuracyForStudent(studentId: string) {
  const submissions = (db.data!.submissions || []).filter((s: any) => String(s.studentId) === String(studentId));
  let totalPoints = 0;
  let earned = 0;
  for (const s of submissions) {
    earned += Number(s.score || 0);
    totalPoints += Number(s.totalPoints || 0);
  }
  const accuracy = totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : 0;
  return accuracy;
}

// GET /api/submissions?studentId=...
router.get('/', async (req, res) => {
  await db.read();
  const { studentId } = req.query as { studentId?: string };
  const list = db.data!.submissions || [];
  if (studentId) {
    return res.json(list.filter((s: any) => String(s.studentId) === String(studentId)));
  }
  return res.json(list);
});

// POST /api/submissions  { quizId, studentId, answers[], score, percent }
router.post('/', async (req, res) => {
  await db.read();
  const { quizId, studentId, answers, score, percent } = req.body || {};
  if (!quizId || !studentId) {
    return res.status(400).json({ error: 'Missing quizId or studentId.' });
  }

  db.data!.submissions = db.data!.submissions || [];

  // prevent duplicate submission for the same (quizId, studentId)
  const dup = db.data!.submissions.find(
    (s: any) => String(s.quizId) === String(quizId) && String(s.studentId) === String(studentId)
  );
  if (dup) {
    return res.status(200).json(dup); // already submitted; return existing
  }

  // compute total points from the quiz definition
  const quiz = (db.data!.quizzes || []).find((q: any) => String(q.id) === String(quizId));
  const totalPoints = Array.isArray(quiz?.questions)
    ? quiz.questions.reduce((s: number, q: any) => s + Number(q.points || 0), 0)
    : 0;

  const saved = {
    id: nanoid(),
    quizId: String(quizId),
    studentId: String(studentId),
    answers: Array.isArray(answers) ? answers : [],
    score: Number(score || 0),
    percent: Number(percent || 0),
    totalPoints,
    submittedAt: new Date().toISOString(),
  };
  db.data!.submissions.push(saved);

  // ---- Update user XP/Level/Accuracy ----
  db.data!.users = db.data!.users || [];
  const uIdx = db.data!.users.findIndex((u: any) => String(u.id) === String(studentId));
  if (uIdx > -1) {
    const u = { ...db.data!.users[uIdx] };

    // XP: simple rule = score * 10 (adjust to your liking)
    const xpGain = Number(saved.score || 0) * 10;
    u.xp = Number(u.xp || 0) + xpGain;

    // Level from XP
    u.level = Math.floor(Number(u.xp) / XP_PER_LEVEL) + 1;

    // Accuracy across all submissions
    u.accuracy = recomputeAccuracyForStudent(String(studentId));

    u.updatedAt = new Date().toISOString();
    db.data!.users[uIdx] = u;
  }

  await db.write();
  return res.json(saved);
});

export default router;
