// server/src/routes/submissions.ts
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
  progressApplied?: boolean;  // guard to avoid double XP apply
};

const router = Router();

/** ---------- helpers ---------- */
const normalize = (s: string | undefined | null) =>
  String(s ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

function clampPercent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function applyPercentToProgress(
  currentLevel: number | undefined,
  currentExp: number | undefined,
  percent: number
) {
  const baseLevel = Number.isFinite(currentLevel) ? Number(currentLevel) : 1;
  const baseExp   = Number.isFinite(currentExp)   ? Number(currentExp)   : 0;

  // EXP bump equals rounded percent
  const deltaExp = clampPercent(percent);

  let exp   = baseExp + deltaExp;
  let level = baseLevel;
  while (exp >= 100) { level += 1; exp -= 100; }

  const accuracy = clampPercent(percent);
  return { level, exp, accuracy };
}

function computeScoreAndPercentFromQuiz(quiz: any, answers: any[]) {
  if (!quiz || !Array.isArray(quiz.questions)) {
    return { score: 0, percent: 0 };
  }
  const qs = quiz.questions || [];
  let totalPoints = 0;
  let score = 0;

  for (const q of qs) {
    const pts = Number(q.points) || 1;
    totalPoints += pts;

    const a = answers.find((x: any) => String(x.questionId) === String(q.id));
    const studentAnswer = a?.answer ?? '';
    const correct = normalize(studentAnswer) === normalize(q.answer);
    if (correct) score += pts;
  }

  const percent = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  return { score, percent: clampPercent(percent) };
}

/**
 * GET /api/submissions
 * Optional filters: quizId, studentId, classId
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
    if (quizId)    items = items.filter(s => String(s.quizId)    === String(quizId));
    if (studentId) items = items.filter(s => String(s.studentId) === String(studentId));
    if (classId)   items = items.filter(s => String(s.classId)   === String(classId));

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
 * SIDE-EFFECT: applies progress to the student exactly once per (quizId, studentId).
 */
router.post('/', async (req, res) => {
  try {
    await db.read();
    db.data!.submissions ||= [];
    db.data!.users ||= [];

    const b = req.body || {};
    if (!b.quizId || !b.studentId) {
      return res.status(400).json({ error: 'quizId and studentId are required' });
    }

    // Idempotency guard: has this (quizId, studentId) already applied XP?
    const alreadyAwarded = (db.data!.submissions as any[]).some(
      s => String(s.quizId) === String(b.quizId)
        && String(s.studentId) === String(b.studentId)
        && s.progressApplied === true
    );

    // Compute score/percent server-side if not provided
    let score: number | null =
      typeof b.score === 'number' ? Number(b.score) : null;
    let percent: number | null =
      typeof b.percent === 'number' ? Number(b.percent) : null;

    if (score === null || percent === null) {
      const quiz = (db.data!.quizzes || []).find((q: any) => String(q.id) === String(b.quizId));
      const computed = computeScoreAndPercentFromQuiz(quiz, Array.isArray(b.answers) ? b.answers : []);
      if (score === null) score = computed.score;
      if (percent === null) percent = computed.percent;
    }

    const row: Submission = {
      id: `sub_${Date.now()}`,
      quizId: String(b.quizId),
      studentId: String(b.studentId),
      classId: b.classId ? String(b.classId) : null,
      answers: Array.isArray(b.answers) ? b.answers : [],
      score,
      percent,
      submittedAt: new Date().toISOString(),
      gradedAt: null,
      progressApplied: false,
    };

    // Save the submission
    (db.data!.submissions as any).push(row);

    // Apply XP only if not previously awarded for this quiz+student
    if (!alreadyAwarded && Number.isFinite(row.percent)) {
      const users = db.data!.users as any[];
      const uIdx = users.findIndex(u => String(u.id) === String(row.studentId));
      if (uIdx !== -1) {
        const u = users[uIdx];
        const before = { level: u.level, exp: u.exp, accuracy: u.accuracy };
        const next = applyPercentToProgress(u.level, u.exp, Number(row.percent));
        users[uIdx] = {
          ...u,
          level: next.level,
          exp: next.exp,
          accuracy: next.accuracy,
          updatedAt: new Date().toISOString(),
        };
        db.data!.users = users as any;

        // mark this submission as applied
        const subs = db.data!.submissions as any[];
        const sIdx = subs.findIndex((s: any) => String(s.id) === String(row.id));
        if (sIdx !== -1) subs[sIdx] = { ...subs[sIdx], progressApplied: true };
        row.progressApplied = true;

        console.log(
          `[XP] Applied for quiz=${row.quizId} student=${row.studentId}. ` +
          `Before L${before.level}/EXP${before.exp}/Acc${before.accuracy} -> ` +
          `After L${next.level}/EXP${next.exp}/Acc${next.accuracy}`
        );
      } else {
        console.warn('[submissions.post] user not found for studentId:', row.studentId);
      }
    } else if (alreadyAwarded) {
      console.log(
        `[XP] Skipped (already awarded) for quiz=${row.quizId} student=${row.studentId}`
      );
    }

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
 * We DO NOT re-apply EXP here to avoid double counting.
 */
router.patch('/:id', async (req, res) => {
  try {
    await db.read();
    const list: Submission[] = (db.data!.submissions as any) || [];
    const idx = list.findIndex(s => String(s.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    const patch = req.body || {};
    const updated: Submission = {
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
