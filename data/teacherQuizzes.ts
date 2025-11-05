import { Question } from './teacherQuizQuestions';
import { identificationQuestions } from './teacherQuizQuestions';

export interface TeacherQuiz {
    id: number;
    title: string;
    type: string; // e.g., 'Card Game', 'Board Game'
    status: 'posted' | 'draft';
    mode: 'Solo' | 'Team' | 'Classroom';
    questions?: Question[];
    dueDate?: string;
    postedToClasses?: { id: string; name: string; section: string; }[];
}

export const postedQuizzes: TeacherQuiz[] = [
    {
        id: 1,
        title: 'Quiz #1',
        type: 'Card Game',
        status: 'posted',
        mode: 'Solo',
        dueDate: '2024-10-26T23:59',
        postedToClasses: [{ id: '1', name: 'Grade 7', section: 'Integrity' }],
    },
    {
        id: 2,
        title: 'Quiz #2',
        type: 'Board Game',
        status: 'posted',
        mode: 'Team',
        dueDate: '2024-11-01T17:00',
        postedToClasses: [
            { id: '1', name: 'Grade 7', section: 'Integrity' },
            { id: '2', name: 'Grade 7', section: 'Fortitude' },
        ],
    },
    {
        id: 3,
        title: 'Quiz #3',
        type: 'Normal Game',
        status: 'posted',
        mode: 'Classroom',
        dueDate: '2024-10-28T09:00',
        postedToClasses: [{ id: '2', name: 'Grade 7', section: 'Fortitude' }],
    },
];

export const draftQuizzes: TeacherQuiz[] = [
    {
        id: 4,
        title: 'Quiz #4 - Earth Science',
        type: 'Card Game',
        status: 'draft',
        mode: 'Solo',
        questions: [identificationQuestions[0]],
    },
];