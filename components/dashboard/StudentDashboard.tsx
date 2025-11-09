import React, { useState } from 'react';
import QuizzesScreen from './dashboard/QuizzesScreen';
import QuizTakingScreen from './quiz/QuizTakingScreen';

const StudentDashboard = (props) => {
  const { onQuizComplete /* plus your other props */ } = props;

  // NEW: only an id, not a whole quiz object
  const [selectedQuizId, setSelectedQuizId] = useState<string | number | null>(null);

  const handleTakeQuiz = (quizId: string | number) => {
    console.log('[StudentDashboard] handleTakeQuiz received id:', quizId);
    setSelectedQuizId(quizId);
  };

  const handleFinish = (quizId: string | number, results: { questionId: number; wasCorrect: boolean }[], teamMembers?: string[]) => {
    console.log('[StudentDashboard] onQuizComplete:', { quizId, results, teamMembers });
    onQuizComplete?.(quizId, results, teamMembers);
    setSelectedQuizId(null);
  };

  return (
    <div className="h-full">
      {!selectedQuizId ? (
        <QuizzesScreen
          onTakeQuiz={(id) => {
            console.log('[StudentDashboard] Passing id to take screen:', id);
            handleTakeQuiz(id);
          }}
          onViewDetails={(doneQuiz) => console.log('[StudentDashboard] view details', doneQuiz)}
        />
      ) : (
        <QuizTakingScreen
          quizId={selectedQuizId}
          onQuizComplete={handleFinish}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
