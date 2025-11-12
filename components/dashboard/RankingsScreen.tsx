import React, { useState, useMemo, useEffect } from 'react';
import { FilterIcon, PodiumLaurel, ListLaurel, GenericListAvatar, AvatarRank1, AvatarRank2, AvatarRank3 } from '../icons';
import { ProfileData } from '../StudentDashboard';
import { useTranslations } from '../../hooks/useTranslations';
import { ClassStudent } from '../../data/classStudentData';
import { TeacherQuiz } from '../../data/teacherQuizzes';
import { rankingsApi } from '../../src/api';

const laurelColors: { [key: number]: string } = {
    1: '#FFD700', // Gold
    2: '#C0C0C0', // Silver
    3: '#CD7F32', // Bronze
};

interface PodiumItemProps {
    rank: number;
    name: string;
    Avatar: React.FC;
    order: number;
    elevated?: boolean;
}

const PodiumItem: React.FC<PodiumItemProps> = ({ rank, name, Avatar, order, elevated }) => (
    <div className={`flex flex-col items-center order-${order} ${elevated ? '-translate-y-5' : ''}`}>
        <div className="relative w-24 h-24">
            <div className="w-full h-full rounded-2xl bg-gray-100 dark:bg-brand-light-purple flex items-center justify-center overflow-hidden">
                <Avatar />
            </div>
            <div className="absolute -bottom-8 -left-3 w-32 h-32">
                 <PodiumLaurel color={laurelColors[rank]} />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/30 dark:bg-black/30 rounded-full flex items-center justify-center font-bold text-lg" style={{ color: laurelColors[rank], textShadow: `0 0 5px ${laurelColors[rank]}`}}>
                {rank}
            </div>
        </div>
        <p className="text-center font-semibold text-sm mt-2 truncate max-w-[80px]">{name}</p>
    </div>
);

