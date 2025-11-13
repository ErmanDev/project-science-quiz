import React, { useEffect, useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { DoneQuiz } from '../../data/quizzes';
import { Question, MultipleChoiceQuestion } from '../../data/teacherQuizQuestions';
import { API_URL } from '../../server/src/config';

interface StudentQuizDetailModalProps {
  isOpen: boolean;
  quiz: DoneQuiz | null;
  onClose: () => void;
}

interface SubmissionAnswer {
  questionId: string | number;
  answer: string | boolean | string[];
  correctAnswer?: string;
  wasCorrect?: boolean;
  points?: number;
}

const QuestionDetail: React.FC<{ 
  question: Question; 
  wasCorrect: boolean; 
  studentAnswer?: string | boolean | string[];
  studentName?: string; 
}> = ({ question, wasCorrect, studentAnswer, studentName }) => {
    const isMultipleChoice = question.type === 'multiple-choice';
    const studentAnswerStr = studentAnswer !== undefined 
      ? (typeof studentAnswer === 'string' ? studentAnswer : Array.isArray(studentAnswer) ? studentAnswer.join(', ') : String(studentAnswer))
      : null;

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
                <div className="space-y-2">
                    <div className="text-sm">
                        <span className="font-semibold text-gray-400">Your Answer: </span>
                        <span className={`font-bold ${wasCorrect ? 'text-green-300' : 'text-red-400'}`}>
                            {studentAnswerStr || 'No answer provided'}
                        </span>
                    </div>
                    <div className="text-xs text-gray-400">Options:</div>
                    <ul className="space-y-1 text-sm">
                        {(question as MultipleChoiceQuestion).options.map((option, index) => {
                            const isCorrectAnswer = option === question.answer;
                            const isStudentAnswer = option === studentAnswerStr;
                            let classes = 'pl-2 py-1 rounded text-gray-300';
                            if (isCorrectAnswer) {
                                classes = 'pl-2 py-1 rounded bg-green-500/30 text-green-300 font-bold';
                            } else if (isStudentAnswer && !wasCorrect) {
                                classes = 'pl-2 py-1 rounded bg-red-500/30 text-red-400 font-bold';
                            }
                            return (
                                <li key={index} className={classes}>
                                    {option}
                                    {isCorrectAnswer && ' ✓'}
                                    {isStudentAnswer && !wasCorrect && ' (Your answer)'}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : (
                 <div className="text-sm space-y-1">
                    <p>
                        <span className="font-semibold text-gray-400">Your Answer: </span>
                        <span className={`font-bold ${wasCorrect ? 'text-green-300' : 'text-red-400'}`}>
                            {studentAnswerStr || 'No answer provided'}
                        </span>
                    </p>
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
  const [fullQuiz, setFullQuiz] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !quiz) {
      setFullQuiz(null);
      setSubmission(null);
      return;
    }

    const loadQuizData = async () => {
      setLoading(true);
      setError('');
      try {
        // Get current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const studentId = String(currentUser.id || currentUser.email || '');

        // Fetch full quiz with questions
        const quizRes = await fetch(`${API_URL}/api/quizzes/${encodeURIComponent(String(quiz.id))}`);
        if (!quizRes.ok) throw new Error('Failed to load quiz details');
        const quizData = await quizRes.json();
        setFullQuiz(quizData);

        // Fetch submission to get student's answers
        const subRes = await fetch(`${API_URL}/api/submissions?studentId=${encodeURIComponent(studentId)}`);
        if (!subRes.ok) throw new Error('Failed to load submission');
        const submissions = await subRes.json();
        const studentSubmission = submissions.find((s: any) => String(s.quizId) === String(quiz.id));
        setSubmission(studentSubmission);
      } catch (err: any) {
        setError(err.message || 'Failed to load quiz details');
        console.error('[StudentQuizDetailModal] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [isOpen, quiz]);

  if (!isOpen || !quiz) {
    return null;
  }

  // Create a map of student answers by questionId
  const studentAnswersMap = new Map<string | number, SubmissionAnswer>();
  if (submission && Array.isArray(submission.answers)) {
    submission.answers.forEach((ans: SubmissionAnswer) => {
      studentAnswersMap.set(ans.questionId, ans);
    });
  }

  // Use full quiz questions if available, otherwise fall back to quiz.questions
  const questions = fullQuiz?.questions || quiz.questions || [];
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
            {loading && (
              <p className="text-center text-gray-400 py-4">Loading questions...</p>
            )}
            {error && (
              <p className="text-center text-red-400 py-4">{error}</p>
            )}
            {!loading && !error && questions.length > 0 ? (
                questions.map((q: Question, index: number) => {
                    const studentAnswer = studentAnswersMap.get(q.id);
                    const wasCorrect = studentAnswer?.wasCorrect ?? (index < correctCount);
                    const result = quiz.questionResults?.find(r => r.questionId === q.id);
                    const studentName = result?.studentName;

                    return (
                      <QuestionDetail 
                        key={q.id || index} 
                        question={q} 
                        wasCorrect={wasCorrect}
                        studentAnswer={studentAnswer?.answer}
                        studentName={studentName} 
                      />
                    );
                })
            ) : !loading && !error && (
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