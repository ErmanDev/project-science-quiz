import React, { useState, useEffect } from 'react';
import SciQuestLogo from './components/SciQuestLogo';
import LoginButton from './components/LoginButton';
import StudentLogin from './components/StudentLogin';
import ForgotPassword from './components/ForgotPassword';
import VerifyCode from './components/VerifyCode';
import ResetPassword from './components/ResetPassword';
import PasswordResetSuccess from './components/PasswordResetSuccess';
import CreateAccount from './components/CreateAccount';
import CreateTeacherAccount from './components/CreateTeacherAccount';
import StudentDashboard, { ProfileData } from './components/StudentDashboard';
import { useTranslations } from './hooks/useTranslations';
import HelpScreen from './components/HelpScreen';
import AboutUsScreen from './components/AboutUsScreen';
import PrivacyPolicyScreen from './components/PrivacyPolicyScreen';
import TeacherLogin from './components/TeacherLogin';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import { ClassData } from './components/teacher/ClassroomScreen';
import { ClassStudent, classStudentData } from './data/classStudentData';
import { TeacherQuiz, postedQuizzes as initialPostedQuizzes, draftQuizzes as initialDraftQuizzes } from './data/teacherQuizzes';
import { Quiz, newQuizzes as initialNewQuizzes, initialDoneQuizzes, DoneQuiz, View, DashboardView, initialMissedQuizzes, QuestionResult } from './data/quizzes';
import { Question } from './data/teacherQuizQuestions';
import { Badge, BadgeCategory, badgeData } from './data/badges';
import { AvatarRank1, AvatarRank2, AvatarRank3 } from './components/icons';
import { TeacherProfileData } from './components/teacher/EditTeacherProfileModal';
import { usePersistentState } from './hooks/usePersistentState';

export interface ChatMessage {
  id: number;
  text: string;
  senderName: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  participantNames: string[];
  messages: ChatMessage[];
  title?: string; // For group chats/announcements
}

const initialClasses: ClassData[] = [
    {
        id: '1',
        name: 'Grade 7',
        section: 'Integrity',
        code: 'ABC123',
        studentCount: classStudentData.length,
    },
    {
        id: '2',
        name: 'Grade 7',
        section: 'Fortitude',
        code: 'XYZ789',
        studentCount: 20,
    },
     {
        id: '3',
        name: 'Grade 7',
        section: 'Hope',
        code: 'QWE456',
        studentCount: 49,
    },
];

// Centralized data that gets updated on quiz completion
const xpPerLevel = 500;

const singleQuizScores = [
    // Scores for Quiz #2 (id: 2)
    { name: 'Jhon Rexell Pereira', quizNumber: 2, score: '90%', classId: '1' },
    { name: 'Neil Jordan Moron', quizNumber: 2, score: '80%', classId: '1' },
    { name: 'Joemari Atencio', quizNumber: 2, score: '75%', classId: '1' },
    { name: 'Maria Santos', quizNumber: 2, score: '95%', classId: '1' },
    { name: 'Juan Dela Cruz', quizNumber: 2, score: '85%', classId: '1' },
    { name: 'Lana del Rey', quizNumber: 2, score: '100%', classId: '1' },
    { name: 'Mike Johnson', quizNumber: 2, score: '90%', classId: '1' },
    // Scores for Quiz #3 (id: 3)
    { name: 'Jhon Rexell Pereira', quizNumber: 3, score: '80%', classId: '1' },
    { name: 'Lana del Rey', quizNumber: 3, score: '85%', classId: '1' },
    { name: 'Mike Johnson', quizNumber: 3, score: '95%', classId: '1' },
];

const allQuizzesScores = [
    // Class 1
    { name: 'Jhon Rexell Pereira', average: 85, classId: '1' },
    { name: 'Neil Jordan Moron', average: 72, classId: '1' },
    { name: 'Joemari Atencio', average: 68, classId: '1' },
    { name: 'Maria Santos', average: 85, classId: '1' },
    { name: 'Juan Dela Cruz', average: 72, classId: '1' },
    { name: 'Lana del Rey', average: 91, classId: '1' },
    { name: 'Mike Johnson', average: 88, classId: '1' },
    // Some students for class 2
    { name: 'Student X', average: 95, classId: '2' },
    { name: 'Student Y', average: 80, classId: '2' },
];

