import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { TeacherQuiz } from '../../data/teacherQuizzes';
import { Question, MultipleChoiceQuestion } from '../../data/teacherQuizQuestions';

interface QuizDetailModalProps {
  isOpen: boolean;
  quiz: TeacherQuiz | null;
  onClose: () => void;
}

const QuestionDetail: React.FC<{ question: Question }> = ({ question }) => {
    const isMultipleChoice = question.type === 'multiple-choice';
    return (
        <div className="bg-brand-deep-purple/50 p-3 rounded-lg border border-brand-light-purple/30 space-y-2">
            {question.imageUrl && (
                <div className="mb-2 rounded-md overflow-hidden h-24 bg-black/20 flex items-center justify-center">
                    <img src={question.imageUrl} alt="Question visual aid" className="max-h-full max-w-full object-contain" />
                </div>
            )}
            <p className="text-sm font-semibold text-gray-200">{question.question}</p>
            {isMultipleChoice ? (
                <ul className="space-y-1 text-sm">
                    {(question as MultipleChoiceQuestion).options.map((option, index) => (
                        <li key={index} className={`pl-2 py-1 rounded ${option === (question as MultipleChoiceQuestion).answer ? 'bg-green-500/30 text-green-300 font-bold' : 'text-gray-300'}`}>
                            {option}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm">
                    <span className="font-semibold text-gray-400">Answer: </span>
                    <span className="text-green-300 font-bold">{question.answer}</span>
                </p>
            )}
        </div>
    );
};

const QuizDetailModal: React.FC<QuizDetailModalProps> = ({ isOpen, quiz, onClose }) => {
  const { t } = useTranslations();
  
  if (!isOpen || !quiz) {
    return null;
  }

  const isPosted = quiz.status === 'posted';

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } catch (e) {
        return 'Invalid Date';
    }
  };


  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md h-[80vh] bg-gradient-to-b from-brand-accent/90 via-blue-500/80 to-brand-mid-purple/90 rounded-2xl p-6 flex flex-col backdrop-blur-md border border-white/10 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <h2 className="text-2xl font-bold font-orbitron mb-4 flex-shrink-0">{quiz.title}</h2>
        
        <div className="flex-shrink-0 space-y-2 mb-4 text-sm">
            <div className="flex justify-between flex-wrap">
                <div>
                    <span className="font-semibold text-gray-400">Game Mode: </span>
                    <span>{t(`gameMode${quiz.mode}`)}</span>
                </div>
                 <div>
                    <span className="font-semibold text-gray-400">Game Category: </span>
                    <span>{quiz.type}</span>
                </div>
            </div>
             {isPosted && quiz.dueDate && (
                <div>
                    <span className="font-semibold text-gray-400">Due Date: </span>
                    <span>{formatDate(quiz.dueDate)}</span>
                </div>
            )}
        </div>

        {isPosted && quiz.postedToClasses && quiz.postedToClasses.length > 0 && (
             <div className="flex-shrink-0 mb-4">
                <h3 className="font-bold text-lg text-brand-glow">Posted To</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                    {quiz.postedToClasses.map(cls => (
                        <span key={cls.id} className="bg-brand-deep-purple/80 text-xs font-semibold px-2 py-1 rounded-full border border-brand-light-purple/50">
                            {cls.name} - {cls.section}
                        </span>
                    ))}
                </div>
             </div>
        )}

        <div className="flex-grow overflow-y-auto hide-scrollbar pr-2 space-y-3">
            <h3 className="font-bold text-lg text-brand-glow">Questions</h3>
            {quiz.questions && quiz.questions.length > 0 ? (
                quiz.questions.map((q, index) => <QuestionDetail key={q.id || index} question={q} />)
            ) : (
                <p className="text-center text-gray-400 py-4">This quiz has no questions yet.</p>
            )}
        </div>

      </div>
    </div>
  );
};

export default QuizDetailModal;