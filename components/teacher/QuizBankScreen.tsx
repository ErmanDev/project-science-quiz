// components/teacher/QuizBankScreen.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { API_URL } from '../../server/src/config';

import { PencilIcon, TrashIcon } from '../icons';
import EditQuestionModal from './EditQuestionModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import CreateQuizScreen from './CreateQuizScreen';
import SelectQuestionsScreen from './SelectQuestionsScreen';
import QuizDetailModal from './QuizDetailModal';
import PostQuizModal from './PostQuizModal';
import SelectQuestionFromVaultModal from './SelectQuestionFromVaultModal';

import type { ClassData } from './ClassroomScreen';

// ---------- Types ----------
export type QuestionCategory =
  | 'Earth and Space'
  | 'Living Things and Their Environment'
  | 'Matter'
  | 'Force, Motion, and Energy';

export type Question = {
  id: string | number;
  type: 'multiple-choice' | 'identification';
  question: string;
  options?: string[];
  answer: string;
  points: number;
  timeLimit?: number;
  category: QuestionCategory;
  imageUrl?: string;
};

type QuizStatus = 'draft' | 'posted';

export interface TeacherQuiz {
  id: string | number;
  title: string;
  type: 'Card Game' | 'Board Game' | 'Normal';
  mode: 'Solo' | 'Team' | 'Classroom';
  status: QuizStatus;
  teacherId: string;
  questions: Question[];
  classIds?: string[];
  dueDate?: string;
}

interface QuizBankScreenProps {
  classes: ClassData[];
}

// ---------- Small UI bits ----------
const BackIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const CreateQuizIcon: React.FC = () => (
  <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  </div>
);
const QuizVaultIcon: React.FC = () => (
  <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 12h14M5 16h14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 8V6.5A1.5 1.5 0 0 0 13.5 5h-3A1.5 1.5 0 0 0 9 6.5V8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8v5l3-2.5L15 13V8" />
    </svg>
  </div>
);

