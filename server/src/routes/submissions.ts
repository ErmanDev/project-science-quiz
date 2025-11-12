// server/src/routes/submissions.ts
import { Router } from 'express';
import db from '../db';
import { nanoid } from 'nanoid';

const router = Router();

const EXP_PER_LEVEL = 500;

/**
 * Recompute accuracy from all of a student's submissions.
 * Uses per-answer points so we don't depend on missing totalPoints fields.
 */
function recomputeAccuracyForStudent(studentId: string) {
  const subs = (db.data!.submissions || []).filter(
    (s: any) => String(s.studentId) === String(studentId)
  );

  let earnedTotal = 0;
  let possibleTotal = 0;

  for (const s of subs) {
    if (Array.isArray(s.answers) && s.answers.length) {
      for (const a of s.answers) {
        const pts = Number(a?.points || 0);
        possibleTotal += pts;
        if (a?.wasCorrect) earnedTotal += pts;
      }
    } else {
      // Fallback for legacy rows: use score/totalPoints if present
      const score = Number(s.score || 0);
      const total = Number(s.totalPoints || 0);
      earnedTotal += score;
      possibleTotal += total;
    }
  }

  if (possibleTotal <= 0) return 0;
  return Math.round((earnedTotal / possibleTotal) * 100);
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

  // Prevent duplicate submission for (quizId, studentId)
  const dup = db.data!.submissions.find(
    (s: any) => String(s.quizId) === String(quizId) && String(s.studentId) === String(studentId)
  );
  if (dup) {
    return res.status(200).json(dup);
  }

  // Compute total points safely
  let totalPoints = 0;
  if (Array.isArray(answers) && answers.length) {
    totalPoints = answers.reduce((sum: number, a: any) => sum + Number(a?.points || 0), 0);
  } else {
    // fallback to quiz.points sum
    const quiz = (db.data!.quizzes || []).find((q: any) => String(q.id) === String(quizId));
    totalPoints = Array.isArray(quiz?.questions)
      ? quiz.questions.reduce((s: number, q: any) => s + Number(q.points || 0), 0)
      : 0;
  }

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

  // ---- Update user EXP/Level/Accuracy ----
  let expGain = 0;
  let oldLevel = 1;
  let newLevel = 1;
  let oldExp = 0;
  
  db.data!.users = db.data!.users || [];
  const uIdx = db.data!.users.findIndex((u: any) => String(u.id) === String(studentId));
  if (uIdx > -1) {
    const u = { ...db.data!.users[uIdx] };

    // Store old values for comparison
    oldExp = Number(u.exp || 0);
    oldLevel = Number(u.level || 1);

    // Calculate EXP based on quiz percentage
    // Formula: percentage * multiplier (5 EXP per percentage point = max 500 EXP for 100%)
    // This ensures students get more EXP for better performance
    const percentage = Number(saved.percent || 0);
    expGain = Math.round(percentage * 5); // 5 EXP per percentage point (0-500 EXP range)
    u.exp = oldExp + expGain;

    // Level from EXP
    newLevel = Math.floor(Number(u.exp) / EXP_PER_LEVEL) + 1;
    u.level = newLevel;

    // Accuracy recomputed across all submissions
    u.accuracy = recomputeAccuracyForStudent(String(studentId));

    u.updatedAt = new Date().toISOString();
    db.data!.users[uIdx] = u;
  }

  await db.write();
  return res.json({
    ...saved,
    expGain,
    oldLevel,
    newLevel,
    oldExp,
    newExp: oldExp + expGain,
  });
});

export default router;
