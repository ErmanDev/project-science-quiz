// server/src/routes/badges.ts
import { Router } from 'express';
import db from '../db';

const router = Router();

// Badge structure definitions (mirrored from frontend data/badges.ts)
interface Badge {
  id: number;
  name: string;
  description: string;
  imgSrc: string;
  progress: number;
  goal: number;
  imageFile?: string;
}

interface BadgeCategory {
  id: string;
  title: string;
  badges: Badge[];
}

// Badge data structure (progress will be calculated dynamically)
const badgeData: BadgeCategory[] = [
  {
    id: 'consistent_performer',
    title: 'Consistent Performer (Top 3 Leaderboard)',
    badges: [
      {
        id: 1,
        name: 'Bronze Challenger',
        description: 'Awarded for placing in the top 3 on any leaderboard (solo or team, quiz or overall) 5 times.',
        imgSrc: 'https://i.imgur.com/yC362h7.png',
        progress: 0,
        goal: 5,
      },
      {
        id: 2,
        name: 'Silver Contender',
        description: 'Awarded for placing in the top 3 on any leaderboard 15 times.',
        imgSrc: 'https://i.imgur.com/P4Q25aJ.png',
        progress: 0,
        goal: 15,
      },
      {
        id: 3,
        name: 'Gold Guardian',
        description: 'Awarded for placing in the top 3 on any leaderboard 30 times.',
        imgSrc: 'https://i.imgur.com/gSnR4g1.png',
        progress: 0,
        goal: 30,
      },
      {
        id: 4,
        name: 'Diamond Dominator',
        description: 'Awarded for placing in the top 3 on any leaderboard 50 times.',
        imgSrc: 'https://i.imgur.com/V9Xm1gD.png',
        progress: 0,
        goal: 50,
      },
    ],
  },
  {
    id: 'apex_achiever',
    title: 'Apex Achiever (Top 1 Leaderboard)',
    badges: [
      {
        id: 5,
        name: 'Bronze Victor',
        description: 'Awarded for placing 1st on any leaderboard (solo or team, quiz or overall) 3 times.',
        imgSrc: 'https://i.imgur.com/aO0VwLi.png',
        progress: 0,
        goal: 3,
      },
      {
        id: 6,
        name: 'Silver Champion',
        description: 'Awarded for placing 1st on any leaderboard 10 times.',
        imgSrc: 'https://i.imgur.com/uPjX5jM.png',
        progress: 0,
        goal: 10,
      },
      {
        id: 7,
        name: 'Gold Conqueror',
        description: 'Awarded for placing 1st on any leaderboard 25 times.',
        imgSrc: 'https://i.imgur.com/0FwZzfY.png',
        progress: 0,
        goal: 25,
      },
      {
        id: 8,
        name: 'Diamond Deity',
        description: 'Awarded for placing 1st on any leaderboard 50 times.',
        imgSrc: 'https://i.imgur.com/sR4aG2b.png',
        progress: 0,
        goal: 50,
      },
    ],
  },
  {
    id: 'quiz_milestone',
    title: 'Quiz Milestone Badges',
    badges: [
      {
        id: 9,
        name: 'First Flight',
        description: 'Awarded for answering your very first quiz question.',
        imgSrc: 'https://i.imgur.com/yC362h7.png',
        progress: 0,
        goal: 1,
      },
      {
        id: 10,
        name: 'Adept Apprentice',
        description: 'Awarded for answering your 5th quiz.',
        imgSrc: 'https://i.imgur.com/P4Q25aJ.png',
        progress: 0,
        goal: 5,
      },
      {
        id: 11,
        name: 'Seasoned Solver',
        description: 'Awarded for answering your 10th quiz.',
        imgSrc: 'https://i.imgur.com/gSnR4g1.png',
        progress: 0,
        goal: 10,
      },
      {
        id: 12,
        name: 'Veteran Voyager',
        description: 'Awarded for answering your 20th quiz.',
        imgSrc: 'https://i.imgur.com/V9Xm1gD.png',
        progress: 0,
        goal: 20,
      },
    ],
  },
  {
    id: 'perfect_score',
    title: 'Perfect Score Badges',
    badges: [
      {
        id: 13,
        name: 'Flawless Start',
        description: 'Awarded for achieving your first perfect score in a quiz.',
        imgSrc: 'https://i.imgur.com/aO0VwLi.png',
        progress: 0,
        goal: 1,
      },
      {
        id: 14,
        name: 'Precision Pundit',
        description: 'Awarded for achieving 5 perfect scores.',
        imgSrc: 'https://i.imgur.com/uPjX5jM.png',
        progress: 0,
        goal: 5,
      },
      {
        id: 15,
        name: 'Immaculate Intellect',
        description: 'Awarded for achieving 10 perfect scores.',
        imgSrc: 'https://i.imgur.com/0FwZzfY.png',
        progress: 0,
        goal: 10,
      },
      {
        id: 16,
        name: 'Zenith Genius',
        description: 'Awarded for achieving 20 perfect scores.',
        imgSrc: 'https://i.imgur.com/sR4aG2b.png',
        progress: 0,
        goal: 20,
      },
    ],
  },
  {
    id: 'speed_responder',
    title: 'Speed Responder Badges',
    badges: [
      {
        id: 17,
        name: 'Swift Spark',
        description: 'Awarded for answering 10 questions correctly within 5 seconds each.',
        imgSrc: 'https://i.imgur.com/yC362h7.png',
        progress: 0,
        goal: 10,
      },
      {
        id: 18,
        name: 'Rapid Reflex',
        description: 'Awarded for answering 50 questions correctly within 10 seconds each.',
        imgSrc: 'https://i.imgur.com/P4Q25aJ.png',
        progress: 0,
        goal: 50,
      },
      {
        id: 19,
        name: 'Calculated Sprint',
        description: 'Awarded for answering 100 questions correctly within 30 seconds each.',
        imgSrc: 'https://i.imgur.com/gSnR4g1.png',
        progress: 0,
        goal: 100,
      },
    ],
  },
];

