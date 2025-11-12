import React, { useState, useMemo, useEffect } from 'react';
import Header from './dashboard/Header';
import NotificationCard from './dashboard/NotificationCard';
import LastQuiz from './dashboard/LastQuiz';
import BottomNav from './dashboard/BottomNav';
import { BellIcon, EnvelopeIcon, UserAddIcon } from './icons';
import JoinClassModal from './dashboard/JoinClassModal';
import { DashboardView, View, DoneQuiz, Quiz } from '../data/quizzes';
import QuizzesScreen from './dashboard/QuizzesScreen';
import RankingsScreen from './dashboard/RankingsScreen';
import BadgesScreen from './dashboard/BadgesScreen';
import ProfileScreen from './dashboard/ProfileScreen';
import { useTranslations } from '../hooks/useTranslations';
import ChatHubScreen from './dashboard/MessagesScreen';
import { ClassData } from './teacher/ClassroomScreen';
import QuizTakingScreen from './quiz/QuizTakingScreen';
import QuizCompletedScreen from './quiz/QuizCompletedScreen';
import { Badge, BadgeCategory } from '../data/badges';
import StudentQuizDetailModal from './dashboard/StudentQuizDetailModal';
import { TeacherQuiz } from '../data/teacherQuizzes';
import { ClassStudent } from '../data/classStudentData';
import TeamPlayersModal from './quiz/TeamPlayersModal';
import { Conversation, ChatMessage } from '../App';
import { TeacherProfileData } from './teacher/EditTeacherProfileModal';
import { API_URL } from '../server/src/config';

interface StudentDashboardProps {
  activeView: DashboardView;
  setView: (view: DashboardView) => void;
  setAppView: (view: View) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  classes: ClassData[];
  onAddStudentToClass: (classId: string, studentProfile: ProfileData) => void;
  newQuizzes: Quiz[];
  missedQuizzes: Quiz[];
  doneQuizzes: DoneQuiz[];
  takingQuiz: (Quiz & { teamMembers?: string[] }) | null;
  onTakeQuiz: (quiz: (Quiz & { teamMembers?: string[] })) => void;
  onQuizComplete: (quizId: number, results: { questionId: number; wasCorrect: boolean }[], teamMembers?: string[], expInfo?: { expGain: number; oldLevel: number; newLevel: number; oldExp: number; newExp: number }) => void;
  badgeProgress: BadgeCategory[];
  lastCompletedQuizStats: { quiz: DoneQuiz; earnedBadges: Badge[]; expInfo?: { expGain: number; oldLevel: number; newLevel: number; oldExp: number; newExp: number } } | null;
  onDismissCompletionScreen: () => void;
  profile: ProfileData;
  onSaveProfile: (newProfile: Partial<ProfileData>) => void;
  xpPerLevel: number;
  reportsData: any;
  classRosters: Record<string, ClassStudent[]>;
  studentJoinedClassIds: string[];
  postedQuizzes: TeacherQuiz[];
  teamsData: any;
  conversations: Conversation[];
  onSendMessage: (participant1: string, participant2: string, newMessage: Omit<ChatMessage, 'id'>) => void;
  onSendMessageToConversation: (conversationId: string, newMessage: Omit<ChatMessage, 'id'>) => void;
  teacherProfile: TeacherProfileData;
}

export interface ProfileData {
    name: string;
    bio: string;
    avatar: string | null;
    level: number;
    xp: number;
    accuracy: number;
    streaks: number;
}