const teamsData = {
    '1': { // classId
        'Team Alpha': ['Jhon Rexell Pereira', 'Neil Jordan Moron', 'Joemari Atencio'],
        'Team Beta': ['Maria Santos', 'Juan Dela Cruz', 'Lana del Rey', 'Mike Johnson'],
    }
};

const App: React.FC = () => {
  const [view, setView] = usePersistentState<View>('sciquest_view', 'main');
  const [dashboardView, setDashboardView] = usePersistentState<DashboardView>('sciquest_dashboardView', 'home');
  const [isDarkMode, setIsDarkMode] = usePersistentState<boolean>('sciquest_isDarkMode', true);
  const { t } = useTranslations();
  const [infoScreenReturnView, setInfoScreenReturnView] = usePersistentState<View>('sciquest_infoScreenReturnView', 'main');
  const [authFlowReturnView, setAuthFlowReturnView] = usePersistentState<'student' | 'teacher'>('sciquest_authFlowReturnView', 'student');
  
  // Shared State
  const [classes, setClasses] = usePersistentState<ClassData[]>('sciquest_classes', initialClasses);
  const [classRosters, setClassRosters] = usePersistentState<Record<string, ClassStudent[]>>('sciquest_classRosters', { '1': classStudentData });
  const [draftQuizzes, setDraftQuizzes] = usePersistentState<TeacherQuiz[]>('sciquest_draftQuizzes', initialDraftQuizzes);
  const [postedQuizzes, setPostedQuizzes] = usePersistentState<TeacherQuiz[]>('sciquest_postedQuizzes', initialPostedQuizzes);
  
  // Student-specific state
  const [studentNewQuizzes, setStudentNewQuizzes] = usePersistentState<Quiz[]>('sciquest_studentNewQuizzes', initialNewQuizzes);
  const [studentDoneQuizzes, setStudentDoneQuizzes] = usePersistentState<DoneQuiz[]>('sciquest_studentDoneQuizzes', initialDoneQuizzes);
  const [studentMissedQuizzes, setStudentMissedQuizzes] = usePersistentState<Quiz[]>('sciquest_studentMissedQuizzes', initialMissedQuizzes);
  const [studentJoinedClassIds, setStudentJoinedClassIds] = usePersistentState<string[]>('sciquest_studentJoinedClassIds', ['1']); // Assume joined class 1
  const [takingQuiz, setTakingQuiz] = usePersistentState<(Quiz & { teamMembers?: string[] }) | null>('sciquest_takingQuiz', null);
  const [badgeProgress, setBadgeProgress] = usePersistentState<BadgeCategory[]>('sciquest_badgeProgress', badgeData);
  const [lastCompletedQuizStats, setLastCompletedQuizStats] = usePersistentState<{ quiz: DoneQuiz; earnedBadges: Badge[]; } | null>('sciquest_lastCompletedQuizStats', null);
  
  // Centralized student data state
  const [studentProfile, setStudentProfile] = usePersistentState<ProfileData>('sciquest_studentProfile', {
      name: 'Jhon Rexell Pereira',
      bio: '???',
      avatar: null,
      level: 1,
      xp: 0,
      accuracy: 0,
      streaks: 0,
  });

  // Centralized teacher data state
  const [teacherProfile, setTeacherProfile] = usePersistentState<TeacherProfileData>('sciquest_teacherProfile', {
      name: 'Lady Ashira',
      email: 'santos@example.com',
      motto: 'Motto',
      avatar: null,
  });

  const initialConversations: Conversation[] = [
    {
        id: 'Lady Ashira-Jhon Rexell Pereira',
        participantNames: ['Lady Ashira', 'Jhon Rexell Pereira'],
        messages: [
            { id: 1, text: 'Hi Jhon, how are you preparing for the upcoming physics quiz?', senderName: 'Lady Ashira', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
            { id: 2, text: 'Hello Ma\'am! I\'m reviewing my notes on Newtonian Mechanics.', senderName: 'Jhon Rexell Pereira', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5) },
            { id: 3, text: 'Great! Let me know if you have any questions.', senderName: 'Lady Ashira', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1) },
        ]
    }
  ];

  const [conversations, setConversations] = usePersistentState<Conversation[]>('sciquest_conversations', initialConversations);

  const handleSendMessageToConversation = (conversationId: string, newMessage: Omit<ChatMessage, 'id'>) => {
    setConversations(prev => {
        const convoIndex = prev.findIndex(c => c.id === conversationId);
        if (convoIndex > -1) {
            const updatedConvo = { ...prev[convoIndex] };
            updatedConvo.messages.push({ ...newMessage, id: Date.now() });
            const newConversations = [...prev];
            newConversations.splice(convoIndex, 1);
            newConversations.unshift(updatedConvo);
            return newConversations;
        }
        return prev;
    });
  };

  const handleSendMessage = (participant1: string, participant2: string, newMessage: Omit<ChatMessage, 'id'>) => {
    const conversationId = [participant1, participant2].sort().join('-');
    setConversations(prev => {
        const convoIndex = prev.findIndex(c => c.id === conversationId);
        if (convoIndex > -1) {
            const updatedConvo = { ...prev[convoIndex] };
            updatedConvo.messages.push({ ...newMessage, id: Date.now() });
            const newConversations = [...prev];
            newConversations.splice(convoIndex, 1); // remove old
            newConversations.unshift(updatedConvo); // add to front
            return newConversations;
        } else {
            const newConversation: Conversation = {
                id: conversationId,
                participantNames: [participant1, participant2],
                messages: [{ ...newMessage, id: Date.now() }],
            };
            return [newConversation, ...prev];
        }
    });
  };

    const handleSendAnnouncement = (message: string, classIds: string[]) => {
        const newMessage: Omit<ChatMessage, 'id'> = {
            text: message,
            senderName: teacherProfile.name,
            timestamp: new Date(),
        };

        const conversationIds = classIds.map(id => `class-${id}-announcements`);
        
        setConversations(prev => {
            let newConversations = [...prev];
            conversationIds.forEach(convoId => {
                const convoIndex = newConversations.findIndex(c => c.id === convoId);
                if (convoIndex > -1) {
                    const updatedConvo = { 
                        ...newConversations[convoIndex],
                        messages: [...newConversations[convoIndex].messages, { ...newMessage, id: Date.now() + Math.random() }]
                    };
                    newConversations.splice(convoIndex, 1);
                    newConversations.unshift(updatedConvo);
                }
            });
            return newConversations;
        });
    };

  const [reportsData, setReportsData] = usePersistentState('sciquest_reportsData', {
      singleQuizStudentScores: singleQuizScores.map(({ name, quizNumber, score, classId }) => ({ name, quizNumber, score, classId })),
      allQuizzesStudentScores: allQuizzesScores,
  });

  // Calculate initial student profile stats on load
  useEffect(() => {
    updateStudentStats(studentDoneQuizzes, studentProfile);
  }, []); // Run only once on initial load


  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const checkOverdueQuizzes = () => {
        const now = new Date();
        
        setStudentNewQuizzes(currentNewQuizzes => {
            const overdueQuizzes = currentNewQuizzes.filter(quiz => quiz.dueDate && new Date(quiz.dueDate) < now);

            if (overdueQuizzes.length > 0) {
                const overdueIds = new Set(overdueQuizzes.map(q => q.id));
                const remainingNewQuizzes = currentNewQuizzes.filter(quiz => !overdueIds.has(quiz.id));
                
                setStudentMissedQuizzes(prevMissed => {
                    const existingMissedIds = new Set(prevMissed.map(q => q.id));
                    const trulyNewMissedQuizzes = overdueQuizzes.filter(q => !existingMissedIds.has(q.id));
                    return [...prevMissed, ...trulyNewMissedQuizzes];
                });
                return remainingNewQuizzes;
            }
            
            return currentNewQuizzes; // No changes
        });
    };

    // Check every 5 seconds for demonstration purposes. A real app might do this differently.
    const interval = setInterval(checkOverdueQuizzes, 5000);

    return () => clearInterval(interval);
  }, []); // Run only once to set up the interval.

  const updateStudentStats = (allDoneQuizzes: DoneQuiz[], currentProfile: ProfileData) => {
    // Calculate XP and Level
    let totalPoints = 0;
    allDoneQuizzes.forEach(quiz => {
        const parts = quiz.score.split('/');
        if (parts.length === 2) {
            totalPoints += parseInt(parts[0], 10) || 0;
        }
    });
    const xp = totalPoints * 10;
    const level = Math.floor(xp / xpPerLevel) + 1;

    // Calculate Accuracy
    let totalScore = 0;
    let totalPossible = 0;
    allDoneQuizzes.forEach(quiz => {
        const parts = quiz.score.split('/');
        if (parts.length === 2) {
            totalScore += parseInt(parts[0], 10) || 0;
            totalPossible += parseInt(parts[1], 10) || 0;
        }
    });
    const accuracy = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

    // Calculate Streaks (perfect scores)
    const streaks = allDoneQuizzes.reduce((count, quiz) => {
        const parts = quiz.score.split('/');
        if (parts.length === 2) {
            const score = parseInt(parts[0], 10);
            const total = parseInt(parts[1], 10);
            if (!isNaN(score) && !isNaN(total) && total > 0 && score === total) {
                return count + 1;
            }
        }
        return count;
    }, 0);

    const newProfile = { ...currentProfile, xp, level, accuracy, streaks };
    setStudentProfile(newProfile);
    return newProfile;
  };

  const handleCreateClass = (className: string, section: string, classCode: string) => {
    const newClass: ClassData = { id: new Date().toISOString(), name: className, section, code: classCode, studentCount: 0 };
    setClasses(prev => [...prev, newClass]);

    const newConversation: Conversation = {
        id: `class-${newClass.id}-announcements`,
        title: `${newClass.name} - ${newClass.section}`,
        participantNames: [teacherProfile.name],
        messages: [],
    };
    setConversations(prev => [newConversation, ...prev]);
  };

  const handleAddStudentToClass = (classId: string, studentProfile: ProfileData) => {
      const newStudent: ClassStudent = {
          id: Date.now(), name: studentProfile.name, level: studentProfile.level,
          streak: 0, accuracy: '0%', lastActive: t('today'),
      };
      setClassRosters(prev => ({ ...prev, [classId]: [...(prev[classId] || []), newStudent] }));
      setClasses(prev => prev.map(c => c.id === classId ? { ...c, studentCount: c.studentCount + 1 } : c));
      setStudentJoinedClassIds(prev => prev.includes(classId) ? prev : [...prev, classId]);
      
      const conversationId = `class-${classId}-announcements`;
      setConversations(prev => prev.map(convo => {
          if (convo.id === conversationId && !convo.participantNames.includes(studentProfile.name)) {
              return {
                  ...convo,
                  participantNames: [...convo.participantNames, studentProfile.name]
              };
          }
          return convo;
      }));
  };

    const handleSaveDraftQuiz = (newQuiz: Omit<TeacherQuiz, 'id' | 'status'>, questions?: Question[]) => {
        const quizToAdd: TeacherQuiz = { ...newQuiz, id: Date.now(), status: 'draft', questions: questions || [] };
        setDraftQuizzes(prev => [...prev, quizToAdd]);
    };

    const handleUpdateDraftQuiz = (updatedQuiz: TeacherQuiz) => {
        setDraftQuizzes(prev => prev.map(q => q.id === updatedQuiz.id ? updatedQuiz : q));
    };

    const handleDeleteDraftQuiz = (quizId: number) => {
        setDraftQuizzes(prev => prev.filter(q => q.id !== quizId));
    };

    const handlePostQuiz = (details: { quizId: number; dueDate: string; classIds: string[] }) => {
        const quiz = draftQuizzes.find(q => q.id === details.quizId);
        if (quiz) {
            setDraftQuizzes(prev => prev.filter(q => q.id !== quiz.id));
            const postedClassesInfo = classes.filter(c => details.classIds.includes(c.id)).map(c => ({ id: c.id, name: c.name, section: c.section }));
            setPostedQuizzes(prev => [...prev, { ...quiz, status: 'posted', dueDate: details.dueDate, postedToClasses: postedClassesInfo }]);
            if (details.classIds.some(id => studentJoinedClassIds.includes(id))) {
                const newStudentQuiz: Quiz = { id: quiz.id, topic: quiz.title, subpart: quiz.type, questions: quiz.questions, dueDate: details.dueDate, mode: quiz.mode };
                setStudentNewQuizzes(prev => prev.some(q => q.id === newStudentQuiz.id) ? prev : [newStudentQuiz, ...prev]);
            }
        }
    };

    const handleUnpostQuiz = (quizId: number) => {
        const quiz = postedQuizzes.find(q => q.id === quizId);
        if (quiz) {
            setPostedQuizzes(prev => prev.filter(q => q.id !== quizId));
            const { dueDate, postedToClasses, ...restOfQuiz } = quiz;
            setDraftQuizzes(prev => [...prev, { ...restOfQuiz, status: 'draft' }]);
        }
    };
    
    const checkAndAwardBadges = (completedQuiz: DoneQuiz, allDoneQuizzes: DoneQuiz[]): { updatedBadgeProgress: BadgeCategory[]; newlyEarnedBadges: Badge[] } => {
      const newlyEarnedBadges: Badge[] = [];
      const updatedBadgeProgress = JSON.parse(JSON.stringify(badgeProgress));
      const allCompleted = [...allDoneQuizzes, completedQuiz];
      
      updatedBadgeProgress.find((c: BadgeCategory) => c.id === 'quiz_milestone')?.badges.forEach((badge: Badge) => {
          const wasEarned = badge.progress >= badge.goal;
          badge.progress = allCompleted.length;
          if (!wasEarned && badge.progress >= badge.goal) newlyEarnedBadges.push(badge);
      });
  
      updatedBadgeProgress.find((c: BadgeCategory) => c.id === 'perfect_score')?.badges.forEach((badge: Badge) => {
          const wasEarned = badge.progress >= badge.goal;
          const perfectCount = allCompleted.filter(q => q.score.split('/')[0] === q.score.split('/')[1]).length;
          badge.progress = perfectCount;
          if (!wasEarned && badge.progress >= badge.goal) newlyEarnedBadges.push(badge);
      });
  
      return { updatedBadgeProgress, newlyEarnedBadges };
    };

    const handleQuizComplete = (quizId: number, results: { questionId: number; wasCorrect: boolean }[], teamMembers?: string[]) => {
      const quiz = [...studentNewQuizzes, ...studentMissedQuizzes].find(q => q.id === quizId);
      if (!quiz || !quiz.questions) return;

      let score = 0;
      results.forEach(result => {
          if (result.wasCorrect) {
              const question = quiz.questions!.find(q => q.id === result.questionId);
              if (question) {
                  score += question.points;
              }
          }
      });
      const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

      const newDoneQuiz: DoneQuiz = { ...quiz, score: `${score}/${totalPoints}` };

      if (quiz.mode === 'Team' && teamMembers && teamMembers.length > 0) {
          const resultsMap = new Map(results.map(r => [r.questionId, r.wasCorrect]));
          newDoneQuiz.questionResults = quiz.questions.map((question, index) => ({
              questionId: question.id,
              wasCorrect: resultsMap.get(question.id) || false,
              studentName: teamMembers[index % teamMembers.length],
          }));
      } else {
          newDoneQuiz.questionResults = results;
      }

      const updatedDoneQuizzes = [newDoneQuiz, ...studentDoneQuizzes];
      
      // Update badge progress
      const { updatedBadgeProgress, newlyEarnedBadges } = checkAndAwardBadges(newDoneQuiz, studentDoneQuizzes);
      setBadgeProgress(updatedBadgeProgress);
      setLastCompletedQuizStats({ quiz: newDoneQuiz, earnedBadges: newlyEarnedBadges });
      
      // Update student's quiz lists
      setStudentNewQuizzes(prev => prev.filter(q => q.id !== quizId));
      setStudentDoneQuizzes(updatedDoneQuizzes);
      
      // Update student profile (XP, level, accuracy, streaks)
      const newProfile = updateStudentStats(updatedDoneQuizzes, studentProfile);
      
      // Update teacher-side class roster
      setClassRosters(prevRosters => {
          const newRosters = { ...prevRosters };
          studentJoinedClassIds.forEach(classId => {
              if (newRosters[classId]) {
                  newRosters[classId] = newRosters[classId].map(student => 
                      student.name === newProfile.name
                          ? { ...student, level: newProfile.level, streak: newProfile.streaks, accuracy: `${newProfile.accuracy}%`, lastActive: t('today') }
                          : student
                  );
              }
          });
          return newRosters;
      });
      
      // Update reports data
      setReportsData(prev => {
          const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
          const studentName = newProfile.name;
          const currentClassId = studentJoinedClassIds.length > 0 ? studentJoinedClassIds[0] : undefined;

          // Update single quiz scores
          const newSingleScores = [...prev.singleQuizStudentScores];
          const existingScoreIndex = newSingleScores.findIndex(s => s.name === studentName && s.quizNumber === quizId);

          if (existingScoreIndex > -1) {
              newSingleScores[existingScoreIndex] = { ...newSingleScores[existingScoreIndex], score: `${percentage}%` };
          } else if (currentClassId) {
              newSingleScores.push({
                  name: studentName,
                  quizNumber: quizId,
                  score: `${percentage}%`,
                  classId: currentClassId,
              });
          }

          // Update all quizzes (overall) scores
          const newAllScores = [...prev.allQuizzesStudentScores];
          const studentInAllScoresIndex = newAllScores.findIndex(s => s.name === studentName);

          if (studentInAllScoresIndex > -1) {
              newAllScores[studentInAllScoresIndex] = { ...newAllScores[studentInAllScoresIndex], average: newProfile.accuracy };
          } else if (currentClassId) {
              newAllScores.push({
                  name: studentName,
                  average: newProfile.accuracy,
                  classId: currentClassId,
              });
          }
          
          return { singleQuizStudentScores: newSingleScores, allQuizzesStudentScores: newAllScores };
      });

      setTakingQuiz(null);
    };

  const handleSaveStudentProfile = (newProfile: Partial<ProfileData>) => {
    setStudentProfile(prev => ({ ...prev, ...newProfile }));
  };
  
  const handleSaveTeacherProfile = (newProfile: Partial<TeacherProfileData>) => {
      setTeacherProfile(prev => ({ ...prev, ...newProfile }));
  };

  const handleStudentAccountCreate = (username: string) => {
    setStudentProfile(prev => ({ ...prev, name: username, bio: 'New SciQuest Explorer!' }));
    setView('verifyAccount');
  };
  
  const handleTeacherAccountCreate = (username: string) => {
    setTeacherProfile(prev => ({ ...prev, name: username, motto: 'New SciQuest Educator!' }));
    setView('verifyAccount');
  };

  const handleBackToMain = () => setView('main');
  const handleLogin = () => { setView('studentDashboard'); setDashboardView('home'); };
  const handleTeacherLogin = () => setView('teacherDashboard');
  const handleAccountVerified = () => setView(authFlowReturnView);
  const navigateToInfoScreen = (targetView: 'help' | 'aboutUs' | 'privacyPolicy') => { setInfoScreenReturnView(view); setView(targetView); };

  const renderLoginView = () => {
    switch (view) {
      case 'student': return <StudentLogin onBack={handleBackToMain} onForgotPassword={() => setView('forgotPassword')} onCreateAccount={() => setView('createAccount')} onLogin={handleLogin} />;
      case 'teacher': return <TeacherLogin onBack={handleBackToMain} onForgotPassword={() => setView('forgotPassword')} onCreateAccount={() => setView('createTeacherAccount')} onLogin={handleTeacherLogin} />;
      case 'forgotPassword': return <ForgotPassword onBack={() => setView(authFlowReturnView)} onSendCode={() => setView('verifyCode')} />;
      case 'verifyCode': return <VerifyCode email="jhon***********@***.com" onSuccess={() => authFlowReturnView === 'student' ? setView('resetPassword') : setView(authFlowReturnView)} />;
      case 'resetPassword': return <ResetPassword onPasswordReset={() => setView('passwordResetSuccess')} />;
      case 'passwordResetSuccess': return <PasswordResetSuccess onFinish={() => setView(authFlowReturnView)} />;
      case 'createAccount': return <CreateAccount onBack={() => setView(authFlowReturnView)} onAccountCreateSubmit={handleStudentAccountCreate} />;
      case 'createTeacherAccount': return <CreateTeacherAccount onBack={() => setView(authFlowReturnView)} onAccountCreateSubmit={handleTeacherAccountCreate} />;
      case 'verifyAccount': return <VerifyCode email="jhon***********@***.com" onSuccess={handleAccountVerified} />;
      default: return (
          <>
            <SciQuestLogo />
            <p className="mt-2 text-gray-300 text-center">{t('learnPlayMaster')}</p>
            <div className="w-full space-y-4 mt-8">
              <LoginButton onClick={() => { setView('student'); setAuthFlowReturnView('student'); }}>{t('loginAsStudent')}</LoginButton>
              <LoginButton onClick={() => { setView('teacher'); setAuthFlowReturnView('teacher'); }}>{t('loginAsTeacher')}</LoginButton>
            </div>
            <div className="w-full border-t border-gray-500/50 my-6"></div>
            <div className="flex justify-around w-full text-sm text-gray-400">
              <button onClick={() => navigateToInfoScreen('aboutUs')} className="bg-transparent border-none text-sm text-gray-400 hover:text-white transition-colors duration-300">{t('aboutSciQuest')}</button>
              <button onClick={() => navigateToInfoScreen('help')} className="bg-transparent border-none text-sm text-gray-400 hover:text-white transition-colors duration-300">{t('help')}</button>
              <button onClick={() => navigateToInfoScreen('privacyPolicy')} className="bg-transparent border-none text-sm text-gray-400 hover:text-white transition-colors duration-300">{t('privacy')}</button>
            </div>
          </>
        );
    }
  };
  
  const mainClasses = view === 'studentDashboard' || view === 'teacherDashboard' ? "min-h-screen w-full bg-gray-50 dark:bg-brand-deep-purple font-sans"
    : view === 'help' || view === 'aboutUs' || view === 'privacyPolicy' ? "min-h-screen w-full bg-brand-deep-purple font-sans"
    : "min-h-screen w-full bg-brand-deep-purple flex items-center justify-center p-4 font-sans";

  const handleSetAppView = (targetView: View) => {
    if (['help', 'aboutUs', 'privacyPolicy'].includes(targetView)) {
        navigateToInfoScreen(targetView as 'help' | 'aboutUs' | 'privacyPolicy');
    } else {
        setView(targetView);
    }
  };

  return (
    <main className={mainClasses}>
      {view === 'studentDashboard' ? (
        <StudentDashboard 
          activeView={dashboardView} 
          setView={setDashboardView} 
          setAppView={handleSetAppView}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
          classes={classes}
          onAddStudentToClass={handleAddStudentToClass}
          newQuizzes={studentNewQuizzes}
          missedQuizzes={studentMissedQuizzes}
          doneQuizzes={studentDoneQuizzes}
          takingQuiz={takingQuiz}
          onTakeQuiz={setTakingQuiz}
          onQuizComplete={handleQuizComplete}
          badgeProgress={badgeProgress}
          lastCompletedQuizStats={lastCompletedQuizStats}
          onDismissCompletionScreen={() => setLastCompletedQuizStats(null)}
          profile={studentProfile}
          onSaveProfile={handleSaveStudentProfile}
          xpPerLevel={xpPerLevel}
          reportsData={reportsData}
          classRosters={classRosters}
          studentJoinedClassIds={studentJoinedClassIds}
          postedQuizzes={postedQuizzes}
          teamsData={teamsData}
          conversations={conversations}
          onSendMessage={handleSendMessage}
          onSendMessageToConversation={handleSendMessageToConversation}
          teacherProfile={teacherProfile}
        />
      ) : view === 'teacherDashboard' ? (
        <TeacherDashboard 
            setAppView={handleSetAppView} 
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
            onSendAnnouncement={handleSendAnnouncement}
            classes={classes}
            classRosters={classRosters}
            onCreateClass={handleCreateClass}
            draftQuizzes={draftQuizzes}
            postedQuizzes={postedQuizzes}
            onSaveDraftQuiz={handleSaveDraftQuiz}
            onUpdateDraftQuiz={handleUpdateDraftQuiz}
            onDeleteDraftQuiz={handleDeleteDraftQuiz}
            onPostQuiz={handlePostQuiz}
            onUnpostQuiz={handleUnpostQuiz}
            reportsData={reportsData}
            profile={teacherProfile}
            onSaveProfile={handleSaveTeacherProfile}
            conversations={conversations}
            onSendMessage={handleSendMessage}
            onSendMessageToConversation={handleSendMessageToConversation}
        />
      ) : view === 'help' ? (
        <HelpScreen onBack={() => setView(infoScreenReturnView)} />
      ) : view === 'aboutUs' ? (
        <AboutUsScreen onBack={() => setView(infoScreenReturnView)} />
      ) : view === 'privacyPolicy' ? (
        <PrivacyPolicyScreen onBack={() => setView(infoScreenReturnView)} />
      ) : (
        <div className="relative w-full max-w-sm">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent to-purple-600 rounded-3xl blur-xl opacity-30"></div>
          <div className="relative bg-brand-mid-purple/60 backdrop-blur-sm border border-brand-light-purple/50 rounded-2xl text-white p-8 w-full flex flex-col items-center shadow-lg overflow-hidden">
            {renderLoginView()}
          </div>
        </div>
      )}
    </main>
  );
};

export default App;