import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Quiz } from '../../data/quizzes';
import { Question, MultipleChoiceQuestion, IdentificationQuestion } from '../../data/teacherQuizQuestions';

interface QuizTakingScreenProps {
  quiz: Quiz & { teamMembers?: string[] };
  onQuizComplete: (quizId: number, results: { questionId: number; wasCorrect: boolean }[], teamMembers?: string[]) => void;
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
                if (endR >= 0 && endR < size && endC >= 0 && endC < size) {
                    validStarts.push({ r, c });
                }
            }
        }

        if (validStarts.length > 0) {
            const { r, c } = validStarts[Math.floor(Math.random() * validStarts.length)];
            for (let i = 0; i < cleanAnswer.length; i++) {
                grid[r + i * dr][c + i * dc] = cleanAnswer[i];
            }
            placed = true;
            break;
        }
    }

    if (!placed && cleanAnswer.length <= size) {
        const row = Math.floor(Math.random() * size);
        const startCol = Math.floor(Math.random() * (size - cleanAnswer.length + 1));
        for (let i = 0; i < cleanAnswer.length; i++) {
            grid[row][startCol + i] = cleanAnswer[i];
        }
    }

    const finalGrid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            finalGrid[r][c] = grid[r][c] === null ? randomLetter() : grid[r][c]!;
        }
    }
    return finalGrid;
};


