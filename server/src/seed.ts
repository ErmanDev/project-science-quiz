import db, { initDB } from './db';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

async function run() {
  await initDB();

  const teacherId = nanoid();
  const studentId = nanoid();

  db.data!.users = [
    { id: teacherId, role: 'teacher', email: 'teacher@sciquest.app', name: 'Teacher One', passwordHash: bcrypt.hashSync('password123', 10) },
    { id: studentId, role: 'student', email: 'student@sciquest.app', name: 'Student One', passwordHash: bcrypt.hashSync('password123', 10), classId: '1' },
  ];

  db.data!.classes = [
    { id: '1', name: 'Science 5 - Section A' },
    { id: '2', name: 'Science 5 - Section B' }
  ];

  db.data!.students = [
    { id: 1, name: 'Student One', classId: '1', score: 120, average: 92, accuracy: '88%', lastActive: 'Today' },
    { id: 2, name: 'Student Two', classId: '1', score: 110, average: 90, accuracy: '85%', lastActive: 'Yesterday' }
  ];

  db.data!.quizzes = [
    {
      id: 1,
      topic: 'Earth and Space',
      subpart: 'Phases of the Moon',
      dueDate: '2025-11-15',
      mode: 'Solo',
      questions: [
        { id: 1, type: 'multiple-choice', question: 'What causes the phases of the Moon?', options: ['Earth\'s shadow', 'Moon\'s rotation', 'Position of Moon/Earth/Sun', 'Cloud cover'], answer: 'Position of Moon/Earth/Sun', points: 10, category: 'Astronomy', timeLimit: 30 },
        { id: 2, type: 'true-false', question: 'A full moon occurs when the Earth is between the Sun and the Moon.', answer: True, points: 5 }
      ]
    }
  ];

  db.data!.messages = [
    { id: 1, title: 'Welcome to SciQuest', body: 'This is your demo backend. Replace seeds with real data.', sender: 'IT Department', date: 'Oct 31, 2025' }
  ];

  db.data!.badges = [
    { id: 1, name: 'Quick Thinker', description: 'Answered within 5 seconds' },
    { id: 2, name: 'Perfect Score', description: '100% on a quiz' }
  ];

  await db.write();
  console.log('Seeded demo data.');
}

run();