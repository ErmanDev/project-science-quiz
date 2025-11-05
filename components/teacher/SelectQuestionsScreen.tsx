import React, { useState, useMemo } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { multipleChoiceQuestions, identificationQuestions, Question, QuestionCategory } from '../../data/teacherQuizQuestions';

// Re-using these from QuizBankScreen
const BackIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);
const ChevronDownIcon: React.FC<{ isRotated?: boolean }> = ({ isRotated }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform duration-200 ${isRotated ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const SelectableQuestionItem: React.FC<{ question: Question; isSelected: boolean; onToggle: () => void; }> = ({ question, isSelected, onToggle }) => {
    return (
        <div 
            onClick={onToggle}
            className={`bg-brand-deep-purple/50 p-3 rounded-lg border transition-all duration-200 cursor-pointer
                ${isSelected ? 'border-brand-glow shadow-glow' : 'border-brand-light-purple/30 hover:border-brand-light-purple'}`}
        >
            {question.imageUrl && (
                <div className="mb-2 rounded-md overflow-hidden h-24 bg-black/20 flex items-center justify-center">
                    <img src={question.imageUrl} alt="Question visual aid" className="max-h-full max-w-full object-contain" />
                </div>
            )}
            <div className="flex justify-between items-start">
                <div className="flex-grow pr-2">
                    <p className="text-sm text-gray-200">{question.question}</p>
                    <p className="text-xs text-brand-glow mt-1">{question.points} points</p>
                </div>
                <div className="flex-shrink-0 pt-1">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="h-5 w-5 rounded border-gray-300 text-brand-accent focus:ring-brand-glow bg-brand-deep-purple/50 accent-brand-accent"
                    />
                </div>
            </div>
        </div>
    );
};

interface SelectQuestionsScreenProps {
    onBack: () => void;
    onSaveQuiz: (selectedIds: number[]) => void;
}

const SelectQuestionsScreen: React.FC<SelectQuestionsScreenProps> = ({ onBack, onSaveQuiz }) => {
    const { t } = useTranslations();
    const allQuestions = useMemo(() => [...multipleChoiceQuestions, ...identificationQuestions], []);
    
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    // FIX: Corrected category names to match QuestionCategory type.
    const questionCategories: QuestionCategory[] = ['Earth and Space', 'Living Things and Their Environment', 'Matter', 'Force, Motion, and Energy'];
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        // FIX: Corrected category name to match QuestionCategory type.
        'Earth and Space': true,
    });

    const groupedQuestions = useMemo(() => {
        // FIX: Corrected category names to match QuestionCategory type.
        const initial: Record<QuestionCategory, { 'multiple-choice': Question[], 'identification': Question[] }> = {
            'Earth and Space': { 'multiple-choice': [], 'identification': [] },
            'Living Things and Their Environment': { 'multiple-choice': [], 'identification': [] },
            'Matter': { 'multiple-choice': [], 'identification': [] },
            'Force, Motion, and Energy': { 'multiple-choice': [], 'identification': [] },
        };

        return allQuestions.reduce((acc, q) => {
            if (acc[q.category]) {
                acc[q.category][q.type].push(q);
            }
            return acc;
        }, initial);
    }, [allQuestions]);

    const toggleQuestionSelection = (id: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleCategory = (category: QuestionCategory) => {
        setExpandedCategories(prev => ({...prev, [category]: !prev[category]}));
    };

    const handleSave = () => {
        onSaveQuiz(Array.from(selectedIds));
    };

    return (
        <div className="relative h-full flex flex-col text-white">
            <header className="flex items-center mb-4 flex-shrink-0">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back">
                    <BackIcon />
                </button>
                <h2 className="text-2xl font-bold ml-2">{t('selectQuestions')}</h2>
            </header>

            <main className="flex-grow overflow-y-auto hide-scrollbar pr-2 space-y-3 pb-20">
                {questionCategories.map(category => {
                    const categoryQuestions = groupedQuestions[category];
                    if (!categoryQuestions || (categoryQuestions['multiple-choice'].length === 0 && categoryQuestions['identification'].length === 0)) {
                        return null;
                    }

                    return (
                        <div key={category} className="bg-brand-mid-purple/50 rounded-lg overflow-hidden">
                            <button onClick={() => toggleCategory(category)} className="w-full flex justify-between items-center p-3 text-left bg-brand-mid-purple/80">
                                <h3 className="font-bold text-lg text-brand-glow">{category}</h3>
                                <ChevronDownIcon isRotated={!expandedCategories[category]} />
                            </button>
                            {expandedCategories[category] && (
                                <div className="p-3 space-y-3">
                                    {categoryQuestions['multiple-choice'].length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-300 mb-2 pl-1">Multiple Choice</h4>
                                            <div className="space-y-2">
                                                {categoryQuestions['multiple-choice'].map(q => 
                                                    <SelectableQuestionItem 
                                                        key={q.id} 
                                                        question={q} 
                                                        isSelected={selectedIds.has(q.id)}
                                                        onToggle={() => toggleQuestionSelection(q.id)}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {categoryQuestions['identification'].length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-300 mb-2 mt-3 pl-1">Identification</h4>
                                            <div className="space-y-2">
                                                 {categoryQuestions['identification'].map(q => 
                                                    <SelectableQuestionItem 
                                                        key={q.id} 
                                                        question={q} 
                                                        isSelected={selectedIds.has(q.id)}
                                                        onToggle={() => toggleQuestionSelection(q.id)}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </main>

            <footer className="absolute bottom-0 left-0 right-0 p-4 bg-brand-deep-purple/80 backdrop-blur-sm border-t border-brand-light-purple/30">
                <div className="flex justify-between items-center">
                    <p className="font-semibold">{selectedIds.size} questions selected</p>
                    <button
                        onClick={handleSave}
                        disabled={selectedIds.size === 0}
                        className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 ease-in-out hover:bg-blue-500 hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-500/50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        Save Quiz
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default SelectQuestionsScreen;