const QuizTakingScreen: React.FC<QuizTakingScreenProps> = ({ quiz, onQuizComplete }) => {
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

  const questions = useMemo(() => quiz.questions || [], [quiz.questions]);
  const currentQuestion: Question | undefined = questions[currentQuestionIndex];
  
  const [timeLeft, setTimeLeft] = useState(currentQuestion?.timeLimit ?? 30);
  
  const boardGrid = useMemo(() => {
    if (quiz.subpart !== 'Board Game' || !currentQuestion || currentQuestion.type !== 'identification') {
        return [];
    }
    return generateGridWithAnswer((currentQuestion as IdentificationQuestion).answer);
  }, [quiz.subpart, currentQuestion]);

  const selectedWord = useMemo(() => {
    if (quiz.subpart !== 'Board Game') return '';
    const flatGrid = boardGrid.flat();
    return selectedCells.map(index => flatGrid[index]).join('');
  }, [selectedCells, boardGrid, quiz.subpart]);

    const handleGridPointerUp = useCallback(() => {
        if (isDragging) {
            setBoardAnswer(selectedWord);
        }
        setIsDragging(false);
    }, [isDragging, selectedWord]);

  useEffect(() => {
    if (quiz.subpart !== 'Board Game') return;
    
    window.addEventListener('pointerup', handleGridPointerUp);
    
    return () => {
        window.removeEventListener('pointerup', handleGridPointerUp);
    };
  }, [quiz.subpart, handleGridPointerUp]);

  const calculateAndFinish = () => {
    const results = questions.map(q => ({
        questionId: q.id,
        wasCorrect: questionResults.get(q.id) || false,
    }));
    onQuizComplete(quiz.id, results, quiz.teamMembers);
  };

  const handleNextQuestionFromModal = () => {
      setShowFeedbackModal(false);
      setLastAnswerResult(null);
      setIsFlipped(false);
      setSelectedCells([]);
      setBoardAnswer('');

      if (currentQuestionIndex >= questions.length - 1) {
          calculateAndFinish();
      } else {
          setCurrentQuestionIndex(prev => prev + 1);
      }
  };

  const handleCheckAnswer = useCallback(() => {
      if (!currentQuestion) return;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      let studentAnswer = "";
      if (quiz.subpart === 'Board Game') {
          studentAnswer = boardAnswer;
      } else {
          studentAnswer = answers.get(currentQuestion.id) || "";
      }
      
      const isCorrect = studentAnswer.trim().toUpperCase() === currentQuestion.answer.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

      setLastAnswerResult({ correct: isCorrect });
      setQuestionResults(prev => new Map(prev).set(currentQuestion.id, isCorrect));
      setShowFeedbackModal(true);
  }, [currentQuestion, boardAnswer, answers, quiz.subpart, questionResults]);

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

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [currentQuestionIndex, currentQuestion, handleCheckAnswer]);

  const handleAnswerSelect = (answer: string) => {
    if (!currentQuestion) return;
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, answer);
    setAnswers(newAnswers);
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleCellPointerDown = (index: number) => {
    setIsDragging(true);
    setSelectedCells([index]);
    setBoardAnswer('');
  };

  const handleCellPointerEnter = (index: number) => {
      if (!isDragging || selectedCells.includes(index)) return;

      const lastIndex = selectedCells[selectedCells.length - 1];
      const lastRow = Math.floor(lastIndex / 10);
      const lastCol = lastIndex % 10;
      const currentRow = Math.floor(index / 10);
      const currentCol = index % 10;
      
      const isAdjacent = Math.abs(lastRow - currentRow) <= 1 && Math.abs(lastCol - currentCol) <= 1;

      if (isAdjacent) {
          setSelectedCells(prev => [...prev, index]);
      }
  };

  if (!currentQuestion) {
    return (
        <div className="w-full max-w-sm mx-auto h-screen flex flex-col items-center justify-center text-white p-4">
            <p>This quiz has no questions.</p>
            <button onClick={() => onQuizComplete(quiz.id, [], quiz.teamMembers)} className="mt-4 px-4 py-2 bg-brand-accent rounded-lg">Go Back</button>
        </div>
    );
  }
  
    // RENDER BOARD GAME UI
    if (quiz.subpart === 'Board Game') {
        return (
            <div className="relative w-full max-w-sm mx-auto h-screen flex flex-col text-white p-4 bg-brand-deep-purple">
                <header className="flex-shrink-0 mb-4 text-center">
                    <h1 className="text-2xl font-bold font-orbitron truncate">{quiz.topic}</h1>
                    <p className="text-lg text-brand-glow">{quiz.subpart}</p>
                </header>
                
                <main className="flex-grow flex flex-col items-center justify-center space-y-4">
                    <p className="text-lg font-semibold text-center">{currentQuestion.question}</p>
                    
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
                                        ${selectedCells.includes(index) ? 'bg-brand-glow scale-110' : 'bg-brand-mid-purple/70 cursor-pointer'}`
                                    }
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
                    questionText={currentQuestion.question}
                    correctAnswer={currentQuestion.answer}
                    onNext={handleNextQuestionFromModal}
                />
            </div>
        );
    }
  
  // RENDER CARD GAME UI
  if (quiz.subpart === 'Card Game') {
      const isCardMC = currentQuestion.type === 'multiple-choice';
      return (
          <div className="relative w-full max-w-sm mx-auto h-screen flex flex-col text-white p-4">
              <header className="flex-shrink-0 mb-2">
                  <h1 className="text-xl font-bold font-orbitron truncate">{quiz.topic}</h1>
                  <p className="text-sm text-brand-glow">{quiz.subpart}</p>
              </header>
              <main className="flex-grow flex flex-col justify-center items-center overflow-hidden">
                   {quiz.teamMembers && (
                      <div className="text-center mb-2">
                          <p className="text-lg font-semibold text-brand-glow animate-pulse">
                              {quiz.teamMembers[currentQuestionIndex % quiz.teamMembers.length]}'s Turn!
                          </p>
                      </div>
                  )}
                  <div className="mb-4 text-center">
                      <p className="text-gray-300">Time Left</p>
                      <p className="text-4xl font-bold font-orbitron text-brand-glow">{timeLeft}s</p>
                  </div>

                  <div className="w-full h-[28rem] perspective-[1000px]" onClick={() => !isFlipped && setIsFlipped(true)}>
                      <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                          <div className="absolute w-full h-full backface-hidden rounded-2xl border-4 border-yellow-400/50 overflow-hidden shadow-lg shadow-black/50">
                              <img src="Image/Backcard.png" className="w-full h-full object-cover" alt="Card Back" />
                              {!isFlipped && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                      <p className="text-lg font-bold text-yellow-300 animate-pulse bg-black/50 p-2 rounded-md">Click to Flip</p>
                                  </div>
                              )}
                          </div>
                          <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl border-4 border-yellow-400/50 p-4 flex flex-col bg-cover bg-center shadow-lg shadow-black/50" style={{ backgroundImage: "url('Image/bg.png')" }}>
                              <div className="absolute top-2 left-2 bg-black/50 px-3 py-1 rounded-full text-sm font-bold text-white">{currentQuestion.points || 0} pts</div>
                              <div className="absolute top-2 right-2 bg-black/50 px-3 py-1 rounded-full text-sm font-semibold text-white truncate max-w-[100px]">{currentQuestion.category || 'Category'}</div>
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-purple-600/80 px-4 py-1 rounded-full text-sm font-bold text-white">{(currentQuestion.points || 0) * 10} XP</div>

                              <div className="flex-grow flex flex-col justify-between pt-8 pb-10">
                                  <div className="w-full h-32 bg-black/30 rounded-lg flex items-center justify-center border border-yellow-300/50 overflow-hidden">
                                      {currentQuestion.imageUrl ? (
                                          <img src={currentQuestion.imageUrl} alt="Question" className="w-full h-full object-cover" />
                                      ) : (
                                          <span className="text-gray-400 text-xs text-center p-2">No Image for this Question</span>
                                      )}
                                  </div>
                                  <div className="w-full bg-gradient-to-r from-blue-500/80 to-brand-accent/80 p-2 my-1 rounded-lg text-white font-semibold text-center text-sm">
                                      <p>{currentQuestion.question}</p>
                                  </div>
                                  <div className="flex-grow flex flex-col justify-center">
                                      {isCardMC ? (
                                          <div className="w-full space-y-2">
                                              {(currentQuestion as MultipleChoiceQuestion).options.map((option, index) => {
                                                  const isSelected = answers.get(currentQuestion.id) === option;
                                                  return (
                                                      <button
                                                          key={index}
                                                          onClick={(e) => { e.stopPropagation(); handleAnswerSelect(option); }}
                                                          className={`w-full text-center p-2 rounded-lg border-2 transition-all duration-200 text-xs ${isSelected ? 'bg-brand-glow/30 border-brand-glow font-bold' : 'bg-brand-deep-purple/50 border-brand-light-purple/50 hover:bg-brand-light-purple/30'}`}
                                                      >
                                                          {option}
                                                      </button>
                                                  );
                                              })}
                                          </div>
                                      ) : (
                                          <input
                                              type="text"
                                              value={answers.get(currentQuestion.id) || ''}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={e => handleAnswerSelect(e.target.value)}
                                              placeholder="Type your answer"
                                              className="w-full bg-brand-deep-purple/50 border-2 border-brand-light-purple/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow text-center"
                                          />
                                      )}
                                  </div>
                                  <div className="flex-shrink-0 mt-2">
                                      <button onClick={(e) => { e.stopPropagation(); handleCheckAnswer(); }} className="w-full bg-green-500 font-bold py-1.5 px-8 rounded-lg hover:bg-green-600">
                                          Submit Answer
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </main>
              <FeedbackModal 
                isOpen={showFeedbackModal}
                isCorrect={!!lastAnswerResult?.correct}
                questionText={currentQuestion.question}
                correctAnswer={currentQuestion.answer}
                onNext={handleNextQuestionFromModal}
              />
          </div>
      );
  }

  // RENDER NORMAL QUIZ UI
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isMultipleChoice = currentQuestion.type === 'multiple-choice';

  return (
    <div className="relative w-full max-w-sm mx-auto h-screen flex flex-col text-white p-4">
        <header className="flex-shrink-0 mb-4">
            <h1 className="text-2xl font-bold font-orbitron truncate">{quiz.topic}</h1>
            <p className="text-brand-glow">{quiz.subpart}</p>
            <div className="mt-4">
                <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>Question {currentQuestionIndex + 1}/{questions.length}</span>
                </div>
                <div className="w-full bg-brand-mid-purple rounded-full h-2.5">
                    <div className="bg-brand-glow h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>
        </header>
        
        <main className="flex-grow flex flex-col justify-center overflow-y-auto hide-scrollbar">
            {quiz.teamMembers && (
                <div className="text-center mb-4">
                    <p className="text-lg font-semibold text-brand-glow animate-pulse">
                        {quiz.teamMembers[currentQuestionIndex % quiz.teamMembers.length]}'s Turn!
                    </p>
                </div>
            )}
            <div className="bg-brand-mid-purple/80 p-6 rounded-2xl border border-brand-light-purple/50 space-y-4">
                {currentQuestion.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden h-32 bg-black/20 flex items-center justify-center">
                        <img src={currentQuestion.imageUrl} alt="Question visual aid" className="max-h-full max-w-full object-contain" />
                    </div>
                )}
                <p className="text-lg font-semibold text-center">{currentQuestion.question}</p>

                {isMultipleChoice ? (
                    <div className="space-y-3 pt-4">
                        {(currentQuestion as MultipleChoiceQuestion).options.map((option, index) => {
                            const isSelected = answers.get(currentQuestion.id) === option;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(option)}
                                    className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200
                                        ${isSelected 
                                            ? 'bg-brand-glow/30 border-brand-glow text-white font-bold' 
                                            : 'bg-brand-deep-purple/50 border-brand-light-purple/50 text-gray-300 hover:bg-brand-light-purple/30'
                                        }`}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="pt-4">
                        <input
                            type="text"
                            value={answers.get(currentQuestion.id) || ''}
                            onChange={e => handleAnswerSelect(e.target.value)}
                            placeholder="Type your answer here"
                            className="w-full bg-brand-deep-purple/50 border-2 border-brand-light-purple/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow focus:border-transparent transition-all duration-300 text-center"
                        />
                    </div>
                )}
            </div>
        </main>

        <footer className="flex-shrink-0 pt-4 flex justify-between items-center">
            <button onClick={handlePrev} disabled={currentQuestionIndex === 0} className="px-6 py-2 rounded-lg bg-brand-light-purple/80 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-light-purple">
                Previous
            </button>
            <button
                onClick={handleCheckAnswer}
                disabled={!answers.get(currentQuestion.id)}
                className="px-8 py-3 rounded-lg bg-green-500 font-bold text-lg hover:bg-green-600 shadow-lg shadow-green-500/20 disabled:bg-gray-500/50 disabled:cursor-not-allowed disabled:shadow-none"
            >
                Submit Answer
            </button>
        </footer>

        <FeedbackModal 
            isOpen={showFeedbackModal}
            isCorrect={!!lastAnswerResult?.correct}
            questionText={currentQuestion.question}
            correctAnswer={currentQuestion.answer}
            onNext={handleNextQuestionFromModal}
        />
    </div>
  );
};

export default QuizTakingScreen;