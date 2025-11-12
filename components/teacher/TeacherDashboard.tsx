import React, { useState, useMemo } from 'react';
import { View } from '../../data/quizzes';
import TeacherHeader from './TeacherHeader';
import TeacherBottomNav, { TeacherDashboardView } from './TeacherBottomNav';
import DashboardScreen from './DashboardScreen';
import { useTranslations } from '../../hooks/useTranslations';
import CreateClassModal from './CreateClassModal';
import ClassroomScreen, { ClassData } from './ClassroomScreen';
import ClassDetailScreen from './ClassDetailScreen';
import QuizBankScreen from './QuizBankScreen';
import ReportsScreen from './ReportsScreen';
import TeacherProfileScreen from './TeacherProfileScreen';
import { TeacherQuiz } from '../../data/teacherQuizzes';
import { Question } from '../../data/teacherQuizQuestions';
import { TeacherProfileData } from './EditTeacherProfileModal';
import { ClassStudent } from '../../data/classStudentData';
import { Conversation, ChatMessage } from '../../App';
import ChatHubScreen from '../dashboard/MessagesScreen';

interface TeacherDashboardProps {
  setAppView: (view: View) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSendAnnouncement: (message: string, classIds: string[]) => void;
  classes: ClassData[];
  classRosters: Record<string, ClassStudent[]>;
  onCreateClass: (className: string, section: string, classCode: string) => void;
  draftQuizzes: TeacherQuiz[];
  postedQuizzes: TeacherQuiz[];
  onSaveDraftQuiz: (newQuiz: Omit<TeacherQuiz, 'id' | 'status'>, questions?: Question[]) => void;
  onUpdateDraftQuiz: (updatedQuiz: TeacherQuiz) => void;
  onDeleteDraftQuiz: (quizId: number) => void;
  onPostQuiz: (details: { quizId: number; dueDate: string; classIds: string[] }) => void;
  onUnpostQuiz: (quizId: number) => void;
  reportsData: any; // Contains data for reports screen
  profile: TeacherProfileData;
  onSaveProfile: (newProfile: Partial<TeacherProfileData>) => void;
  conversations: Conversation[];
  onSendMessage: (participant1: string, participant2: string, newMessage: Omit<ChatMessage, 'id'>) => void;
  onSendMessageToConversation: (conversationId: string, newMessage: Omit<ChatMessage, 'id'>) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
    setAppView, isDarkMode, onToggleDarkMode, onSendAnnouncement, classes, 
    classRosters, onCreateClass, draftQuizzes, postedQuizzes,
    onSaveDraftQuiz, onUpdateDraftQuiz, onDeleteDraftQuiz, onPostQuiz, onUnpostQuiz,
    reportsData, profile, onSaveProfile, conversations, onSendMessage, onSendMessageToConversation
}) => {
  const [activeView, setActiveView] = useState<TeacherDashboardView>('home');
  const [isCreateClassModalOpen, setCreateClassModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const { t } = useTranslations();

  const teacherConversations = useMemo(() => {
    return conversations.filter(c => c.participantNames.includes(profile.name) || c.id.startsWith('class-'));
  }, [conversations, profile.name]);

  const handleCreateClass = (className: string, section: string, classCode: string) => {
    onCreateClass(className, section, classCode);
    setCreateClassModalOpen(false);
  };

  const handleNavigate = (view: TeacherDashboardView) => {
    if (activeView === 'classroom' && view === 'classroom' && selectedClass) {
      setSelectedClass(null);
      return;
    }
    if (activeView === 'classroom' && selectedClass) {
        setSelectedClass(null);
    }
    setActiveView(view);
  };
  
  const allStudents = React.useMemo(() => {
    const studentMap = new Map<string, {name: string, id: number}>();
    Object.values(classRosters).flat().forEach(student => {
        if (!studentMap.has(student.name)) {
            studentMap.set(student.name, {name: student.name, id: student.id});
        }
    });
    return Array.from(studentMap.values());
  }, [classRosters]);


  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <DashboardScreen reportsData={reportsData} classes={classes} />;
      case 'announcements':
        return <ChatHubScreen
            userRole="teacher"
            currentUser={profile}
            conversations={teacherConversations}
            contacts={allStudents.map(s => ({name: s.name}))}
            onSendMessage={onSendMessage}
            onSendMessageToConversation={onSendMessageToConversation}
            onSendAnnouncement={onSendAnnouncement}
            classes={classes}
            onBack={() => setActiveView('profile')}
        />;
      case 'classroom':
        return selectedClass ? (
          <ClassDetailScreen 
            classData={selectedClass} 
            onBack={() => setSelectedClass(null)} 
            students={classRosters[selectedClass.id] || []}
          />
        ) : (
          <ClassroomScreen classes={classes} onOpenClass={setSelectedClass} />
        );
      case 'quizBank':
        return <QuizBankScreen
            draftQuizzes={draftQuizzes}
            postedQuizzes={postedQuizzes}
            classes={classes}
            onSaveDraftQuiz={onSaveDraftQuiz}
            onUpdateDraftQuiz={onUpdateDraftQuiz}
            onDeleteDraftQuiz={onDeleteDraftQuiz}
            onPostQuiz={onPostQuiz}
            onUnpostQuiz={onUnpostQuiz}
        />;
      case 'reports':
        return <ReportsScreen 
                    reportsData={reportsData}
                    classes={classes}
                    postedQuizzes={postedQuizzes} 
                    classRosters={classRosters}
                />;
      case 'profile':
        return <TeacherProfileScreen 
                    classes={classes} 
                    quizzes={[...draftQuizzes, ...postedQuizzes]} 
                    profile={profile} 
                    onSave={onSaveProfile}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={onToggleDarkMode}
                    setAppView={setAppView}
                    setView={setActiveView}
                    conversations={teacherConversations}
                />;
      default:
        return <DashboardScreen />;
    }
  }

  const isFullScreenView = activeView === 'profile' || activeView === 'announcements';

  return (
    <div className="relative w-full max-w-sm mx-auto h-screen flex flex-col text-gray-800 dark:text-white font-sans overflow-hidden">
        {!isFullScreenView && <TeacherHeader profile={profile} onCreateClassClick={() => setCreateClassModalOpen(true)} />}
        <main className={`relative flex-grow overflow-y-auto pb-24 hide-scrollbar ${!isFullScreenView ? 'p-4' : ''}`}>
            {renderContent()}
        </main>
        <TeacherBottomNav activeView={activeView} onNavigate={handleNavigate} />
        {activeView === 'classroom' && !selectedClass && (
            <button
              onClick={() => setCreateClassModalOpen(true)}
              className="absolute bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-blue-500 to-brand-accent rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-glow"
              aria-label={t('createNewClass')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
            </button>
        )}
        <CreateClassModal
            isOpen={isCreateClassModalOpen}
            onClose={() => setCreateClassModalOpen(false)}
            onCreate={handleCreateClass}
        />
    </div>
  );
};

export default TeacherDashboard;
