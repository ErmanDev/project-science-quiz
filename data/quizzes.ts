import { Question } from './teacherQuizQuestions';

export type View = 'main' | 'student' | 'teacher' | 'admin' | 'adminDashboard' | 'forgotPassword' | 'verifyCode' | 'resetPassword' | 'passwordResetSuccess' | 'createAccount' | 'createTeacherAccount' | 'verifyAccount' | 'studentDashboard' | 'teacherDashboard' | 'help' | 'aboutUs' | 'privacyPolicy';
export type DashboardView = 'home' | 'quizzes' | 'rankings' | 'badges' | 'profile' | 'chat';

export interface Quiz {
    id: number;
    topic: string;
    subpart: string;
    questions?: Question[];
    dueDate?: string;
    mode?: 'Solo' | 'Team' | 'Classroom';
}

export interface QuestionResult {
    questionId: number;
    wasCorrect: boolean;
    studentName?: string;
}

export interface DoneQuiz extends Quiz {
    score: string; // e.g., "85/100"
    questionResults?: QuestionResult[];
}

export const newQuizzes: Quiz[] = [
    { 
        id: 1, 
        topic: 'Life Science', 
        subpart: 'Cell Biology',
        mode: 'Solo',
        dueDate: '2024-01-01T23:59', // This date has passed
        questions: [
            {
                id: 1,
                type: 'multiple-choice',
                question: 'What is the powerhouse of the cell?',
                options: ['Nucleus', 'Mitochondrion', 'Ribosome', 'Endoplasmic Reticulum'],
                answer: 'Mitochondrion',
                points: 10,
                // FIX: Changed "Life Science" to "Living Things and Their Environment" to match QuestionCategory type.
                category: 'Living Things and Their Environment',
            },
            {
                id: 3,
                type: 'identification',
                question: 'This planet is known as the Red Planet.',
                answer: 'Mars',
                points: 15,
                // FIX: Changed "Earth and Space Science" to "Earth and Space" to match QuestionCategory type.
                category: 'Earth and Space',
            },
        ] 
    },
    { id: 2, topic: 'Physics', subpart: 'Newtonian Mechanics', questions: [], dueDate: '2029-11-01T17:00', mode: 'Team' },
    { id: 3, topic: 'Chemistry', subpart: 'Periodic Table', questions: [], dueDate: '2029-10-28T09:00', mode: 'Classroom' },
];

export const initialMissedQuizzes: Quiz[] = [
    { id: 4, topic: 'TOPIC', subpart: 'Subpart', dueDate: '2024-10-20T23:59' },
    { id: 5, topic: 'TOPIC', subpart: 'Subpart', dueDate: '2024-10-21T23:59' },
    { id: 6, topic: 'TOPIC', subpart: 'Subpart', dueDate: '2024-10-22T23:59' },
];

export const initialDoneQuizzes: DoneQuiz[] = [
    { 
        id: 7, 
        topic: 'Mathematics', 
        subpart: 'Algebra', 
        score: '1/2',
        questions: [
             {
                id: 101,
                type: 'identification',
                question: 'What is 2 + 2?',
                answer: '4',
                points: 50,
                // FIX: Changed "Life Science" to "Living Things and Their Environment" to match QuestionCategory type.
                category: 'Living Things and Their Environment',
            },
            {
                id: 102,
                type: 'multiple-choice',
                question: 'What is the value of x in x + 5 = 10?',
                options: ['2', '3', '5', '10'],
                answer: '5',
                points: 50,
                // FIX: Changed "Physical Science" to "Matter" to match QuestionCategory type.
                category: 'Matter',
            },
        ]
    },
    { 
        id: 8, 
        topic: 'Computer Science', 
        subpart: 'Algorithms', 
        score: '1/1',
        questions: [
            {
                id: 103,
                type: 'multiple-choice',
                question: 'Which of these is a sorting algorithm?',
                options: ['BFS', 'DFS', 'Quicksort', 'Dijkstra'],
                answer: 'Quicksort',
                points: 20,
                // FIX: Changed "Physical Science" to "Matter" to match QuestionCategory type.
                category: 'Matter',
            }
        ]
    },
];