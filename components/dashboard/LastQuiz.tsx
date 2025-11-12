
import React, { useMemo } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { DoneQuiz } from '../../data/quizzes';

const LeaderboardPodium: React.FC<{ position: number; name: string; avatar: string; color: string; order: number; offset: string }> = ({ position, name, avatar, color, order, offset }) => (
    <div className={`flex flex-col items-center order-${order}`}>
        <img src={avatar} alt={`Rank ${position}`} className={`w-16 h-16 rounded-full border-4 ${color}`} style={{ transform: `translateY(${offset})` }}/>
        <span className="text-xs mt-2 text-gray-500 dark:text-gray-300 font-semibold">{name}</span>
        <span className="text-xs text-gray-400 dark:text-gray-400">{position}</span>
    </div>
);

interface LastQuizProps {
  doneQuizzes?: DoneQuiz[];
  reportsData?: {
    singleQuizStudentScores?: Array<{ name: string; quizNumber: string | number; score: string; classId?: string; avatar?: string | null }>;
    allQuizzesStudentScores?: Array<{ name: string; average: number; classId?: string; avatar?: string | null }>;
  };
  currentUserId?: string;
}

const LastQuiz: React.FC<LastQuizProps> = ({ doneQuizzes = [], reportsData, currentUserId }) => {
  const { t } = useTranslations();

  // Get the last completed quiz
  const lastQuiz = useMemo(() => {
    if (!doneQuizzes || doneQuizzes.length === 0) return null;
    return doneQuizzes[doneQuizzes.length - 1];
  }, [doneQuizzes]);

  // Get leaderboard data for the last quiz
  const leaderboardData = useMemo(() => {
    if (!lastQuiz || !reportsData?.singleQuizStudentScores) return [];
    
    const quizId = String(lastQuiz.id);
    const scores = reportsData.singleQuizStudentScores
      .filter((s: any) => String(s.quizNumber) === quizId)
      .map((s: any) => ({
        name: s.name,
        score: parseFloat(s.score.replace('%', '')) || 0,
        avatar: s.avatar || `https://i.pravatar.cc/150?img=${s.name.charCodeAt(0)}`,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3 for podium
    
    return scores;
  }, [lastQuiz, reportsData]);

  const hasLeaderboardData = leaderboardData.length > 0;

  return (
    <div className="bg-white dark:bg-brand-mid-purple/80 rounded-2xl p-4">
      <h2 className="font-bold text-lg mb-2">{t('lastQuiz')}</h2>
      
      {/* Leaderboard */}
      <div className="mb-4">
        <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-300 mb-2">{t('leaderboard')}</h3>
        {hasLeaderboardData ? (
          <div className="flex justify-around items-end h-28">
            {leaderboardData.length >= 2 && (
              <LeaderboardPodium 
                position={2} 
                name={leaderboardData[1].name} 
                avatar={leaderboardData[1].avatar} 
                color="border-gray-400" 
                order={2} 
                offset="0px" 
              />
            )}
            {leaderboardData.length >= 1 && (
              <LeaderboardPodium 
                position={1} 
                name={leaderboardData[0].name} 
                avatar={leaderboardData[0].avatar} 
                color="border-yellow-400" 
                order={1} 
                offset="-20px" 
              />
            )}
            {leaderboardData.length >= 3 && (
              <LeaderboardPodium 
                position={3} 
                name={leaderboardData[2].name} 
                avatar={leaderboardData[2].avatar} 
                color="border-yellow-700" 
                order={3} 
                offset="0px"
              />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-28 bg-gray-100 dark:bg-brand-light-purple/20 rounded-lg border border-gray-200 dark:border-brand-light-purple/30">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
              {lastQuiz ? 'No leaderboard data available for this quiz yet.' : 'Complete a quiz to see the leaderboard.'}
            </p>
          </div>
        )}
      </div>
      
      {/* Badges - Removed since badges are shown in completion screen */}
    </div>
  );
};

export default LastQuiz;