// screens/quiz/QuizTakingScreen.tsx
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '../../server/src/config';
import { Question, MultipleChoiceQuestion, IdentificationQuestion } from '../../data/teacherQuizQuestions';

type QuizType = 'Card Game' | 'Board Game' | 'Normal';

type PlayQuiz = {
  id: number | string;
  topic: string;
  subpart: QuizType;
  teamMembers?: string[];
  questions: Question[];
};

interface QuizTakingScreenProps {
  quizId: string | number;
  teamMembers?: string[];
  onQuizComplete: (quizId: number | string, results: { questionId: number; wasCorrect: boolean }[], teamMembers?: string[]) => void;
}

const FeedbackModal: React.FC<{
  isOpen: boolean;
  isCorrect: boolean;
  questionText: string;
  correctAnswer: string;
  onNext: () => void;
}> = ({ isOpen, isCorrect, questionText, correctAnswer, onNext }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`relative w-full max-w-xs rounded-2xl p-6 flex flex-col items-center border ${isCorrect ? 'border-green-400' : 'border-red-500'} bg-brand-mid-purple`}>
        <h3 className={`text-3xl font-bold font-orbitron ${isCorrect ? 'text-green-400' : 'text-red-500'}`}>
          {isCorrect ? 'Correct!' : 'Incorrect'}
        </h3>
        <p className="text-gray-400 text-sm mt-4 text-center">{questionText}</p>
        <p className="text-gray-300 mt-2">The correct answer is:</p>
        <p className="font-bold text-lg text-brand-glow my-2 text-center">{correctAnswer}</p>
        <button onClick={onNext} className="mt-6 w-full bg-brand-accent text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 hover:shadow-glow">
          Next
        </button>
      </div>
    </div>
  );
};

const normalize = (s: string) => s.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

const generateGridWithAnswer = (answer: string, size: number = 10): string[][] => {
  const grid: (string | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetter = () => alphabet[Math.floor(Math.random() * alphabet.length)];
  const cleanAnswer = answer.toUpperCase().replace(/[^A-Z]/g, '');

  if (cleanAnswer.length === 0 || cleanAnswer.length > size * size) {
    return Array(size).fill(null).map(() => Array(size).fill('').map(randomLetter));
  }

  const directions = [
    { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 },
    { dr: 0, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
  ];

  for (let i = directions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [directions[i], directions[j]] = [directions[j], directions[i]];
  }

  let placed = false;
  for (const { dr, dc } of directions) {
    const validStarts: { r: number, c: number }[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const endR = r + (cleanAnswer.length - 1) * dr;
        const endC = c + (cleanAnswer.length - 1) * dc;
        if (endR >= 0 && endR < size && endC >= 0 && endC < size) validStarts.push({ r, c });
      }
    }
    if (validStarts.length > 0) {
      const { r, c } = validStarts[Math.floor(Math.random() * validStarts.length)];
      for (let i = 0; i < cleanAnswer.length; i++) grid[r + i * dr][c + i * dc] = cleanAnswer[i];
      placed = true;
      break;
    }
  }

  if (!placed && cleanAnswer.length <= size) {
    const row = Math.floor(Math.random() * size);
    const startCol = Math.floor(Math.random() * (size - cleanAnswer.length + 1));
    for (let i = 0; i < cleanAnswer.length; i++) grid[row][startCol + i] = cleanAnswer[i];
  }

  const finalGrid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) finalGrid[r][c] = grid[r][c] === null ? randomLetter() : grid[r][c]!;
  }
  return finalGrid;
};