interface Notification {
  id: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
    activeView, setView, setAppView, isDarkMode, onToggleDarkMode, 
    classes, onAddStudentToClass, newQuizzes, missedQuizzes, doneQuizzes, takingQuiz, onTakeQuiz, onQuizComplete,
    badgeProgress, lastCompletedQuizStats, onDismissCompletionScreen, profile, onSaveProfile,
    xpPerLevel, reportsData, classRosters, studentJoinedClassIds, postedQuizzes, teamsData,
    conversations, onSendMessage, onSendMessageToConversation, teacherProfile
}) => {
  const { t } = useTranslations();
  const [isJoinClassModalOpen, setJoinClassModalOpen] = useState(false);
  const [quizToViewDetails, setQuizToViewDetails] = useState<DoneQuiz | null>(null);
  const [quizForTeamSetup, setQuizForTeamSetup] = useState<Quiz | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load announcements for the student's joined classes
  useEffect(() => {
    const me = (() => {
      try { const raw = localStorage.getItem('currentUser'); return raw ? JSON.parse(raw) : null; } catch { return null; }
    })();
    const studentId = me?.id || me?.email;
    if (!studentId) return;

    let abort = false;
    const loadAnnouncements = async () => {
      try {
        const res = await fetch(`${API_URL}/api/announcements?studentId=${encodeURIComponent(String(studentId))}`);
        if (!res.ok) return;
        const anns: Array<{ id: string; title: string; body: string; classId?: string }> = await res.json();
        if (abort) return;
        const mapped: Notification[] = anns.map(a => {
          const klass = classes.find(c => String(c.id) === String(a.classId));
          const subtitle = klass ? `${klass.name}${klass.section ? ' - ' + klass.section : ''}` : 'Announcement';
          return {
            id: Date.now() + Math.random(),
            icon: <BellIcon />,
            title: a.title || 'Announcement',
            subtitle,
            description: a.body || '',
          };
        });
        setNotifications(mapped);
      } catch {
        // ignore
      }
    };

    loadAnnouncements();

    // Refresh when "class:joined" event fires
    const onJoined = () => loadAnnouncements();
    window.addEventListener('class:joined', onJoined as EventListener);
    return () => { abort = true; window.removeEventListener('class:joined', onJoined as EventListener); };
  }, [classes, studentJoinedClassIds]);
  
  const studentConversations = useMemo(() => {
    return conversations.filter(c => 
        c.participantNames.includes(profile.name) || 
        (c.id.startsWith('class-') && studentJoinedClassIds.includes(c.id.split('-')[1]))
    );
  }, [conversations, profile.name, studentJoinedClassIds]);
  
  const latestMessage = useMemo(() => {
    if (studentConversations.length === 0) return null;
    const mostRecentConversation = studentConversations[0];
    if (mostRecentConversation.messages.length === 0) return null;
    return mostRecentConversation.messages[mostRecentConversation.messages.length - 1];
  }, [studentConversations]);
  
  const handleDismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleJoinClassSuccess = (classData: ClassData) => {
      onAddStudentToClass(classData.id, profile);
      const newNotification: Notification = {
          id: Date.now(),
          icon: <UserAddIcon />,
          title: 'Class Joined!',
          subtitle: `You've successfully joined ${classData.name} - ${classData.section}.`,
          description: "You'll now get updates from this class."
      };
      setNotifications(prev => [newNotification, ...prev]);
  };

  const handleTakeQuiz = (quiz: Quiz) => {
    if (quiz.mode === 'Team') {
        setQuizForTeamSetup(quiz);
    } else {
        onTakeQuiz(quiz);
    }
  };

  const handleTeamSetupDone = (teamName: string, members: string[]) => {
    if (quizForTeamSetup) {
        console.log(`Team "${teamName}" created with members: ${members.join(', ')} for quiz "${quizForTeamSetup.topic}"`);
        onTakeQuiz({ ...quizForTeamSetup, teamMembers: members });
        setQuizForTeamSetup(null);
    }
  };


  if (takingQuiz) {
    return <QuizTakingScreen quiz={takingQuiz} onQuizComplete={onQuizComplete} />;
  }
  
  if (lastCompletedQuizStats) {
      let completionQuizScores: { name: string; score: string }[] = [];
      let currentUserTeamName: string | undefined = undefined;

      // Ensure reportsData has default structure to prevent errors
      const safeReportsData = reportsData || {
        singleQuizStudentScores: [],
        allQuizzesStudentScores: [],
      };

      if (lastCompletedQuizStats.quiz.mode === 'Team') {
          const currentClassId = studentJoinedClassIds[0];
          const classTeams = teamsData[currentClassId as keyof typeof teamsData] || {};
          
          for (const teamName in classTeams) {
              if (classTeams[teamName].includes(profile.name)) {
                  currentUserTeamName = teamName;
                  break;
              }
          }

          completionQuizScores = Object.entries(classTeams).map(([teamName, members]: [string, any[]]) => {
              let totalScore = 0;
              let memberCount = 0;
              members.forEach(memberName => {
                  const scoreData = safeReportsData.singleQuizStudentScores?.find(
                      (s: any) => s.name === memberName && s.quizNumber === lastCompletedQuizStats.quiz.id
                  );
                  if (scoreData) {
                      totalScore += parseFloat(scoreData.score);
                      memberCount++;
                  }
              });
              const avgScore = memberCount > 0 ? (totalScore / memberCount).toFixed(0) : '0';
              return { name: teamName, score: `${avgScore}%` };
          });
      } else {
          completionQuizScores = (safeReportsData.singleQuizStudentScores || []).filter(
              (s: any) => s.quizNumber === lastCompletedQuizStats.quiz.id
          );
      }

      return <QuizCompletedScreen 
        stats={lastCompletedQuizStats} 
        onDone={onDismissCompletionScreen} 
        profileName={profile.name}
        quizScores={completionQuizScores}
        quizMode={lastCompletedQuizStats.quiz.mode}
        currentUserTeamName={currentUserTeamName}
      />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'quizzes':
        return <QuizzesScreen newQuizzes={newQuizzes} missedQuizzes={missedQuizzes} doneQuizzes={doneQuizzes} onTakeQuiz={handleTakeQuiz} onViewDetails={setQuizToViewDetails} />;
      case 'rankings':
        return <RankingsScreen 
                    profile={profile} 
                    reportsData={reportsData}
                    classRosters={classRosters}
                    studentJoinedClassIds={studentJoinedClassIds}
                    postedQuizzes={postedQuizzes}
                    teamsData={teamsData}
                />;
      case 'badges':
        return <BadgesScreen badgeProgress={badgeProgress} />;
      case 'profile':
        return (
          <ProfileScreen 
            profile={profile} 
            onSave={onSaveProfile} 
            isDarkMode={isDarkMode} 
            onToggleDarkMode={onToggleDarkMode}
            setView={setView} 
            setAppView={setAppView}
            onViewMessages={() => setView('chat')}
            conversations={studentConversations}
            sectionName={(() => {
              const firstJoined = studentJoinedClassIds[0];
              const cls = classes.find(c => String(c.id) === String(firstJoined));
              return cls ? `${cls.name}${cls.section ? ' - ' + cls.section : ''}` : undefined;
            })()}
          />
        );
      case 'chat':
        return (
          <ChatHubScreen 
            userRole="student"
            currentUser={profile}
            conversations={studentConversations}
            contacts={[{name: teacherProfile.name}]}
            onSendMessage={onSendMessage}
            onSendMessageToConversation={onSendMessageToConversation}
            onBack={() => setView('profile')}
          />
        );
      case 'home':
      default:
        // Filter classes that the student has joined
        const joinedClasses = classes.filter(c => studentJoinedClassIds.includes(String(c.id)));
        
        return (
          <>
            {/* Joined Classes Section */}
            {joinedClasses.length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
                  {t('myClasses') || 'My Classes'}
                </h2>
                <div className="space-y-3">
                  {joinedClasses.map((classData) => (
                    <div
                      key={classData.id}
                      className="bg-gradient-to-r from-brand-mid-purple/90 to-brand-mid-purple/70 rounded-xl p-4 text-white border border-brand-light-purple/50 shadow-md"
                    >
                      <h3 className="font-bold text-lg mb-1">
                        {classData.name}{classData.section ? ` - ${classData.section}` : ''}
                      </h3>
                      <p className="text-sm opacity-90">
                        {t('classCode')}: {classData.code}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {notifications.map((notification) => (
                <NotificationCard
                    key={notification.id}
                    icon={notification.icon}
                    title={notification.title}
                    subtitle={notification.subtitle}
                    description={notification.description}
                    onDismiss={() => handleDismissNotification(notification.id)}
                />
            ))}
            {latestMessage && latestMessage.senderName !== profile.name && (
              <NotificationCard
                icon={<EnvelopeIcon />}
                title={t('message')}
                subtitle={`New message from ${latestMessage.senderName}`}
                description={latestMessage.text}
                onClick={() => setView('chat')}
              />
            )}
            <LastQuiz 
              doneQuizzes={doneQuizzes}
              reportsData={reportsData}
              currentUserId={profile?.id}
            />
          </>
        );
    }
  }
  
  const isFullScreenView = activeView === 'profile' || activeView === 'chat';

  return (
    <div className="w-full max-w-sm mx-auto h-screen flex flex-col text-gray-800 dark:text-white font-sans overflow-hidden">
      {!isFullScreenView && <Header profile={profile} onJoinClassClick={() => setJoinClassModalOpen(true)} xpPerLevel={xpPerLevel} />}
      <main className={`flex-grow overflow-y-auto pb-24 hide-scrollbar ${!isFullScreenView ? 'p-4 space-y-4' : ''}`}>
        {renderContent()}
      </main>
      <BottomNav activeView={activeView} onNavigate={setView} />
      <JoinClassModal 
        isOpen={isJoinClassModalOpen} 
        onClose={() => setJoinClassModalOpen(false)}
        onJoinSuccess={handleJoinClassSuccess}
        classes={classes}
      />
      <StudentQuizDetailModal
        isOpen={!!quizToViewDetails}
        quiz={quizToViewDetails}
        onClose={() => setQuizToViewDetails(null)}
      />
      <TeamPlayersModal
        isOpen={!!quizForTeamSetup}
        onClose={() => setQuizForTeamSetup(null)}
        onDone={handleTeamSetupDone}
        studentName={profile.name}
      />
    </div>
  );
};

export default StudentDashboard;
