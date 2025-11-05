import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { DoneQuiz } from '../../data/quizzes';
import { Question, MultipleChoiceQuestion } from '../../data/teacherQuizQuestions';

interface StudentQuizDetailModalProps {
  isOpen: boolean;
  quiz: DoneQuiz | null;
  onClose: () => void;
}

const QuestionDetail: React.FC<{ question: Question; wasCorrect: boolean; studentName?: string; }> = ({ question, wasCorrect, studentName }) => {
    const isMultipleChoice = question.type === 'multiple-choice';

    return (
        <div className="bg-brand-deep-purple/50 p-3 rounded-lg border border-brand-light-purple/30 space-y-2">
            <div className="flex justify-between items-start gap-2">
                <p className="text-sm font-semibold text-gray-200 flex-grow">{question.question}</p>
                <div className="flex-shrink-0 flex flex-col items-end">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${wasCorrect ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-400'}`}>
                        {wasCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                    {studentName && <span className="text-xs text-gray-400 mt-1">{studentName}</span>}
                </div>
            </div>
            
            {isMultipleChoice ? (
                <ul className="space-y-1 text-sm">
                    {(question as MultipleChoiceQuestion).options.map((option, index) => {
                        const isCorrectAnswer = option === question.answer;
                        let classes = 'pl-2 py-1 rounded text-gray-300';
                        if (isCorrectAnswer) {
                            classes = 'pl-2 py-1 rounded bg-green-500/30 text-green-300 font-bold';
                        }
                        return <li key={index} className={classes}>{option}</li>;
                    })}
                </ul>
            ) : (
                 <div className="text-sm space-y-1">
                    <p>
                        <span className="font-semibold text-gray-400">Correct Answer: </span>
                        <span className="text-green-300 font-bold">{question.answer}</span>
                    </p>
                </div>
            )}
        </div>
    );
};


const StudentQuizDetailModal: React.FC<StudentQuizDetailModalProps> = ({ isOpen, quiz, onClose }) => {
  const { t } = useTranslations();
  
  if (!isOpen || !quiz) {
    return null;
  }
  
  const [correctCount] = quiz.score.split('/').map(Number);

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
        <div className="flex-shrink-0 text-center mb-4">
            <h2 className="text-2xl font-bold font-orbitron">{quiz.topic}</h2>
            <p className="text-brand-glow">{quiz.subpart}</p>
            <p className="text-4xl font-bold font-orbitron text-brand-glow mt-2">{quiz.score}</p>
        </div>
        
        <div className="flex-grow overflow-y-auto hide-scrollbar pr-2 space-y-3">
            <h3 className="font-bold text-lg text-brand-glow">Questions Review</h3>
            {quiz.questions && quiz.questions.length > 0 ? (
                quiz.questions.map((q, index) => {
                    const result = quiz.questionResults?.find(r => r.questionId === q.id);
                    // Use result if available, otherwise fallback to old (less accurate) logic
                    const wasCorrect = result ? result.wasCorrect : index < correctCount;
                    const studentName = result?.studentName;

                    return <QuestionDetail key={q.id || index} question={q} wasCorrect={wasCorrect} studentName={studentName} />;
                })
            ) : (
                <p className="text-center text-gray-400 py-4">Question details are not available for this quiz.</p>
            )}
        </div>
        
         <div className="flex-shrink-0 pt-4 mt-2">
             <button
                onClick={onClose}
                className="w-full bg-black/50 border border-blue-300/50 text-white font-semibold py-2 rounded-lg transition-colors hover:bg-black/70"
            >
                {t('close')}
            </button>
        </div>

      </div>
    </div>
  );
};

export default StudentQuizDetailModal;