// server/src/routes/reports.ts
import { Router } from 'express';
import db from '../db';

const router = Router();

/**
 * GET /api/reports
 * Calculates and returns reports data for teachers:
 * - singleQuizStudentScores: Array of { name, quizNumber, score, classId }
 * - allQuizzesStudentScores: Array of { name, average, classId }
 */
router.get('/', async (req, res) => {
  await db.read();

  try {
    const submissions = db.data!.submissions || [];
    const users = db.data!.users || [];
    const quizzes = db.data!.quizzes || [];
    const classStudents = db.data!.classStudents || [];

    // Create maps for quick lookups
    const userMap = new Map(users.map(u => [String(u.id), u]));
    const quizMap = new Map(quizzes.map(q => [String(q.id), q]));

    // Map studentId to classIds
    const studentToClasses = new Map<string, Set<string>>();
    classStudents.forEach((cs: any) => {
      const sid = String(cs.studentId || cs.userId || cs.id);
      const cid = String(cs.classId);
      if (!studentToClasses.has(sid)) {
        studentToClasses.set(sid, new Set());
      }
      studentToClasses.get(sid)!.add(cid);
    });

    // Calculate single quiz scores
    const singleQuizStudentScores: Array<{
      name: string;
      quizNumber: number | string;
      score: string;
      classId: string;
      avatar?: string | null;
    }> = [];

    submissions.forEach((sub: any) => {
      const studentId = String(sub.studentId);
      const quizId = String(sub.quizId);
      const user = userMap.get(studentId);
      const quiz = quizMap.get(quizId);

      if (!user || !quiz) return;

      const studentName = user.name || studentId;
      const percent = Number(sub.percent || 0);
      const scoreStr = `${percent}%`;
      const avatar = (user as any).avatar || null;

      // Get classIds for this student
      const classIds = studentToClasses.get(studentId) || new Set();

      // If student is in multiple classes, create entries for each class
      if (classIds.size > 0) {
        classIds.forEach(classId => {
          singleQuizStudentScores.push({
            name: studentName,
            quizNumber: quizId,
            score: scoreStr,
            classId: classId,
            avatar: avatar,
          });
        });
      } else {
        // If no class association, still include with empty classId
        singleQuizStudentScores.push({
          name: studentName,
          quizNumber: quizId,
          score: scoreStr,
          classId: '',
          avatar: avatar,
        });
      }
    });

    // Calculate all quizzes average scores per student
    const studentQuizScores = new Map<string, { scores: number[]; classIds: Set<string> }>();

    submissions.forEach((sub: any) => {
      const studentId = String(sub.studentId);
      const user = userMap.get(studentId);
      if (!user) return;

      const percent = Number(sub.percent || 0);
      const classIds = studentToClasses.get(studentId) || new Set();

      if (!studentQuizScores.has(studentId)) {
        studentQuizScores.set(studentId, { scores: [], classIds: new Set() });
      }

      const entry = studentQuizScores.get(studentId)!;
      entry.scores.push(percent);
      classIds.forEach(cid => entry.classIds.add(cid));
    });

    const allQuizzesStudentScores: Array<{
      name: string;
      average: number;
      classId: string;
      avatar?: string | null;
    }> = [];

    studentQuizScores.forEach((data, studentId) => {
      const user = userMap.get(studentId);
      if (!user) return;

      const studentName = user.name || studentId;
      const average = data.scores.length > 0
        ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
        : 0;
      const avatar = (user as any).avatar || null;

      // Create entries for each class the student belongs to
      if (data.classIds.size > 0) {
        data.classIds.forEach(classId => {
          allQuizzesStudentScores.push({
            name: studentName,
            average: Math.round(average * 100) / 100, // Round to 2 decimal places
            classId: classId,
            avatar: avatar,
          });
        });
      } else {
        // If no class association, still include with empty classId
        allQuizzesStudentScores.push({
          name: studentName,
          average: Math.round(average * 100) / 100,
          classId: '',
          avatar: avatar,
        });
      }
    });

    res.json({
      singleQuizStudentScores,
      allQuizzesStudentScores,
    });
  } catch (error: any) {
    console.error('[Reports] Error calculating reports:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate reports' });
  }
});

export default router;


