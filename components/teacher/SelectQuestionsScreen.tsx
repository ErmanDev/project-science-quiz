import React, { useMemo, useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import SelectQuestionFromVaultModal, {
  Question as VaultQuestion,
} from './SelectQuestionFromVaultModal';

type Mode = 'Solo' | 'Team' | 'Classroom';
type GameCategory = 'Card' | 'Board' | 'Normal';

interface Props {
  onBack: () => void;

  // For Card/Board legacy flow: you might still support a manual card builder elsewhere
  onCreateQuizWithCards: (
    config: { name: string; mode: Mode; category: 'Card' | 'Board' },
    cards: VaultQuestion[]
  ) => Promise<void> | void;

  // NEW: Create a Normal quiz from Vault questions
  onCreateNormal: (
    config: { name: string; mode: Mode },
    questions: VaultQuestion[]
  ) => Promise<void> | void;

  // When editing an existing quiz (optional)
  quizToEdit?: {
    id: string | number;
    title: string;
    mode: Mode;
    type: 'Card Game' | 'Board Game' | 'Normal';
    questions: VaultQuestion[];
  } | null;
  onUpdateQuiz?: (
    updated: { name: string; mode: Mode; category: GameCategory },
    cards: VaultQuestion[]
  ) => Promise<void> | void;

  // Optional hook to add a single card into vault (kept from your previous API)
  onAddCardToVault?: (card: VaultQuestion) => void;
}

const CreateQuizScreen: React.FC<Props> = ({
  onBack,
  onCreateQuizWithCards,
  onCreateNormal,
  quizToEdit,
  onUpdateQuiz,
  onAddCardToVault,
}) => {
  const { t } = useTranslations();

  const initial = useMemo(() => {
    if (!quizToEdit) return { name: '', mode: 'Classroom' as Mode, category: 'Normal' as GameCategory };
    const cat: GameCategory =
      quizToEdit.type === 'Card Game' ? 'Card' : quizToEdit.type === 'Board Game' ? 'Board' : 'Normal';
    return { name: quizToEdit.title, mode: quizToEdit.mode, category: cat };
  }, [quizToEdit]);

  const [name, setName] = useState(initial.name);
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [category, setCategory] = useState<GameCategory>(initial.category);

  // Vault selection (for Normal)
  const [vaultOpen, setVaultOpen] = useState(false);
  const [selectedFromVault, setSelectedFromVault] = useState<VaultQuestion[]>(
    quizToEdit && initial.category === 'Normal' ? quizToEdit.questions : []
  );

  const canSave = name.trim().length > 0 && (category !== 'Normal' || selectedFromVault.length > 0);

  const handleSave = async () => {
    if (category === 'Normal') {
      await onCreateNormal({ name: name.trim(), mode }, selectedFromVault);
      return;
    }

    // Card/Board – if you have a manual composer you can route to that; here we just pass whatever we have.
    await onCreateQuizWithCards({ name: name.trim(), mode, category: category as 'Card' | 'Board' }, selectedFromVault);
  };

  return (
    <div className="h-full flex flex-col text-white">
      <div className="flex items-center mb-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold ml-2">
          {quizToEdit ? t('editQuiz') || 'Edit Quiz' : t('createQuiz') || 'Create Quiz'}
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Quiz Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter quiz title"
            className="w-full bg-brand-deep-purple/50 rounded-lg p-3 outline-none border border-brand-light-purple/30 focus:border-brand-glow"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Solo', 'Team', 'Classroom'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-2 rounded-lg border transition-colors ${
                  mode === m
                    ? 'border-brand-glow bg-brand-deep-purple/70'
                    : 'border-brand-light-purple/30 hover:bg-brand-deep-purple/50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Card', 'Board', 'Normal'] as GameCategory[]).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`py-2 rounded-lg border transition-colors ${
                  category === c
                    ? 'border-brand-glow bg-brand-deep-purple/70'
                    : 'border-brand-light-purple/30 hover:bg-brand-deep-purple/50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* NORMAL: pick from Vault with your new design */}
        {category === 'Normal' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-300">
                Selected from Vault: <span className="font-semibold">{selectedFromVault.length}</span>
              </p>
              <button
                onClick={() => setVaultOpen(true)}
                className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Select from Vault
              </button>
            </div>

            {selectedFromVault.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto hide-scrollbar pr-1">
                {selectedFromVault.map((q) => (
                  <div key={q.id} className="bg-brand-deep-purple/40 border border-brand-light-purple/30 rounded-lg p-3">
                    <p className="text-sm text-gray-200">{q.question}</p>
                    <p className="text-xs text-brand-glow mt-1">
                      {q.category} • {q.type} • {q.points} pts
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 flex justify-end gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg border border-brand-light-purple/30 hover:bg-white/10 transition-colors"
        >
          {t('cancel') || 'Cancel'}
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="px-5 py-2 rounded-lg bg-brand-accent text-white font-semibold disabled:bg-gray-500/50 disabled:cursor-not-allowed"
        >
          {quizToEdit ? (t('save') || 'Save') : (t('create') || 'Create')}
        </button>
      </div>

      <SelectQuestionFromVaultModal
        isOpen={vaultOpen}
        onClose={() => setVaultOpen(false)}
        gameCategory="Normal"
        onSelectQuestions={(qs) => {
          setSelectedFromVault(qs);
          setVaultOpen(false);
        }}
      />
    </div>
  );
};

export default CreateQuizScreen;
