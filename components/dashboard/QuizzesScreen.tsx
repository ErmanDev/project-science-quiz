// components/dashboard/QuizzesScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { NewQuizIcon, MissedQuizIcon, DoneQuizzesIcon } from '../icons';
import OutlineButton from '../OutlineButton';
import { useTranslations } from '../../hooks/useTranslations';
import { API_URL } from '../../server/src/config';

// ---------- Minimal types ----------
type QuizMode = 'Solo' | 'Team' | 'Classroom';
type QuizType = 'Card Game' | 'Board Game' | 'Normal';

export interface ServerQuiz {
  id: string | number;
  title: string;
  type: QuizType;
  mode: QuizMode;
  status: 'draft' | 'posted';
  teacherId: string;
  questions: Array<{ id: string | number; points: number }>;
  classIds?: string[];
  dueDate?: string;
}

export interface ServerSubmission {
  id: string;
  quizId: string | number;
  studentId: string;
  score: number;
  submittedAt: string;
}

export interface ClientQuizNew {
  id: string | number;
  topic: string;
  subpart: string;
  dueDate?: string;
}

export interface ClientQuizDone extends ClientQuizNew {
  score: string;
}

// ---------- UI ----------
interface FilterButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ icon, label, isActive, onClick }) => {
  const activeClasses = 'bg-gradient-to-r from-blue-500 to-brand-accent';
  const inactiveClasses = 'bg-gray-200 dark:bg-brand-mid-purple/60';
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-24 h-20 rounded-xl space-y-1 transition-all duration-300 ${isActive ? activeClasses : inactiveClasses}`}
    >
      {icon}
      <span className={`text-xs font-semibold ${isActive ? 'text-white' : ''}`}>{label}</span>
    </button>
  );
};

const formatPrettyDue = (iso?: string) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(d);
  } catch {
    return 'Invalid Date';
  }
};

const QuizItem: React.FC<{
  quiz: ClientQuizNew | ClientQuizDone;
  status: 'new' | 'missed' | 'done';
  onTakeQuiz?: (quizId: string | number) => void;
  onViewDetails?: (quiz: ClientQuizDone) => void;
}> = ({ quiz, status, onTakeQuiz, onViewDetails }) => {
  const { t } = useTranslations();

  const take = () => {
    console.log('[QuizItem] Take clicked for quiz:', quiz);
    if (status === 'new' && onTakeQuiz) {
      console.log('[QuizItem] Calling onTakeQuiz with id:', (quiz as any).id);
      onTakeQuiz((quiz as any).id);
    }
  };
  const view = () => {
    if (status === 'done' && onViewDetails) onViewDetails(quiz as ClientQuizDone);
  };

  return (
    <div className="py-3 border-b border-gray-200 dark:border-brand-light-purple/30 last:border-b-0">
      <div className="flex justify-between items-center space-x-4">
        <div>
          <h4 className="font-bold text-lg font-orbitron">{quiz.topic}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{(quiz as any).subpart}</p>
          {status !== 'done' && quiz.dueDate && (
            <p className="text-xs text-red-400 mt-1">
              {t('due') || 'Due'}: {formatPrettyDue(quiz.dueDate)}
            </p>
          )}
        </div>

        {status === 'missed' && (
          <div className="w-24 flex-shrink-0">
            <button className="w-full bg-transparent border border-red-500 text-red-500 font-semibold py-1 px-3 rounded-lg text-sm cursor-default" disabled>
              {t('missed')}
            </button>
          </div>
        )}

        {status === 'done' && (
          <div className="text-right">
            <p className="font-bold text-lg text-brand-glow">{(quiz as ClientQuizDone).score}</p>
            <button onClick={view} className="text-xs text-gray-500 dark:text-gray-400 hover:underline bg-transparent border-none">
              {t('viewDetails')}
            </button>
          </div>
        )}

        {status === 'new' && (
          <div className="w-28 flex-shrink-0">
            <OutlineButton onClick={take}>{t('takeQuiz')}</OutlineButton>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Component ----------
interface QuizzesScreenProps {
  onTakeQuiz: (quizId: string | number) => void;
  onViewDetails: (quiz: ClientQuizDone) => void;
}

const QuizzesScreen: React.FC<QuizzesScreenProps> = ({ onTakeQuiz, onViewDetails }) => {
  const { t } = useTranslations();
  const [activeFilter, setActiveFilter] = useState<'new' | 'missed' | 'done'>('new');

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  const [newQuizzes, setNewQuizzes] = useState<ClientQuizNew[]>([]);
  const [missedQuizzes, setMissedQuizzes] = useState<ClientQuizNew[]>([]);
  const [doneQuizzes, setDoneQuizzes] = useState<ClientQuizDone[]>([]);

  const getCurrentStudent = () => {
    try {
      const raw = localStorage.getItem('currentUser');
      const me = raw ? JSON.parse(raw) : null;
      console.log('[QuizzesScreen] currentUser from localStorage:', me);
      return me;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr('');

        const me = getCurrentStudent();
        if (!me) throw new Error('Please log in.');
        const studentId: string = String(me.id || me.email || me.name || 'student');

        const rosterRes = await fetch(`${API_URL}/api/class-students?studentId=${encodeURIComponent(studentId)}`);
        if (!rosterRes.ok) throw new Error('Failed to load class roster');
        const roster: Array<{ classId: string }> = await rosterRes.json();
        console.log('[QuizzesScreen] roster:', roster);
        const classIds = Array.from(new Set((roster || []).map(r => String(r.classId))));
        console.log('[QuizzesScreen] classIds:', classIds);

        const qRes = await fetch(`${API_URL}/api/quizzes?status=posted&classId=${encodeURIComponent(classIds.join(','))}`);
        if (!qRes.ok) throw new Error('Failed to load quizzes');
        const allPosted: ServerQuiz[] = await qRes.json();
        console.log('[QuizzesScreen] fetched posted quizzes:', allPosted);

        // Additional client-side filtering to ensure:
        // 1. Quiz belongs to at least one class (has non-empty classIds)
        // 2. Student has joined at least one of those classes
        const filteredPosted = allPosted.filter(q => {
          const quizClassIds = Array.isArray(q.classIds) ? q.classIds : [];
          return quizClassIds.length > 0 && 
                 classIds.length > 0 && 
                 quizClassIds.some(cid => classIds.includes(String(cid)));
        });

        const sRes = await fetch(`${API_URL}/api/submissions?studentId=${encodeURIComponent(studentId)}`);
        if (!sRes.ok) throw new Error('Failed to load submissions');
        const submissions: ServerSubmission[] = await sRes.json();
        console.log('[QuizzesScreen] submissions:', submissions);

        const subByQuizId = new Map<string | number, ServerSubmission>();
        submissions.forEach(s => subByQuizId.set(s.quizId, s));

        const now = Date.now();
        const toClient = (q: ServerQuiz): ClientQuizNew => ({
          id: q.id,
          topic: q.title,
          subpart: `${q.mode} • ${q.type}`,
          dueDate: q.dueDate,
        });

        const _new: ClientQuizNew[] = [];
        const _missed: ClientQuizNew[] = [];
        const _done: ClientQuizDone[] = [];

        for (const q of filteredPosted) {
          const sub = subByQuizId.get(q.id);
          if (sub) {
            _done.push({ ...toClient(q), score: `${Math.round(sub.score)}%` });
            continue;
          }
          const dueMs = q.dueDate ? new Date(q.dueDate).getTime() : undefined;
          if (dueMs && dueMs < now) _missed.push(toClient(q));
          else _new.push(toClient(q));
        }

        const byDueDesc = (a: ClientQuizNew, b: ClientQuizNew) =>
          (new Date(b.dueDate || 0).getTime()) - (new Date(a.dueDate || 0).getTime());
        _new.sort(byDueDesc); _missed.sort(byDueDesc);
        _done.sort((a, b) => (new Date(b.dueDate || 0).getTime()) - (new Date(a.dueDate || 0).getTime()));

        setNewQuizzes(_new);
        setMissedQuizzes(_missed);
        setDoneQuizzes(_done);

        console.log('[QuizzesScreen] lists → new/missed/done:', _new, '\n', _missed, '\n', _done);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const list = useMemo(() => {
    switch (activeFilter) {
      case 'missed': return { items: missedQuizzes, status: 'missed' as const };
      case 'done':   return { items: doneQuizzes,   status: 'done'   as const };
      case 'new':
      default:       return { items: newQuizzes,    status: 'new'    as const };
    }
  }, [activeFilter, newQuizzes, missedQuizzes, doneQuizzes]);

  const handleTake = (quizId: string | number) => {
    console.log('[QuizzesScreen] Passing quizId to parent:', quizId);
    onTakeQuiz(quizId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-around">
        <FilterButton icon={<NewQuizIcon isActive={activeFilter === 'new'} />} label={t('newQuiz')} isActive={activeFilter === 'new'} onClick={() => setActiveFilter('new')} />
        <FilterButton icon={<MissedQuizIcon isActive={activeFilter === 'missed'} />} label={t('missedQuiz')} isActive={activeFilter === 'missed'} onClick={() => setActiveFilter('missed')} />
        <FilterButton icon={<DoneQuizzesIcon isActive={activeFilter === 'done'} />} label={t('doneQuizzes')} isActive={activeFilter === 'done'} onClick={() => setActiveFilter('done')} />
      </div>

      <div className="bg-white dark:bg-brand-mid-purple/80 rounded-2xl p-4">
        {loading && <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('loading') || 'Loading…'}</p>}
        {!loading && err && <p className="text-center text-red-400 py-8">{err}</p>}
        {!loading && !err && list.items.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('noQuizzes')}</p>
        )}
        {!loading && !err && list.items.map(q =>
          <QuizItem
            key={q.id}
            quiz={q}
            status={list.status}
            onTakeQuiz={list.status === 'new' ? handleTake : undefined}
            onViewDetails={list.status === 'done' ? onViewDetails : undefined}
          />
        )}
      </div>
    </div>
  );
};

export default QuizzesScreen;
