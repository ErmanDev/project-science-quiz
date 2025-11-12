import React, { useMemo } from 'react';
import { DoneQuiz } from '../../data/quizzes';
import { Badge } from '../../data/badges';
import { ListLaurel, GenericListAvatar } from '../icons';

interface QuizScore {
    name: string;
    score: string; // e.g. "90%"
}

interface QuizCompletedScreenProps {
  stats: {
    quiz: DoneQuiz;
    earnedBadges: Badge[];
    expInfo?: { expGain: number; oldLevel: number; newLevel: number; oldExp: number; newExp: number };
  };
  onDone: () => void;
  profileName: string;
  quizScores: QuizScore[];
  quizMode?: 'Solo' | 'Team' | 'Classroom';
  currentUserTeamName?: string;
}

const LeaderboardItem: React.FC<{ rank: number, name: string, score: number, isCurrentUser?: boolean }> = ({ rank, name, score, isCurrentUser }) => (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${isCurrentUser ? 'bg-brand-accent/20' : ''}`}>
        <div className="flex items-center space-x-3">
            <span className="font-bold text-sm w-6 text-center">{rank}</span>
            <GenericListAvatar />
            <span className={`font-semibold ${isCurrentUser ? 'text-white' : 'text-gray-300'}`}>{name}</span>
        </div>
        <div className="flex items-center space-x-2">
            <span className="font-bold text-brand-glow">{score}%</span>
            <ListLaurel />
        </div>
    </div>
);


const QuizCompletedScreen: React.FC<QuizCompletedScreenProps> = ({ stats, onDone, profileName, quizScores, quizMode, currentUserTeamName }) => {
    const { quiz, earnedBadges, expInfo } = stats;
    const [scoreStr, totalPointsStr] = quiz.score.split('/');
    const score = parseInt(scoreStr, 10);
    const totalPoints = parseInt(totalPointsStr, 10);
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    
    const leaderboard = useMemo(() => {
        return quizScores
            .map(player => ({
                name: player.name,
                score: parseFloat(player.score),
            }))
            .sort((a, b) => b.score - a.score)
            .map((player, index) => ({ ...player, rank: index + 1 }));
    }, [quizScores]);

    const levelUp = expInfo && expInfo.newLevel > expInfo.oldLevel;
    const expChange = expInfo ? expInfo.expGain : 0;

    return (
        <div className="w-full max-w-sm mx-auto h-screen flex flex-col items-center justify-center text-white p-4 bg-brand-deep-purple">
            <div className="w-full flex-grow flex flex-col justify-center space-y-4 overflow-hidden">
                <h1 className="text-4xl font-bold font-orbitron text-center">Quiz Complete!</h1>
                
                {/* EXP/Level Alert */}
                {expInfo && (
                    <div className={`bg-gradient-to-r ${expChange >= 0 ? 'from-green-500/80 to-emerald-500/80' : 'from-red-500/80 to-rose-500/80'} backdrop-blur-sm border ${expChange >= 0 ? 'border-green-400/50' : 'border-red-400/50'} rounded-2xl p-4 w-full flex flex-col items-center shadow-lg animate-pulse`}>
                        {levelUp ? (
                            <>
                                <h2 className="text-2xl font-bold text-white mb-2">🎉 Level Up! 🎉</h2>
                                <p className="text-lg font-semibold">Level {expInfo.oldLevel} → Level {expInfo.newLevel}</p>
                            </>
                        ) : (
                            <h2 className="text-xl font-semibold mb-2">Experience Gained</h2>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                            <span className={`text-2xl font-bold ${expChange >= 0 ? 'text-white' : 'text-white'}`}>
                                {expChange >= 0 ? '+' : ''}{expChange} EXP
                            </span>
                        </div>
                        <p className="text-sm text-white/90 mt-1">
                            Total: {expInfo.newExp} EXP
                        </p>
                    </div>
                )}
                
                {/* Score Card */}
                <div className="relative bg-brand-mid-purple/70 backdrop-blur-sm border border-brand-light-purple/50 rounded-2xl p-4 w-full flex flex-col items-center shadow-lg">
                    <h2 className="text-xl font-semibold">Your Score</h2>
                    <p className="text-6xl font-bold font-orbitron text-brand-glow my-1">{score}<span className="text-3xl text-gray-400">/{totalPoints}</span></p>
                    <p className="text-2xl font-bold text-green-400">{percentage}%</p>
                </div>

                {/* Badges Earned */}
                {earnedBadges.length > 0 && (
                    <div className="bg-brand-mid-purple/70 backdrop-blur-sm border border-brand-light-purple/50 rounded-2xl p-4 w-full flex flex-col items-center shadow-lg">
                        <h2 className="text-xl font-semibold mb-3">Badges Unlocked!</h2>
                        <div className="flex justify-center flex-wrap gap-3">
                            {earnedBadges.map(badge => (
                                <div key={badge.id} className="flex flex-col items-center w-20 text-center animate-pulse">
                                    <img src={badge.imgSrc} alt={badge.name} className="w-16 h-16 object-contain mb-1" />
                                    <p className="text-xs text-gray-300 leading-tight">{badge.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Leaderboard */}
                <div className="bg-brand-mid-purple/70 backdrop-blur-sm border border-brand-light-purple/50 rounded-2xl p-4 w-full flex flex-col shadow-lg flex-grow min-h-0">
                    <h2 className="text-xl font-semibold mb-2 text-center flex-shrink-0">Quiz Leaderboard</h2>
                    <div className="flex-grow overflow-y-auto hide-scrollbar pr-1 space-y-1">
                        {leaderboard.map(player => (
                           <LeaderboardItem 
                                key={player.rank} 
                                {...player} 
                                isCurrentUser={quizMode === 'Team' ? player.name === currentUserTeamName : player.name === profileName}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full flex-shrink-0 pt-4">
                 <button
                    onClick={onDone}
                    className="w-full bg-brand-accent text-white font-semibold py-3 px-4 rounded-lg
                               transition-all duration-300 ease-in-out
                               hover:bg-opacity-90 hover:shadow-glow
                               focus:outline-none focus:ring-2 focus:ring-brand-glow focus:ring-opacity-75"
                >
                    Done
                </button>
            </div>
        </div>
    );
};

export default QuizCompletedScreen;