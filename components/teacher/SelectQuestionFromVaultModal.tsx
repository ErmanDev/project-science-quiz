import React, { useEffect, useMemo, useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { API_URL } from '../../server/src/config';

/** ===================== Local Types (match your /api/quiz-bank rows) ===================== */

export type QuestionCategory =
  | 'Earth and Space'
  | 'Living Things and Their Environment'
  | 'Matter'
  | 'Force, Motion, and Energy';

export type BankQuestion = {
  id: string; // id in db.json
  teacherId: string;
  type: 'multiple-choice' | 'identification';
  category: QuestionCategory;
  question: string;
  options?: string[];
  answer: string;
  points: number;
  timeLimit?: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

// UI shape used in this component
export type Question = {
  id: string; // keep string, aligns with db ids
  type: 'multiple-choice' | 'identification';
  category: QuestionCategory;
  question: string;
  options?: string[];
  answer: string;
  points: number;
  timeLimit?: number;
  imageUrl?: string;
};

/** ===================== Small UI Bits ===================== */

const ChevronDownIcon: React.FC<{ isRotated?: boolean }> = ({ isRotated }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-6 w-6 transform transition-transform duration-200 ${isRotated ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const VaultQuestionItem: React.FC<{
  question: Question;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}> = ({ question, isSelected, onToggle, disabled }) => {
  return (
    <div
      onClick={disabled ? undefined : onToggle}
      className={`w-full bg-brand-deep-purple/50 p-3 rounded-lg border text-left transition-colors ${
        disabled
          ? 'border-brand-light-purple/30 opacity-50 cursor-not-allowed'
          : `cursor-pointer ${
              isSelected ? 'border-brand-glow' : 'border-brand-light-purple/30 hover:bg-brand-deep-purple'
            }`
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-grow pr-4">
          {question.imageUrl && (
            <div className="mb-2 rounded-md overflow-hidden h-24 bg-black/20 flex items-center justify-center">
              <img src={question.imageUrl} alt="Question visual aid" className="max-h-full max-w-full object-contain" />
            </div>
          )}
          <p className="text-sm text-gray-200">{question.question}</p>
          <p className="text-xs text-brand-glow mt-1">{question.points} points</p>
        </div>
        <div className="flex-shrink-0 pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            disabled={disabled}
            className="h-5 w-5 rounded border-gray-300 text-brand-accent focus:ring-brand-glow bg-brand-deep-purple/50 accent-brand-accent"
          />
        </div>
      </div>
    </div>
  );
};

/** ===================== Helpers ===================== */

function mapBankToUI(q: BankQuestion): Question {
  return {
    id: q.id,
    type: q.type,
    category: q.category,
    question: q.question,
    options: q.type === 'multiple-choice' ? q.options ?? [] : undefined,
    answer: q.answer,
    points: q.points,
    timeLimit: q.timeLimit,
    imageUrl: q.imageUrl,
  };
}

async function fetchVault(teacherId?: string | null): Promise<Question[]> {
  const url =
    teacherId && String(teacherId).trim()
      ? `${API_URL}/api/quiz-bank?teacherId=${encodeURIComponent(String(teacherId))}`
      : `${API_URL}/api/quiz-bank`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load question bank');
  const rows: BankQuestion[] = await res.json();
  return rows.map(mapBankToUI);
}

/** ===================== Props ===================== */

interface SelectQuestionFromVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestions: (questions: Question[]) => void;
  gameCategory: 'Card' | 'Board' | 'Normal';
}

/** ===================== Component ===================== */

const SelectQuestionFromVaultModal: React.FC<SelectQuestionFromVaultModalProps> = ({
  isOpen,
  onClose,
  onSelectQuestions,
  gameCategory,
}) => {
  const { t } = useTranslations();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // categories used for grouping
  const questionCategories: QuestionCategory[] = [
    'Earth and Space',
    'Living Things and Their Environment',
    'Matter',
    'Force, Motion, and Energy',
  ];
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Earth and Space': true,
  });

  // teacher scope (optional filtering)
  const teacherId: string | null = (() => {
    try {
      const raw = localStorage.getItem('currentUser');
      const u = raw ? JSON.parse(raw) : null;
      return (u?.id && String(u.id)) || (u?.email && String(u.email)) || null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const qs = await fetchVault(teacherId);
        if (!cancelled) {
          setAllQuestions(qs);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Unable to load question bank');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // re-fetch whenever the modal opens or teacher changes
  }, [isOpen, teacherId]);

  const groupedQuestions = useMemo(() => {
    const initial: Record<QuestionCategory, { 'multiple-choice': Question[]; identification: Question[] }> = {
      'Earth and Space': { 'multiple-choice': [], identification: [] },
      'Living Things and Their Environment': { 'multiple-choice': [], identification: [] },
      Matter: { 'multiple-choice': [], identification: [] },
      'Force, Motion, and Energy': { 'multiple-choice': [], identification: [] },
    };
    return allQuestions.reduce((acc, q) => {
      if (acc[q.category]) {
        acc[q.category][q.type].push(q);
      }
      return acc;
    }, initial);
  }, [allQuestions]);

  const toggleCategory = (category: QuestionCategory) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handleToggleQuestion = (id: string) => {
    const q = allQuestions.find((qq) => qq.id === id);
    if (!q) return;

    // rule: Board game cannot take multiple-choice (preserving your logic)
    if (gameCategory === 'Board' && q.type === 'multiple-choice') return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSelected = () => {
    const selected = allQuestions.filter((q) => selectedIds.has(q.id));
    onSelectQuestions(selected);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg h-[80vh] bg-brand-mid-purple rounded-2xl p-6 flex flex-col backdrop-blur-md border border-brand-light-purple/50 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold font-orbitron mb-4 flex-shrink-0">Select Question from Vault</h2>

        {loading ? (
          <div className="flex-grow flex items-center justify-center text-gray-300">{t('loading') || 'Loading…'}</div>
        ) : error ? (
          <div className="flex-grow flex items-center justify-center text-red-400">{error}</div>
        ) : (
          <div className="flex-grow overflow-y-auto hide-scrollbar pr-2 space-y-3">
            {questionCategories.map((category) => {
              const byType = groupedQuestions[category];
              if (!byType || (byType['multiple-choice'].length === 0 && byType['identification'].length === 0)) {
                return null;
              }

              return (
                <div key={category} className="bg-brand-deep-purple/30 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex justify-between items-center p-3 text-left bg-brand-mid-purple/80"
                  >
                    <h3 className="font-bold text-lg text-brand-glow">{category}</h3>
                    <ChevronDownIcon isRotated={!expandedCategories[category]} />
                  </button>

                  {expandedCategories[category] && (
                    <div className="p-3 space-y-3">
                      {byType['multiple-choice'].length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-300 mb-2 pl-1">Multiple Choice</h4>
                          <div className="space-y-2">
                            {byType['multiple-choice'].map((q) => (
                              <VaultQuestionItem
                                key={q.id}
                                question={q}
                                isSelected={selectedIds.has(q.id)}
                                onToggle={() => handleToggleQuestion(q.id)}
                                disabled={gameCategory === 'Board'}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {byType['identification'].length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-300 mb-2 mt-3 pl-1">Identification</h4>
                          <div className="space-y-2">
                            {byType['identification'].map((q) => (
                              <VaultQuestionItem
                                key={q.id}
                                question={q}
                                isSelected={selectedIds.has(q.id)}
                                onToggle={() => handleToggleQuestion(q.id)}
                              />
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
        )}

        <div className="flex-shrink-0 pt-4 mt-4 border-t border-brand-light-purple/30">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-300">{selectedIds.size} selected</p>
            <button
              onClick={handleAddSelected}
              disabled={selectedIds.size === 0 || loading || !!error}
              className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 ease-in-out hover:bg-blue-500 hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-500/50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Add Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectQuestionFromVaultModal;