const QuizTakingScreen: React.FC<QuizTakingScreenProps> = ({ quizId, teamMembers, onQuizComplete }) => {
  console.log('[QuizTakingScreen] received quizId prop:', quizId);

  const [quiz, setQuiz] = useState<PlayQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, string>>(new Map());

  const [isFlipped, setIsFlipped] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [lastAnswerResult, setLastAnswerResult] = useState<{ correct: boolean } | null>(null);
  const [questionResults, setQuestionResults] = useState<Map<number, boolean>>(new Map());
  const timerIntervalRef = useRef<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedCells, setSelectedCells] = useState<number[]>([]);
  const [boardAnswer, setBoardAnswer] = useState('');

  useEffect(() => {
    (async () => {
      console.log('[QuizTakingScreen] loader start. quizId=', quizId);
      try {
        if (quizId === undefined || quizId === null || String(quizId) === 'undefined') {
          throw new Error('No quiz selected. (quizId is undefined)');
        }
        setLoading(true);
        setErr('');

        const res = await fetch(`${API_URL}/api/quizzes/${encodeURIComponent(String(quizId))}`);
        if (!res.ok) throw new Error('Failed to load quiz.');
        const q = await res.json();

        const mapped: PlayQuiz = {
          id: q.id,
          topic: q.title,
          subpart: q.type as QuizType,
          teamMembers,
          questions: (q.questions || []).map((it: any) => ({
            id: Number(it.id),
            type: it.type === 'multiple-choice' ? 'multiple-choice' : 'identification',
            question: it.question,
            options: it.options || [],
            answer: it.answer || '',
            points: Number(it.points) || 1,
            timeLimit: it.timeLimit || 30,
            category: it.category || '',
            imageUrl: it.imageUrl || '',
          })),
        };

        console.log('[QuizTakingScreen] fetched quiz object:', mapped);
        setQuiz(mapped);
      } catch (e: any) {
        console.log('\n [QuizTakingScreen] load error:', e);
        setErr(e?.message || 'Failed to load quiz.');
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId, teamMembers]);

  const questions = useMemo(() => quiz?.questions || [], [quiz?.questions]);
  const currentQuestion: Question | undefined = questions[currentQuestionIndex];

  const [timeLeft, setTimeLeft] = useState<number>(currentQuestion?.timeLimit ?? 30);

  const boardGrid = useMemo(() => {
    if (!quiz || quiz.subpart !== 'Board Game' || !currentQuestion || currentQuestion.type !== 'identification') return [];
    return generateGridWithAnswer((currentQuestion as any as IdentificationQuestion).answer);
  }, [quiz, currentQuestion]);

  const selectedWord = useMemo(() => {
    if (!quiz || quiz.subpart !== 'Board Game') return '';
    const flatGrid = boardGrid.flat();
    return selectedCells.map(index => flatGrid[index]).join('');
  }, [selectedCells, boardGrid, quiz]);

  const handleGridPointerUp = useCallback(() => {
    if (quiz?.subpart !== 'Board Game') return;
    if (isDragging) setBoardAnswer(selectedWord);
    setIsDragging(false);
  }, [isDragging, selectedWord, quiz?.subpart]);

  useEffect(() => {
    if (quiz?.subpart !== 'Board Game') return;
    window.addEventListener('pointerup', handleGridPointerUp);
    return () => { window.removeEventListener('pointerup', handleGridPointerUp); };
  }, [quiz?.subpart, handleGridPointerUp]);

  const calculateAndFinish = () => {
    const results = questions.map(q => ({ questionId: q.id, wasCorrect: questionResults.get(q.id) || false }));
    onQuizComplete(quiz!.id, results, quiz!.teamMembers);
  };

  const handleNextQuestionFromModal = () => {
    setShowFeedbackModal(false);
    setLastAnswerResult(null);
    setIsFlipped(false);
    setSelectedCells([]);
    setBoardAnswer('');
    if (currentQuestionIndex >= questions.length - 1) calculateAndFinish();
    else setCurrentQuestionIndex(prev => prev + 1);
  };

  const handleCheckAnswer = useCallback(() => {
    if (!currentQuestion) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    let studentAnswer = '';
    if (quiz?.subpart === 'Board Game') studentAnswer = boardAnswer;
    else studentAnswer = answers.get(currentQuestion.id) || '';

    const isCorrect = normalize(studentAnswer) === normalize(currentQuestion.answer);
    setLastAnswerResult({ correct: isCorrect });
    setQuestionResults(prev => new Map(prev).set(currentQuestion.id, isCorrect));
    setShowFeedbackModal(true);
  }, [currentQuestion, boardAnswer, answers, quiz?.subpart]);

  useEffect(() => {
    if (!currentQuestion || !currentQuestion.timeLimit) return;
    setTimeLeft(currentQuestion.timeLimit);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          handleCheckAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [currentQuestionIndex, currentQuestion, handleCheckAnswer]);

  const handleAnswerSelect = (answer: string) => {
    if (!currentQuestion) return;
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, answer);
    setAnswers(newAnswers);
  };

  const handlePrev = () => { if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1); };

  const handleCellPointerDown = (index: number) => { setIsDragging(true); setSelectedCells([index]); setBoardAnswer(''); };

  const handleCellPointerEnter = (index: number) => {
    if (!isDragging || selectedCells.includes(index)) return;
    const lastIndex = selectedCells[selectedCells.length - 1];
    const lastRow = Math.floor(lastIndex / 10);
    const lastCol = lastIndex % 10;
    const currentRow = Math.floor(index / 10);
    const currentCol = index % 10;
    const isAdjacent = Math.abs(lastRow - currentRow) <= 1 && Math.abs(lastCol - currentCol) <= 1;
    if (isAdjacent) setSelectedCells(prev => [...prev, index]);
  };

  if (loading) return <div className="p-6 text-center text-white">Loading…</div>;
  if (err) return <div className="p-6 text-center text-red-400">{err}</div>;
  if (!quiz || !quiz.questions?.length) {
    return (
      <div className="w-full max-w-sm mx-auto h-screen flex flex-col items-center justify-center text-white p-4">
        <p>This quiz has no questions.</p>
        <button onClick={() => onQuizComplete(quizId, [], teamMembers)} className="mt-4 px-4 py-2 bg-brand-accent rounded-lg">Go Back</button>
      </div>
    );
  }

  // BOARD GAME UI (unchanged layout-wise)
  if (quiz.subpart === 'Board Game') {
    return (
      <div className="relative w-full max-w-sm mx-auto h-screen flex flex-col text-white p-4 bg-brand-deep-purple">
        <header className="flex-shrink-0 mb-4 text-center sticky top-0 z-10 bg-brand-deep-purple pt-1">
          <h1 className="text-2xl font-bold font-orbitron truncate">{quiz.topic}</h1>
          <p className="text-lg text-brand-glow">{quiz.subpart}</p>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center space-y-4">
          <p className="text-lg font-semibold text-center whitespace-pre-wrap break-words leading-relaxed">{currentQuestion!.question}</p>

          <div className="text-center">
            <p className="text-gray-300">Time Left</p>
            <p className="text-4xl font-bold font-orbitron text-brand-glow">{timeLeft}s</p>
          </div>

          <div
            className="w-full max-w-[300px] aspect-square bg-brand-deep-purple/50 p-2 rounded-lg border-2 border-brand-light-purple/50 shadow-lg touch-none"
            onPointerUp={handleGridPointerUp}
            onPointerLeave={handleGridPointerUp}
          >
            <div className="grid grid-cols-10 gap-1 w-full h-full select-none">
              {boardGrid.flat().map((letter, index) => (
                <div
                  key={index}
                  onPointerDown={() => handleCellPointerDown(index)}
                  onPointerEnter={() => handleCellPointerEnter(index)}
                  className={`flex items-center justify-center rounded-sm text-white font-mono text-sm aspect-square transition-colors duration-150
                    ${selectedCells.includes(index) ? 'bg-brand-glow scale-110' : 'bg-brand-mid-purple/70 cursor-pointer'}`}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="flex-shrink-0 pt-4 flex flex-col items-center space-y-4">
          <div className="w-full h-10 bg-brand-deep-purple/50 border border-brand-light-purple/50 rounded-lg flex items-center justify-center">
            <p className="font-mono text-2xl tracking-[0.2em] font-bold text-brand-glow">{boardAnswer}</p>
          </div>
          <button
            onClick={handleCheckAnswer}
            disabled={!boardAnswer}
            className="w-full bg-brand-accent text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out hover:bg-opacity-90 hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-brand-glow focus:ring-opacity-75 disabled:bg-gray-500/50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Submit Answer
          </button>
        </footer>

        <FeedbackModal
          isOpen={showFeedbackModal}
          isCorrect={!!lastAnswerResult?.correct}
          questionText={currentQuestion!.question}
          correctAnswer={currentQuestion!.answer}
          onNext={handleNextQuestionFromModal}
        />
      </div>
    );
  }

  // NORMAL & CARD GAME UI — question container is now auto-expanding with a safe cap
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isMultipleChoice = currentQuestion!.type === 'multiple-choice';

  return (
    <div className="relative w-full max-w-sm mx-auto h-screen flex flex-col text-white p-4 bg-brand-deep-purple">
      {/* Sticky header so progress never covers content; content scrolls beneath */}
      <header className="flex-shrink-0 sticky top-0 z-10 bg-brand-deep-purple pt-1 pb-3">
        <h1 className="text-2xl font-bold font-orbitron truncate">{quiz.topic}</h1>
        <p className="text-brand-glow">{quiz.subpart}</p>
        <div className="mt-3">
          <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
            <span>Progress</span>
            <span>Question {currentQuestionIndex + 1}/{questions.length}</span>
          </div>
          <div className="w-full bg-brand-mid-purple rounded-full h-2.5">
            <div className="bg-brand-glow h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      </header>

      {/* The main area can scroll if content is tall */}
      <main className="flex-grow flex flex-col overflow-y-auto">
        <div
          className="
            bg-brand-mid-purple/80 border border-brand-light-purple/50 rounded-2xl
            p-4 md:p-6 space-y-4
            overflow-y-auto
            max-h-[68vh] md:max-h-[70vh]
            min-h-[8rem]
          "
        >
          {quiz.teamMembers && (
            <div className="text-center">
              <p className="text-base md:text-lg font-semibold text-brand-glow">
                {quiz.teamMembers[currentQuestionIndex % quiz.teamMembers.length]}'s Turn!
              </p>
            </div>
          )}

          {currentQuestion!.imageUrl && (
            <div className="rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
              <img
                src={currentQuestion!.imageUrl}
                alt="Question visual aid"
                className="max-h-[32vh] w-auto object-contain"
              />
            </div>
          )}

          {/* AUTO-EXPANDING QUESTION TEXT */}
          <p className="text-base md:text-lg font-semibold text-center whitespace-pre-wrap break-words leading-relaxed">
            {currentQuestion!.question}
          </p>

          {isMultipleChoice ? (
            <div className="space-y-3 pt-1">
              {(currentQuestion as MultipleChoiceQuestion).options.map((option, index) => {
                const isSelected = answers.get(currentQuestion!.id) === option;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      const newAnswers = new Map(answers);
                      newAnswers.set(currentQuestion!.id, option);
                      setAnswers(newAnswers);
                    }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200
                      ${isSelected
                        ? 'bg-brand-glow/30 border-brand-glow text-white font-bold'
                        : 'bg-brand-deep-purple/50 border-brand-light-purple/50 text-gray-300 hover:bg-brand-light-purple/30'}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="pt-1">
              <input
                type="text"
                value={answers.get(currentQuestion!.id) || ''}
                onChange={e => {
                  const newAnswers = new Map(answers);
                  newAnswers.set(currentQuestion!.id, e.target.value);
                  setAnswers(newAnswers);
                }}
                placeholder="Type your answer here"
                className="w-full bg-brand-deep-purple/50 border-2 border-brand-light-purple/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow focus:border-transparent transition-all duration-300 text-center"
              />
            </div>
          )}
        </div>
      </main>

      <footer className="flex-shrink-0 pt-4 flex justify-between items-center">
        <button
          onClick={() => { if (currentQuestionIndex > 0) setCurrentQuestionIndex(prev => prev - 1); }}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 rounded-lg bg-brand-light-purple/80 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-light-purple"
        >
          Previous
        </button>
        <button
          onClick={() => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            const studentAnswer = answers.get(currentQuestion!.id) || '';
            const isCorrect = normalize(studentAnswer) === normalize(currentQuestion!.answer);
            setLastAnswerResult({ correct: isCorrect });
            setQuestionResults(prev => new Map(prev).set(currentQuestion!.id, isCorrect));
            setShowFeedbackModal(true);
          }}
          disabled={!answers.get(currentQuestion!.id)}
          className="px-8 py-3 rounded-lg bg-green-500 font-bold text-lg hover:bg-green-600 shadow-lg shadow-green-500/20 disabled:bg-gray-500/50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          Submit Answer
        </button>
      </footer>

      <FeedbackModal
        isOpen={showFeedbackModal}
        isCorrect={!!lastAnswerResult?.correct}
        questionText={currentQuestion!.question}
        correctAnswer={currentQuestion!.answer}
        onNext={handleNextQuestionFromModal}
      />
    </div>
  );
};

export default QuizTakingScreen;