const LeaderboardItem: React.FC<{rank: number, name: string, score: number, showPercent: boolean, isCurrentUser?: boolean}> = ({ rank, name, score, showPercent, isCurrentUser }) => (
    <div className={`flex items-center justify-between py-3 px-4 rounded-lg border ${isCurrentUser ? 'bg-brand-accent/10 dark:bg-brand-light-purple/50 border-brand-accent/30' : 'bg-white dark:bg-brand-mid-purple/60 border-brand-light-purple/30'}`}>
        <div className="flex items-center space-x-3 flex-1">
            <div className="w-8 h-8 bg-brand-mid-purple dark:bg-brand-light-purple border border-brand-light-purple/50 rounded flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-sm text-white">{rank}</span>
            </div>
            <span className={`font-semibold ${isCurrentUser ? 'text-gray-800 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{name}</span>
        </div>
        <span className="font-bold text-brand-glow ml-2">{showPercent ? `${score.toFixed(2)}%` : Math.round(score)}</span>
    </div>
);

interface FilterMenuProps {
    onClose: () => void;
    availableQuizzes: TeacherQuiz[];
    filters: {
        mode: 'SOLO' | 'TEAM' | 'CLASSROOM';
        scope: 'all' | 'per';
        quizId: string;
    };
    onFilterChange: (newFilters: FilterMenuProps['filters']) => void;
}

const FilterMenu: React.FC<FilterMenuProps> = ({ onClose, availableQuizzes, filters, onFilterChange }) => {
    const { t } = useTranslations();
    
    const setFilter = (key: keyof typeof filters, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (key === 'scope' && value === 'all') {
            newFilters.quizId = ''; // Reset quizId when switching to all quizzes
        }
        if (key === 'mode') {
            newFilters.scope = 'all'; // Reset scope when changing mode
            newFilters.quizId = '';
        }
        onFilterChange(newFilters);
    };

    const modeButtons: ('SOLO' | 'TEAM' | 'CLASSROOM')[] = ['SOLO', 'TEAM', 'CLASSROOM'];
    const scopeButtons = [{id: 'all', label: t('allQuizzes')}, {id: 'per', label: t('perQuiz')}] as const;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="relative w-80 text-gray-800 dark:text-white"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute inset-x-0 top-2 h-full bg-blue-600/50 rounded-2xl transform scale-105 blur-sm"></div>
                <div className="absolute inset-x-1 top-1 h-full bg-brand-light-purple/60 rounded-2xl transform scale-102"></div>
                
                <div className="relative bg-white/90 dark:bg-brand-mid-purple/90 backdrop-blur-lg rounded-xl border border-white/20 p-4 space-y-2">
                    <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 dark:text-white/70 hover:text-gray-800 dark:hover:text-white transition-colors" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    {modeButtons.map(mode => (
                        <div key={mode}>
                            <button 
                                onClick={() => setFilter('mode', mode)}
                                className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-300 border flex justify-between items-center
                                            ${filters.mode === mode 
                                                ? 'bg-brand-accent shadow-glow border-brand-glow text-white' 
                                                : 'bg-black/10 dark:bg-black/40 border-gray-300 dark:border-brand-light-purple/50 text-gray-700 dark:text-gray-300 hover:bg-black/20 dark:hover:bg-black/60'}`}
                            >
                                <span>{t(mode === 'CLASSROOM' ? 'rankingsClassroom' : mode.toLowerCase())}</span>
                                {filters.mode === mode && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                            
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${filters.mode === mode ? 'max-h-96 pt-2' : 'max-h-0'}`}>
                                <div className="bg-black/10 dark:bg-black/20 p-1 rounded-lg flex justify-between space-x-1">
                                     {scopeButtons.map(scope => (
                                        <button 
                                            key={scope.id}
                                            onClick={() => setFilter('scope', scope.id)}
                                            className={`w-full py-2 rounded-md transition-colors duration-300 text-sm font-medium
                                                        ${filters.scope === scope.id 
                                                            ? 'bg-brand-light-purple text-white shadow-md'
                                                            : 'text-gray-500 dark:text-gray-400 hover:bg-white/10'}`}
                                        >
                                            {scope.label}
                                        </button>
                                    ))}
                                </div>
                                
                                {filters.mode === mode && filters.scope === 'per' && (
                                    <div className="mt-2 bg-black/10 dark:bg-black/20 p-1 rounded-lg max-h-48 overflow-y-auto hide-scrollbar">
                                        <h4 className="text-xs text-gray-500 dark:text-gray-400 font-semibold px-2 py-1">{t('selectAQuiz')}</h4>
                                        <div className="flex flex-col space-y-1">
                                            {availableQuizzes.map(quiz => (
                                                <button 
                                                    key={quiz.id}
                                                    onClick={() => setFilter('quizId', String(quiz.id))}
                                                    className={`w-full text-left py-2 px-3 rounded-md transition-colors duration-300 text-sm font-medium
                                                                ${filters.quizId === String(quiz.id)
                                                                    ? 'bg-brand-light-purple text-white'
                                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'}`}
                                                >
                                                    {quiz.title}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface RankingsScreenProps {
    profile: Pick<ProfileData, 'name'>;
    reportsData: any;
    classRosters: Record<string, ClassStudent[]>;
    studentJoinedClassIds: string[];
    postedQuizzes: TeacherQuiz[];
    teamsData: any;
}

const RankingsScreen: React.FC<RankingsScreenProps> = ({ profile, reportsData, classRosters, studentJoinedClassIds, postedQuizzes, teamsData }) => {
    const [isFilterMenuOpen, setFilterMenuOpen] = useState(false);
    const { t } = useTranslations();
    const [serverRankings, setServerRankings] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        mode: 'SOLO' as 'SOLO' | 'TEAM' | 'CLASSROOM',
        scope: 'all' as 'all' | 'per',
        quizId: '',
    });

    // Fetch server-side rankings (EXP-based) for the first joined class
    useEffect(() => {
        const classId = studentJoinedClassIds[0];
        if (!classId) {
            setServerRankings([]);
            return;
        }
        rankingsApi.byClass(classId)
            .then((res: any) => setServerRankings(Array.isArray(res?.rankings) ? res.rankings : []))
            .catch(() => setServerRankings([]));
    }, [studentJoinedClassIds.join(',')]);

    // Map filter mode to quiz mode format
    const modeMap: Record<'SOLO' | 'TEAM' | 'CLASSROOM', 'Solo' | 'Team' | 'Classroom'> = {
        'SOLO': 'Solo',
        'TEAM': 'Team',
        'CLASSROOM': 'Classroom',
    };

    const availableQuizzes = useMemo(() => {
        const classIds = new Set(studentJoinedClassIds);
        const quizMode = modeMap[filters.mode];
        return postedQuizzes.filter(quiz => 
            quiz.postedToClasses?.some(c => classIds.has(c.id)) &&
            quiz.mode === quizMode
        );
    }, [postedQuizzes, studentJoinedClassIds, filters.mode]);

    const rankedData = useMemo(() => {
        const currentClassId = studentJoinedClassIds[0];
        if (!currentClassId) return { top: [], list: [] };

        const classStudentSet = new Set(classRosters[currentClassId]?.map(s => s.name) || []);
        if (classStudentSet.size === 0) return { top: [], list: [] };

        const quizMode = modeMap[filters.mode];
        
        // Get quiz IDs that match the selected mode
        const classIds = new Set(studentJoinedClassIds);
        const matchingQuizIds = new Set(
            postedQuizzes
                .filter(quiz => 
                    quiz.mode === quizMode &&
                    quiz.postedToClasses?.some(c => classIds.has(c.id))
                )
                .map(quiz => String(quiz.id))
        );

        // Prefer server rankings (EXP) for SOLO/all view
        if (filters.mode === 'SOLO' && filters.scope === 'all' && serverRankings.length) {
            const list = serverRankings.map((r: any) => ({ rank: r.rank, name: r.name, score: Number(r.exp || 0) }));
            const podiumAvatars: {[key: number]: React.FC} = { 1: AvatarRank1, 2: AvatarRank2, 3: AvatarRank3 };
            const top3 = list.slice(0, 3).map((p: any) => ({ ...p, Avatar: podiumAvatars[p.rank] || GenericListAvatar }));
            const podiumOrder = [top3.find(p => p.rank === 2), top3.find(p => p.rank === 1), top3.find(p => p.rank === 3)].filter(Boolean) as PodiumItemProps[];
            return { top: podiumOrder, list: list.slice(3), percent: false };
        }

        if (filters.mode === 'TEAM') {
            const teams = teamsData[currentClassId] || {};
            const teamScores = Object.entries(teams).map(([teamName, members]: [string, string[]]) => {
                let totalScore = 0;
                let memberCountWithScore = 0;
                members.forEach(memberName => {
                    let scoreData;
                    if (filters.scope === 'all') {
                        // Filter by quiz mode when calculating team scores
                        const allScores = (reportsData?.singleQuizStudentScores || [])
                            .filter((s: any) => 
                                s.name === memberName && 
                                matchingQuizIds.has(String(s.quizNumber))
                            );
                        if (allScores.length > 0) {
                            const total = allScores.reduce((sum: number, s: any) => sum + parseFloat(s.score.replace('%', '') || '0'), 0);
                            const avg = total / allScores.length;
                            totalScore += avg;
                            memberCountWithScore++;
                        }
                    } else if (filters.scope === 'per' && filters.quizId) {
                        // Verify the selected quiz matches the mode
                        const selectedQuiz = postedQuizzes.find(q => String(q.id) === filters.quizId);
                        if (selectedQuiz && selectedQuiz.mode === quizMode) {
                            scoreData = (reportsData?.singleQuizStudentScores || []).find((s: any) => s.name === memberName && String(s.quizNumber) === filters.quizId);
                            if (scoreData) {
                                totalScore += parseFloat(scoreData.score.replace('%', '') || '0');
                                memberCountWithScore++;
                            }
                        }
                    }
                });
                const averageScore = memberCountWithScore > 0 ? totalScore / memberCountWithScore : 0;
                return { name: teamName, score: averageScore, Avatar: GenericListAvatar };
            });
            const sorted = teamScores.sort((a, b) => b.score - a.score).map((team, i) => ({ ...team, rank: i + 1 }));
            return { top: sorted.slice(0, 3), list: sorted.slice(3) };
        }

        let sourceData: any[] = [];
        if (filters.scope === 'all') {
            // Filter singleQuizStudentScores by quiz mode, then calculate averages per student
            const modeFilteredScores = (reportsData?.singleQuizStudentScores || [])
                .filter((s: any) => 
                    classStudentSet.has(s.name) && 
                    matchingQuizIds.has(String(s.quizNumber))
                );
            
            // Group by student name and calculate average
            const studentScoresMap = new Map<string, number[]>();
            modeFilteredScores.forEach((s: any) => {
                const score = parseFloat(s.score.replace('%', '') || '0');
                if (!studentScoresMap.has(s.name)) {
                    studentScoresMap.set(s.name, []);
                }
                studentScoresMap.get(s.name)!.push(score);
            });
            
            sourceData = Array.from(studentScoresMap.entries())
                .map(([name, scores]) => ({
                    name,
                    score: scores.reduce((sum, s) => sum + s, 0) / scores.length
                }))
                .sort((a: any, b: any) => b.score - a.score);
        } else if (filters.scope === 'per' && filters.quizId) {
            // Verify the selected quiz matches the mode
            const selectedQuiz = postedQuizzes.find(q => String(q.id) === filters.quizId);
            if (selectedQuiz && selectedQuiz.mode === quizMode) {
                sourceData = (reportsData?.singleQuizStudentScores || [])
                    .filter((s: any) => classStudentSet.has(s.name) && String(s.quizNumber) === filters.quizId)
                    .map((s: any) => ({ name: s.name, score: parseFloat(s.score.replace('%', '') || '0') }))
                    .sort((a: any, b: any) => b.score - a.score);
            }
        }

        const rankedList = sourceData.map((s, i) => ({ ...s, rank: i + 1 }));
        
        const podiumAvatars: {[key: number]: React.FC} = { 1: AvatarRank1, 2: AvatarRank2, 3: AvatarRank3 };
        const top3 = rankedList.slice(0, 3).map(p => ({ ...p, Avatar: podiumAvatars[p.rank] || GenericListAvatar }));
        const podiumOrder = [top3.find(p => p.rank === 2), top3.find(p => p.rank === 1), top3.find(p => p.rank === 3)].filter(Boolean) as PodiumItemProps[];

        return { top: podiumOrder, list: rankedList.slice(3), percent: true };

    }, [filters, reportsData, classRosters, studentJoinedClassIds, teamsData, serverRankings, postedQuizzes]);


    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-brand-mid-purple/80 rounded-2xl p-4">
                <div className="flex justify-end items-center mb-4">
                    <button onClick={() => setFilterMenuOpen(true)} aria-label={t('filterRankings')}>
                        <FilterIcon />
                    </button>
                </div>
                <div className="flex justify-around items-end h-36">
                    {rankedData.top.map((ranker, index) => (
                        <PodiumItem
                            key={ranker.rank}
                            rank={ranker.rank}
                            name={ranker.name}
                            Avatar={ranker.Avatar}
                            order={index + 1}
                            elevated={ranker.rank === 1}
                        />
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-brand-mid-purple/80 rounded-2xl p-2 space-y-1">
                {rankedData.list.map(player => (
                    <LeaderboardItem 
                        key={player.rank} 
                        rank={player.rank} 
                        name={player.name}
                        score={player.score}
                        showPercent={Boolean((rankedData as any).percent)}
                        isCurrentUser={player.name === profile.name}
                    />
                ))}
            </div>
            
            {isFilterMenuOpen && <FilterMenu 
                onClose={() => setFilterMenuOpen(false)} 
                availableQuizzes={availableQuizzes}
                filters={filters}
                onFilterChange={setFilters}
            />}
        </div>
    );
};

export default RankingsScreen;