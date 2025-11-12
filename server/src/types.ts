export type Role = 'teacher' | 'student' | 'admin';


export interface User {
    id: string; // Student ID or Employee ID from registration (used as primary key)
    role: Role;
    email: string;
    name: string;
    passwordHash: string;
    createdAt: string;
    updatedAt: string;
    level: number;
    exp: number;
    accuracy: number | null;
}

export type QuizQuestionType = 'multiple-choice' | 'true-false' | 'fill-in' | 'matching';

export interface QuizQuestionBase {
    id: string;
    type: QuizQuestionType;
    question: string;
    points: number;
    category?: string;
    timeLimit?: number;
}

export interface MCQuestion extends QuizQuestionBase {
    type: 'multiple-choice';
    options: string[];
    answer: string;
}

export interface TFQuestion extends QuizQuestionBase {
    type: 'true-false';
    answer: boolean;
}

export interface FillInQuestion extends QuizQuestionBase {
    type: 'fill-in';
    answer: string | string[];
}

export interface MatchingQuestion extends QuizQuestionBase {
    type: 'matching';
    pairs: { left: string; right: string }[];
}

export type QuizQuestion = MCQuestion | TFQuestion | FillInQuestion | MatchingQuestion;

export type QuizType = 'board' | 'card';

export interface Quiz {
    id: string;
    topic: string;
    subpart?: string;
    dueDate?: string;
    quizType: QuizType;
    mode?: 'Solo' | 'Team';
    createdBy: string;
    classId?: string;
    questions: QuizQuestion[];
    createdAt: string;
    updatedAt: string;
}

export interface SubmissionAnswer {
    questionId: string;
    answer: string | boolean | string[];
    isCorrect?: boolean;
    pointsEarned?: number;
}

export interface Submission {
    id: string;
    quizId: string;
    studentId: string;
    answers: SubmissionAnswer[];
    totalPoints: number;
    score: number;
    accuracy?: string;
    submittedAt: string;
}

export interface Announcement {
    id: string;
    title: string;
    body: string;
    senderId: string;
    classId?: string;
    date: string;
}

export type QuizBankItem = {
    id: string;
    teacherId: string;
    type: 'multiple-choice' | 'identification';
    category: 'Earth and Space' | 'Living Things and Their Environment' | 'Matter' | 'Force, Motion, and Energy';
    question: string;
    options?: string[];
    answer: string;
    points: number;
    timeLimit?: number;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
};

export type QuizRow = {
    id: string;
    teacherId: string;
    title: string;
    type: 'Card Game' | 'Board Game' | 'Normal';
    mode: 'Solo' | 'Team' | 'Classroom';
    status: 'draft' | 'posted';
    questionIds: string[];
    posted?: { classIds: string[]; dueDate: string };
    createdAt: string;
    updatedAt: string;
};

export type Notification = {
    id: string;
    title: string;
    body: string;
    recipientType: 'class' | 'user' | 'all';
    recipientId?: string | null;
    createdAt: string;
    createdBy: string;
    read: boolean;
    quizId?: string | number; // 👈 add this
};

export type ClassStudent = {
    id: string;        // e.g., `clsstd_...`
    classId: string;
    studentId: string;
    joinedAt: string;
};

export type DBSchema = {
    users: any[];
    quizzes: QuizRow[];
    students: any[];
    messages: any[];
    badges: any[];
    classes: any[];
    submissions: any[];
    quizBank: QuizBankItem[];
    announcements: any[];
    notifications: Notification[];
    classStudents: ClassStudent[];
};