/**
 * Calculate badge progress for a student based on their achievements
 */
function calculateBadgeProgress(studentId: string) {
  const { submissions = [], users = [], classStudents = [], quizzes = [] } = db.data!;

  // Get student's submissions
  const studentSubmissions = submissions.filter(
    (s: any) => String(s.studentId) === String(studentId)
  );

  // Get student's class IDs
  const studentClassIds = new Set(
    classStudents
      .filter((cs: any) => String(cs.studentId) === String(studentId))
      .map((cs: any) => String(cs.classId))
  );

  // 1. Quiz Milestone Badges (count unique quizzes completed)
  const uniqueQuizzesCompleted = new Set(
    studentSubmissions.map((s: any) => String(s.quizId))
  ).size;

  // 2. Perfect Score Badges (count submissions with 100% score)
  const perfectScores = studentSubmissions.filter(
    (s: any) => Number(s.percent || 0) === 100
  ).length;

  // 3. Top 3 Leaderboard (Consistent Performer)
  // Calculate rankings for each class the student is in
  let top3Count = 0;
  for (const classId of studentClassIds) {
    const classStudentIds = new Set(
      classStudents
        .filter((cs: any) => String(cs.classId) === classId)
        .map((cs: any) => String(cs.studentId))
    );

    // Get all students in this class with their EXP
    const classStudentsData = (users || [])
      .filter((u: any) => u.role === 'student' && classStudentIds.has(String(u.id)))
      .map((u: any) => ({
        id: String(u.id),
        exp: Number(u.exp || 0),
      }))
      .sort((a: any, b: any) => b.exp - a.exp);

    // Find student's rank (1-based)
    const studentRank = classStudentsData.findIndex(
      (s: any) => String(s.id) === String(studentId)
    ) + 1;

    if (studentRank > 0 && studentRank <= 3) {
      top3Count++;
    }
  }

  // Also check quiz-specific rankings (solo mode)
  const quizTop3Count = new Set<string>();
  for (const classId of studentClassIds) {
    const classStudentIds = new Set(
      classStudents
        .filter((cs: any) => String(cs.classId) === classId)
        .map((cs: any) => String(cs.studentId))
    );

    // Group submissions by quiz
    const quizSubmissions = new Map<string, any[]>();
    studentSubmissions.forEach((sub: any) => {
      const quizId = String(sub.quizId);
      if (!quizSubmissions.has(quizId)) {
        quizSubmissions.set(quizId, []);
      }
      quizSubmissions.get(quizId)!.push(sub);
    });

    // For each quiz, check if student is in top 3
    quizSubmissions.forEach((subs, quizId) => {
      // Get all submissions for this quiz from students in the class
      const allQuizSubmissions = (submissions || [])
        .filter(
          (s: any) =>
            String(s.quizId) === quizId &&
            classStudentIds.has(String(s.studentId))
        )
        .map((s: any) => ({
          studentId: String(s.studentId),
          percent: Number(s.percent || 0),
        }))
        .sort((a: any, b: any) => b.percent - a.percent);

      const studentRank = allQuizSubmissions.findIndex(
        (s: any) => String(s.studentId) === String(studentId)
      ) + 1;

      if (studentRank > 0 && studentRank <= 3) {
        quizTop3Count.add(quizId);
      }
    });
  }

  // Total top 3 appearances = overall rankings + quiz-specific rankings
  const totalTop3Count = top3Count + quizTop3Count.size;

  // 4. Top 1 Leaderboard (Apex Achiever)
  let top1Count = 0;
  for (const classId of studentClassIds) {
    const classStudentIds = new Set(
      classStudents
        .filter((cs: any) => String(cs.classId) === classId)
        .map((cs: any) => String(cs.studentId))
    );

    // Overall ranking (EXP-based)
    const classStudentsData = (users || [])
      .filter((u: any) => u.role === 'student' && classStudentIds.has(String(u.id)))
      .map((u: any) => ({
        id: String(u.id),
        exp: Number(u.exp || 0),
      }))
      .sort((a: any, b: any) => b.exp - a.exp);

    const studentRank = classStudentsData.findIndex(
      (s: any) => String(s.id) === String(studentId)
    ) + 1;

    if (studentRank === 1) {
      top1Count++;
    }
  }

  // Quiz-specific top 1
  const quizTop1Count = new Set<string>();
  for (const classId of studentClassIds) {
    const classStudentIds = new Set(
      classStudents
        .filter((cs: any) => String(cs.classId) === classId)
        .map((cs: any) => String(cs.studentId))
    );

    const quizSubmissions = new Map<string, any[]>();
    studentSubmissions.forEach((sub: any) => {
      const quizId = String(sub.quizId);
      if (!quizSubmissions.has(quizId)) {
        quizSubmissions.set(quizId, []);
      }
      quizSubmissions.get(quizId)!.push(sub);
    });

    quizSubmissions.forEach((subs, quizId) => {
      const allQuizSubmissions = (submissions || [])
        .filter(
          (s: any) =>
            String(s.quizId) === quizId &&
            classStudentIds.has(String(s.studentId))
        )
        .map((s: any) => ({
          studentId: String(s.studentId),
          percent: Number(s.percent || 0),
        }))
        .sort((a: any, b: any) => b.percent - a.percent);

      const studentRank = allQuizSubmissions.findIndex(
        (s: any) => String(s.studentId) === String(studentId)
      ) + 1;

      if (studentRank === 1) {
        quizTop1Count.add(quizId);
      }
    });
  }

  const totalTop1Count = top1Count + quizTop1Count.size;

  // 5. Speed Responder Badges
  // Count questions answered correctly within time limits
  // Note: This requires timing data in submissions. For now, we'll use a simplified approach
  // If submissions have timing data, use it; otherwise, we'll need to track this separately
  let fastCorrectAnswers = 0;
  studentSubmissions.forEach((sub: any) => {
    if (Array.isArray(sub.answers)) {
      sub.answers.forEach((answer: any) => {
        // Check if answer was correct and answered quickly
        // Assuming timing data might be in answer.timeSpent or similar
        const timeSpent = Number(answer.timeSpent || 0); // in seconds
        if (answer.wasCorrect) {
          if (timeSpent > 0 && timeSpent <= 5) {
            fastCorrectAnswers++; // Within 5 seconds
          } else if (timeSpent === 0) {
            // If no timing data, we can't accurately calculate this
            // For now, we'll skip it
          }
        }
      });
    }
  });

  // Map badge IDs to their calculated progress
  // Progress should show the actual count, not capped at goal
  const progressMap: Record<number, number> = {
    // Consistent Performer (Top 3) - all use totalTop3Count
    1: totalTop3Count, // Bronze Challenger: goal 5
    2: totalTop3Count, // Silver Contender: goal 15
    3: totalTop3Count, // Gold Guardian: goal 30
    4: totalTop3Count, // Diamond Dominator: goal 50

    // Apex Achiever (Top 1) - all use totalTop1Count
    5: totalTop1Count, // Bronze Victor: goal 3
    6: totalTop1Count, // Silver Champion: goal 10
    7: totalTop1Count, // Gold Conqueror: goal 25
    8: totalTop1Count, // Diamond Deity: goal 50

    // Quiz Milestone - all use uniqueQuizzesCompleted
    9: uniqueQuizzesCompleted, // First Flight: goal 1
    10: uniqueQuizzesCompleted, // Adept Apprentice: goal 5
    11: uniqueQuizzesCompleted, // Seasoned Solver: goal 10
    12: uniqueQuizzesCompleted, // Veteran Voyager: goal 20

    // Perfect Score - all use perfectScores
    13: perfectScores, // Flawless Start: goal 1
    14: perfectScores, // Precision Pundit: goal 5
    15: perfectScores, // Immaculate Intellect: goal 10
    16: perfectScores, // Zenith Genius: goal 20

    // Speed Responder - all use fastCorrectAnswers
    17: fastCorrectAnswers, // Swift Spark: goal 10
    18: fastCorrectAnswers, // Rapid Reflex: goal 50
    19: fastCorrectAnswers, // Calculated Sprint: goal 100
  };

  // Create badge progress with calculated values
  const badgeProgress = badgeData.map((category) => ({
    ...category,
    badges: category.badges.map((badge) => ({
      ...badge,
      progress: progressMap[badge.id] || 0,
    })),
  }));

  return badgeProgress;
}

/**
 * GET /api/badges/:studentId
 * Returns badge progress for a specific student
 */
router.get('/:studentId', async (req, res) => {
  await db.read();
  const { studentId } = req.params;

  if (!studentId) {
    return res.status(400).json({ error: 'studentId is required' });
  }

  try {
    const badgeProgress = calculateBadgeProgress(String(studentId));
    res.json(badgeProgress);
  } catch (error: any) {
    console.error('[Badges] Error calculating badge progress:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate badge progress' });
  }
});

export default router;