// ---------- API: quizzes ----------
async function apiGetQuizzes(teacherId: string): Promise<TeacherQuiz[]> {
  const res = await fetch(`${API_URL}/api/quizzes?teacherId=${encodeURIComponent(teacherId)}`);
  if (!res.ok) throw new Error('Failed to load quizzes');
  return res.json();
}
async function apiCreateQuiz(payload: Omit<TeacherQuiz, 'id' | 'status'> & { status?: QuizStatus }) {
  const res = await fetch(`${API_URL}/api/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create quiz');
  return res.json();
}
async function apiPatchQuiz(id: string | number, patch: Partial<TeacherQuiz>) {
  const res = await fetch(`${API_URL}/api/quizzes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Failed to update quiz');
  return res.json();
}
async function apiDeleteQuiz(id: string | number) {
  const res = await fetch(`${API_URL}/api/quizzes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete quiz');
}
async function apiPostQuiz(id: string | number, body: { classIds: string[]; dueDate: string }) {
  const res = await fetch(`${API_URL}/api/quizzes/${id}/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to post quiz');
  return res.json();
}
async function apiUnpostQuiz(id: string | number) {
  const res = await fetch(`${API_URL}/api/quizzes/${id}/unpost`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to unpost quiz');
  return res.json();
}

// ---------- API: notifications ----------
async function createNotification(payload: {
  title: string;
  body: string;
  recipientType: 'class' | 'user' | 'all';
  recipientId?: string | null;
  createdBy: string;
  quizId?: string | number;
}) {
  const res = await fetch(`${API_URL}/api/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      recipientId: payload.recipientId ?? null,
      createdAt: new Date().toISOString(),
      read: false,
    }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Failed to create notification'));
  return res.json();
}

async function deleteNotificationsForQuiz(quizId: string | number) {
  const res = await fetch(`${API_URL}/api/notifications?quizId=${encodeURIComponent(String(quizId))}`);
  if (!res.ok) return;
  const items = await res.json();
  if (!Array.isArray(items)) return;

  await Promise.all(
    items.map((n: any) =>
      fetch(`${API_URL}/api/notifications/${encodeURIComponent(n.id)}`, { method: 'DELETE' })
    )
  );
}

// ---------- API: quiz bank (manual DB) ----------
type BankItemDTO = {
  id: string;
  teacherId: string;
  type: 'multiple-choice' | 'identification';
  category: QuestionCategory;
  question: string;
  options?: string[];
  answer: string;
  points: number;
  timeLimit?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

async function apiGetBank(teacherId: string) {
  const res = await fetch(`${API_URL}/api/quiz-bank?teacherId=${encodeURIComponent(teacherId)}`);
  if (!res.ok) throw new Error('Failed to load quiz bank');
  return res.json() as Promise<BankItemDTO[]>;
}
async function apiCreateBankItem(body: Omit<BankItemDTO, 'id' | 'createdAt' | 'updatedAt'>) {
  const res = await fetch(`${API_URL}/api/quiz-bank`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to create bank item');
  return res.json() as Promise<BankItemDTO>;
}
async function apiUpdateBankItem(id: string, patch: Partial<BankItemDTO>) {
  const res = await fetch(`${API_URL}/api/quiz-bank/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Failed to update bank item');
  return res.json() as Promise<BankItemDTO>;
}
async function apiDeleteBankItem(id: string) {
  const res = await fetch(`${API_URL}/api/quiz-bank/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete bank item');
  return res.json();
}

// ---------- API: classes (helper for fallback lookup) ----------
async function apiGetClassById(id: string) {
  const byId = await fetch(`${API_URL}/api/classes/${encodeURIComponent(id)}`);
  if (byId.ok) return byId.json();

  try {
    const raw = localStorage.getItem('currentUser');
    const me = raw ? JSON.parse(raw) : null;
    const teacherId: string | null = me?.id || me?.email || null;

    const all = await fetch(
      teacherId
        ? `${API_URL}/api/classes?teacherId=${encodeURIComponent(teacherId)}`
        : `${API_URL}/api/classes`
    );
    if (!all.ok) return null;
    const list = await all.json();
    return list.find((c: any) => String(c.id) === String(id)) || null;
  } catch {
    return null;
  }
}

// =======================================
// Component
// =======================================
const QuizBankScreen: React.FC<QuizBankScreenProps> = ({ classes }) => {
  const { t } = useTranslations();

  const [view, setView] = useState<'main' | 'vault' | 'create' | 'selectQuestions'>('main');
  const [activeQuizFilter, setActiveQuizFilter] = useState<'posted' | 'draft'>('draft');

  const [draftQuizzes, setDraftQuizzes] = useState<TeacherQuiz[]>([]);
  const [postedQuizzes, setPostedQuizzes] = useState<TeacherQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Vault (db-backed)
  const [bankItems, setBankItems] = useState<BankItemDTO[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  // quiz dialogs
  const [quizToEdit, setQuizToEdit] = useState<TeacherQuiz | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<TeacherQuiz | null>(null);
  const [quizDetails, setQuizDetails] = useState<TeacherQuiz | null>(null);
  const [quizToPost, setQuizToPost] = useState<TeacherQuiz | null>(null);

  // NORMAL: selector modal
  const [showVaultSelector, setShowVaultSelector] = useState(false);

  const [newQuizConfig, setNewQuizConfig] = useState<{
    name: string;
    mode: 'Solo' | 'Team' | 'Classroom';
    category: 'Card' | 'Board' | 'Normal';
  } | null>(null);

  // teacher context
  const teacher = useMemo(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const teacherId: string | null = teacher?.id || teacher?.email || null;

  // quick class-name map from prop
  const classNameMap = useMemo(() => {
    const m = new Map<string, string>();
    (classes || []).forEach(c => m.set(String(c.id), `${c.name} - ${c.section}`));
    return m;
  }, [classes]);

  async function resolveClassLabel(id: string): Promise<string> {
    const cached = classNameMap.get(String(id));
    if (cached) return cached;
    const cls = await apiGetClassById(String(id));
    if (cls?.name) return `${cls.name} - ${cls.section ?? ''}`.trim();
    return `Class ${id}`;
  }

  // categories for Vault grouping
  const categories: QuestionCategory[] = [
    'Earth and Space',
    'Living Things and Their Environment',
    'Matter',
    'Force, Motion, and Energy',
  ];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'Earth and Space': true });

  // group questions by category/type
  const groupedQuestions = useMemo(() => {
    const initial: Record<QuestionCategory, { 'multiple-choice': Question[]; 'identification': Question[] }> = {
      'Earth and Space': { 'multiple-choice': [], 'identification': [] },
      'Living Things and Their Environment': { 'multiple-choice': [], 'identification': [] },
      'Matter': { 'multiple-choice': [], 'identification': [] },
      'Force, Motion, and Energy': { 'multiple-choice': [], 'identification': [] },
    };
    return questions.reduce((acc, q) => {
      if (acc[q.category]) acc[q.category][q.type].push(q);
      return acc;
    }, initial);
  }, [questions]);

  // load quizzes + bank
  const refreshQuizzes = useCallback(async () => {
    if (!teacherId) {
      setError('Not logged in as teacher.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const [qz, bank] = await Promise.all([apiGetQuizzes(teacherId), apiGetBank(teacherId)]);
      setDraftQuizzes(qz.filter(q => q.status === 'draft'));
      setPostedQuizzes(qz.filter(q => q.status === 'posted'));
      setBankItems(bank);
    } catch (e: any) {
      console.error(e);
      setError('Failed to load quizzes or quiz bank.');
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    refreshQuizzes();
  }, [refreshQuizzes]);

  // map bank -> UI Question
  useEffect(() => {
    const mapped: Question[] = bankItems.map(b => ({
      id: b.id,
      type: b.type,
      question: b.question,
      options: b.type === 'multiple-choice' ? b.options || [] : undefined,
      answer: b.answer,
      points: b.points,
      timeLimit: b.timeLimit,
      category: b.category,
      imageUrl: b.imageUrl,
    }));
    setQuestions(mapped);
  }, [bankItems]);

  // ----- Vault actions (persist to db.json) -----
  const handleAddQuestion = () => {
    setQuestionToEdit({
      id: 0,
      type: 'multiple-choice',
      question: '',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 'Option A',
      points: 10,
      timeLimit: 30,
      category: 'Earth and Space',
    });
  };

  const handleSaveQuestion = async (saved: Question) => {
    try {
      if (!teacherId) throw new Error('Not logged in');

      if (!saved.id || saved.id === 0) {
        const created = await apiCreateBankItem({
          teacherId,
          type: saved.type,
          category: saved.category,
          question: saved.question,
          options: saved.type === 'multiple-choice' ? saved.options || [] : undefined,
          answer: saved.answer,
          points: saved.points,
          timeLimit: saved.timeLimit,
          imageUrl: saved.imageUrl,
        });
        setBankItems(prev => [created, ...prev]);
      } else {
        const updated = await apiUpdateBankItem(String(saved.id), {
          type: saved.type,
          category: saved.category,
          question: saved.question,
          options: saved.type === 'multiple-choice' ? saved.options || [] : undefined,
          answer: saved.answer,
          points: saved.points,
          timeLimit: saved.timeLimit,
          imageUrl: saved.imageUrl,
        });
        setBankItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
      }
    } catch (e) {
      console.error(e);
      setError('Failed to save question.');
    } finally {
      setQuestionToEdit(null);
    }
  };

  const handleConfirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
      await apiDeleteBankItem(String(questionToDelete.id));
      setBankItems(prev => prev.filter(i => i.id !== String(questionToDelete.id)));
    } catch (e) {
      console.error(e);
      setError('Failed to delete question.');
    } finally {
      setQuestionToDelete(null);
    }
  };

  const toggleCategory = (c: QuestionCategory) =>
    setExpanded(prev => ({ ...prev, [c]: !prev[c] }));

  // ----- Quiz CRUD -----
  const handleCreateQuizWithCards = async (
    config: { name: string; mode: 'Solo' | 'Team' | 'Classroom'; category: 'Card' | 'Board' },
    cards: Question[]
  ) => {
    if (!teacherId) return;
    try {
      const created = await apiCreateQuiz({
        title: config.name,
        type: `${config.category} Game` as TeacherQuiz['type'],
        mode: config.mode,
        status: 'draft',
        teacherId,
        questions: cards,
      });
      await refreshQuizzes();
      setActiveQuizFilter('draft');
      setQuizToPost(created as TeacherQuiz);
      setView('main');
    } catch (e: any) {
      setError(e?.message || 'Failed to create quiz');
    }
  };

  // For NORMAL: open vault picker modal and create from its selection
  const handleOpenVaultForNormal = (config: { name: string; mode: 'Solo' | 'Team' | 'Classroom'; category: 'Card' | 'Board' | 'Normal' }) => {
    setNewQuizConfig(config);
    if (config.category === 'Normal') {
      setShowVaultSelector(true);
    } else {
      setView('selectQuestions'); // Card/Board legacy selector
    }
  };

  // Called by modal when teacher confirms selected questions (Normal)
  const handleVaultSelectedForNormal = async (selected: Question[]) => {
    if (!newQuizConfig || !teacherId) return;
    try {
      const created = await apiCreateQuiz({
        title: newQuizConfig.name,
        type: 'Normal',
        mode: newQuizConfig.mode,
        status: 'draft',
        teacherId,
        questions: selected,
      });
      await refreshQuizzes();
      setActiveQuizFilter('draft');
      setShowVaultSelector(false);
      setView('main');
      setNewQuizConfig(null);
      setQuizToPost(created as TeacherQuiz);
    } catch (e: any) {
      setError(e?.message || 'Failed to create quiz');
    }
  };

  // Card/Board legacy path (kept)
  const handleSaveSelectQuestionsQuiz = async (selectedIds: (number | string)[]) => {
    if (!newQuizConfig || !teacherId) return;
    const selected = questions.filter(q => selectedIds.map(String).includes(String(q.id)));
    try {
      const created = await apiCreateQuiz({
        title: newQuizConfig.name,
        type: newQuizConfig.category === 'Normal' ? 'Normal' : (`${newQuizConfig.category} Game` as TeacherQuiz['type']),
        mode: newQuizConfig.mode,
        status: 'draft',
        teacherId,
        questions: selected,
      });
      await refreshQuizzes();
      setActiveQuizFilter('draft');
      setQuizToPost(created as TeacherQuiz);
      setView('main');
    } catch (e: any) {
      setError(e?.message || 'Failed to create quiz');
    }
  };

  // Unified update for all categories (Normal included)
  const handleUpdateQuiz = async (
    updatedData: { name: string; mode: 'Solo' | 'Team' | 'Classroom'; category: 'Card' | 'Board' | 'Normal' },
    cards: Question[]
  ) => {
    if (!quizToEdit) return;
    try {
      await apiPatchQuiz(quizToEdit.id, {
        title: updatedData.name,
        mode: updatedData.mode,
        type: updatedData.category === 'Normal' ? 'Normal' : (`${updatedData.category} Game` as TeacherQuiz['type']),
        questions: cards,
      });
      await refreshQuizzes();
      setQuizToEdit(null);
      setView('main');
    } catch (e: any) {
      setError(e?.message || 'Failed to update quiz');
    }
  };

  const handleConfirmQuizDelete = async () => {
    if (!quizToDelete) return;
    try {
      await apiDeleteQuiz(quizToDelete.id);
      await refreshQuizzes();
      setQuizToDelete(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to delete quiz');
    }
  };

  const handlePostQuiz = async (details: { quizId: number; dueDate: string; classIds: string[] }) => {
    try {
      await apiPostQuiz(details.quizId, { classIds: details.classIds, dueDate: details.dueDate });

      const title =
        (draftQuizzes.find(q => String(q.id) === String(details.quizId)) ||
          postedQuizzes.find(q => String(q.id) === String(details.quizId)))?.title ||
        'New quiz posted';

      const prettyDue = new Date(details.dueDate).toLocaleString();
      const createdBy = teacherId || 'system';

      const labelById = new Map<string, string>();
      await Promise.all(
        details.classIds.map(async (cid) => {
          const label = await resolveClassLabel(String(cid));
          labelById.set(String(cid), label);
        })
      );

      await Promise.all(
        details.classIds.map(classId =>
          createNotification({
            title,
            body: `${title} has been posted for ${labelById.get(String(classId))}.\nDue: ${prettyDue}`,
            recipientType: 'class',
            recipientId: classId,
            createdBy,
            quizId: details.quizId,
          })
        )
      );

      await refreshQuizzes();
      setQuizToPost(null);
      setActiveQuizFilter('posted');
    } catch (e: any) {
      setError(e?.message || 'Failed to post quiz');
    }
  };

  const handleUnpostQuiz = async (quiz: TeacherQuiz) => {
    try {
      await apiUnpostQuiz(quiz.id);
      await deleteNotificationsForQuiz(quiz.id);
      await refreshQuizzes();
      setActiveQuizFilter('draft');
    } catch (e: any) {
      setError(e?.message || 'Failed to unpost quiz');
    }
  };

  // ---------- Views ----------
  if (loading) return <p className="text-center text-gray-400">{t('loading') || 'Loading…'}</p>;
  if (!teacherId) return <p className="text-center text-red-400">Not logged in as teacher.</p>;
  if (error) return <p className="text-center text-red-400">{error}</p>;

  if (view === 'create') {
    return (
      <>
        <CreateQuizScreen
          onBack={() => {
            setView('main');
            setQuizToEdit(null);
          }}
          // For Normal, open Vault modal to fetch from db.json
          onSelectQuestions={(config) => handleOpenVaultForNormal(config)}
          onCreateQuizWithCards={handleCreateQuizWithCards}
          quizToEdit={quizToEdit}
          onUpdateQuiz={handleUpdateQuiz}
          onAddCardToVault={(card) =>
            setQuestionToEdit({
              ...card,
              id: 0,
            })
          }
        />

        {/* NORMAL flow modal */}
        <SelectQuestionFromVaultModal
          isOpen={showVaultSelector}
          onClose={() => setShowVaultSelector(false)}
          gameCategory={newQuizConfig?.category === 'Normal' ? 'Normal' : 'Card'}
          onSelectQuestions={(qs) => handleVaultSelectedForNormal(qs)}
        />
      </>
    );
  }

  if (view === 'selectQuestions') {
    // (kept for Card/Board legacy flow)
    return (
      <SelectQuestionsScreen
        onBack={() => setView('create')}
        onSaveQuiz={handleSaveSelectQuestionsQuiz}
      />
    );
  }

  // Vault UI
  if (view === 'vault') {
    return (
      <div className="relative h-full flex flex-col text-white">
        <div className="flex items-center mb-4 flex-shrink-0">
          <button onClick={() => setView('main')} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back">
            <BackIcon />
          </button>
          <h2 className="text-2xl font-bold ml-2">{t('quizVault')}</h2>
        </div>

        <div className="flex-grow overflow-y-auto hide-scrollbar pr-2 space-y-3">
          {(['Earth and Space', 'Living Things and Their Environment', 'Matter', 'Force, Motion, and Energy'] as QuestionCategory[]).map((cat) => {
            const byType = groupedQuestions[cat];
            if (!byType || (byType['multiple-choice'].length === 0 && byType['identification'].length === 0)) {
              return null;
            }
            return (
              <div key={cat} className="bg-brand-mid-purple/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }))}
                  className="w-full flex justify-between items-center p-3 text-left bg-brand-mid-purple/80"
                >
                  <h3 className="font-bold text-lg text-brand-glow">{cat}</h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 transform transition-transform duration-200 ${!expanded[cat] ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expanded[cat] && (
                  <div className="p-3 space-y-3">
                    {byType['multiple-choice'].length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-300 mb-2 pl-1">Multiple Choice</h4>
                        <div className="space-y-2">
                          {byType['multiple-choice'].map((q) => (
                            <div key={q.id} className="bg-brand-deep-purple/50 p-3 rounded-lg border border-brand-light-purple/30">
                              {q.imageUrl && (
                                <div className="mb-2 rounded-md overflow-hidden h-24 bg-black/20 flex items-center justify-center">
                                  <img src={q.imageUrl} alt="Question" className="max-h-full max-w-full object-contain" />
                                </div>
                              )}
                              <div className="flex justify-between items-start">
                                <div className="flex-grow pr-2">
                                  <p className="text-sm text-gray-200">{q.question}</p>
                                  <p className="text-xs text-brand-glow mt-1">{q.points} points</p>
                                </div>
                                <div className="flex space-x-2 flex-shrink-0">
                                  <button onClick={() => setQuestionToEdit(q)} className="p-1 text-brand-glow hover:text-white transition-colors" aria-label="Edit">
                                    <PencilIcon className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setQuestionToDelete(q)} className="p-1 text-red-500 hover:text-red-400 transition-colors" aria-label="Delete">
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {byType['identification'].length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-300 mb-2 mt-3 pl-1">Identification</h4>
                        <div className="space-y-2">
                          {byType['identification'].map((q) => (
                            <div key={q.id} className="bg-brand-deep-purple/50 p-3 rounded-lg border border-brand-light-purple/30">
                              <div className="flex justify-between items-start">
                                <div className="flex-grow pr-2">
                                  <p className="text-sm text-gray-200">{q.question}</p>
                                  <p className="text-xs text-brand-glow mt-1">{q.points} points</p>
                                </div>
                                <div className="flex space-x-2 flex-shrink-0">
                                  <button onClick={() => setQuestionToEdit(q)} className="p-1 text-brand-glow hover:text-white transition-colors" aria-label="Edit">
                                    <PencilIcon className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setQuestionToDelete(q)} className="p-1 text-red-500 hover:text-red-400 transition-colors" aria-label="Delete">
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleAddQuestion}
          className="absolute bottom-4 right-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-brand-accent rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-glow"
          aria-label="Add Question"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
        </button>

        <EditQuestionModal
          isOpen={!!questionToEdit}
          question={questionToEdit}
          onClose={() => setQuestionToEdit(null)}
          onSave={handleSaveQuestion}
        />
        <DeleteConfirmationModal
          isOpen={!!questionToDelete}
          onClose={() => setQuestionToDelete(null)}
          onConfirm={handleConfirmDeleteQuestion}
          title="Delete Question"
          message="Are you sure you want to delete this question? This action cannot be undone."
        />
      </div>
    );
  }

  // Main list (draft/posted)
  const quizzesToShow = activeQuizFilter === 'posted' ? postedQuizzes : draftQuizzes;

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="space-y-4 flex-shrink-0">
        <button
          onClick={() => setView('create')}
          className="w-full bg-gradient-to-br from-blue-500 to-brand-accent p-4 rounded-2xl flex items-center space-x-4 text-left text-white shadow-lg transition-transform duration-200 hover:scale-105"
        >
          <CreateQuizIcon />
          <div>
            <h3 className="font-bold text-xl">{t('createQuiz')}</h3>
            <p className="text-sm text-gray-200">Craft a new set of questions for your students.</p>
          </div>
        </button>

        <button
          onClick={() => setView('vault')}
          className="w-full bg-gradient-to-br from-brand-light-purple to-brand-mid-purple p-4 rounded-2xl flex items-center space-x-4 text-left text-white shadow-lg transition-transform duration-200 hover:scale-105"
        >
          <QuizVaultIcon />
          <div>
            <h3 className="font-bold text-xl">{t('quizVault')}</h3>
            <p className="text-sm text-gray-200">Manage and view your existing questions.</p>
          </div>
        </button>
      </div>

      <div className="flex justify-center space-x-2 my-1 flex-shrink-0">
        <button
          onClick={() => setActiveQuizFilter('posted')}
          className={`px-10 py-2.5 text-sm font-bold text-white rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-glow/50 ${activeQuizFilter === 'posted' ? 'bg-brand-accent shadow-glow' : 'bg-brand-mid-purple hover:bg-brand-light-purple'}`}
        >
          {t('posted')}
        </button>
        <button
          onClick={() => setActiveQuizFilter('draft')}
          className={`px-10 py-2.5 text-sm font-bold text-white rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-glow/50 ${activeQuizFilter === 'draft' ? 'bg-brand-accent shadow-glow' : 'bg-brand-mid-purple hover:bg-brand-light-purple'}`}
        >
          {t('draft')}
        </button>
      </div>

      <div className="flex-grow overflow-y-auto hide-scrollbar pr-2 space-y-2 pb-1 min-h-0">
        {quizzesToShow.length > 0 ? (
          quizzesToShow.map(quiz => (
            <div
              key={quiz.id}
              onClick={() => setQuizDetails(quiz)}
              className="bg-brand-deep-purple/50 p-3 rounded-lg border border-brand-light-purple/30 flex justify-between items-center transition-colors duration-200 cursor-pointer hover:bg-brand-deep-purple"
            >
              <div>
                <p className="font-semibold text-white">{quiz.title}</p>
                <p className="text-sm text-gray-400">{quiz.type}</p>
              </div>
              <div className="flex space-x-2 items-center">
                {activeQuizFilter === 'posted' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnpostQuiz(quiz);
                    }}
                    className="bg-yellow-500 text-white font-semibold py-1 px-3 rounded-lg text-xs transition-colors duration-200 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75"
                  >
                    {t('unpost')}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuizToPost(quiz);
                      }}
                      className="bg-green-500 text-white font-semibold py-1 px-3 rounded-lg text-xs transition-colors duration-200 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
                    >
                      {t('post')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuizToEdit(quiz);
                        setView('create');
                      }}
                      className="p-1 text-brand-glow hover:text-white transition-colors"
                      aria-label="Edit quiz"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuizToDelete(quiz);
                      }}
                      className="p-1 text-red-500 hover:text-red-400 transition-colors"
                      aria-label="Delete quiz"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 pt-8">{t('noQuizzes')}</p>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={!!quizToDelete}
        onClose={() => setQuizToDelete(null)}
        onConfirm={handleConfirmQuizDelete}
        title="Delete Quiz"
        message="Are you sure you want to delete this draft quiz? This action cannot be undone."
      />

      <QuizDetailModal isOpen={!!quizDetails} quiz={quizDetails} onClose={() => setQuizDetails(null)} />

      <PostQuizModal
        isOpen={!!quizToPost}
        quiz={quizToPost}
        classes={classes}
        onClose={() => setQuizToPost(null)}
        onPost={(payload) => handlePostQuiz(payload)}
      />
    </div>
  );
};

export default QuizBankScreen;
