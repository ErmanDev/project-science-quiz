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
import { ClassStudent } from './data/classStudentData';
import { TeacherQuiz } from './data/teacherQuizzes';
import { Quiz, DoneQuiz, View, DashboardView, QuestionResult } from './data/quizzes';
import { Question } from './data/teacherQuizQuestions';
import { Badge, BadgeCategory, badgeData } from './data/badges';
import { TeacherProfileData } from './components/teacher/EditTeacherProfileModal';
import { usePersistentState } from './hooks/usePersistentState';
import { API_URL } from './server/src/config';

// 🔧 import your taking UI
import QuizTakingScreen from './components/quiz/QuizTakingScreen';

/** --------------------
 *  Helpers
 * -------------------- */
type ServerSubmission = {
  id: string;
  quizId: string | number;
  studentId: string;
  score?: number;
  submittedAt?: string;
};

type ServerQuizSummary = {
  id: string | number;
  title: 'Card Game' | 'Board Game' | 'Normal' | string;
  type: 'Card Game' | 'Board Game' | 'Normal';
  mode: 'Solo' | 'Team' | 'Classroom';
  status: 'draft' | 'posted';
  teacherId: string;
  questions: Array<{ id: string | number; points: number }>;
  classIds?: string[];
  dueDate?: string | null;
};

const xpPerLevel = 500;

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

/** --------------------
 *  App
 * -------------------- */
const App: React.FC = () => {
  // High-level view state
  const [view, setView] = usePersistentState<View>('sciquest_view', 'main');
  const [dashboardView, setDashboardView] = usePersistentState<DashboardView>('sciquest_dashboardView', 'home');
  const [isDarkMode, setIsDarkMode] = usePersistentState<boolean>('sciquest_isDarkMode', true);
  const { t } = useTranslations();
  const [infoScreenReturnView, setInfoScreenReturnView] = usePersistentState<View>('sciquest_infoScreenReturnView', 'main');
  const [authFlowReturnView, setAuthFlowReturnView] = usePersistentState<'student' | 'teacher'>('sciquest_authFlowReturnView', 'student');

  // Server-backed states — start EMPTY, we fetch everything
  const [classes, setClasses] = usePersistentState<ClassData[]>('sciquest_classes', []);
  const [classRosters, setClassRosters] = usePersistentState<Record<string, ClassStudent[]>>('sciquest_classRosters', {});
  const [draftQuizzes, setDraftQuizzes] = usePersistentState<TeacherQuiz[]>('sciquest_draftQuizzes', []);
  const [postedQuizzes, setPostedQuizzes] = usePersistentState<TeacherQuiz[]>('sciquest_postedQuizzes', []);

  // Student quiz buckets (derived from server data)
  const [studentNewQuizzes, setStudentNewQuizzes] = usePersistentState<Quiz[]>('sciquest_studentNewQuizzes', []);
  const [studentDoneQuizzes, setStudentDoneQuizzes] = usePersistentState<DoneQuiz[]>('sciquest_studentDoneQuizzes', []);
  const [studentMissedQuizzes, setStudentMissedQuizzes] = usePersistentState<Quiz[]>('sciquest_studentMissedQuizzes', []);
  const [studentJoinedClassIds, setStudentJoinedClassIds] = usePersistentState<string[]>('sciquest_studentJoinedClassIds', []);

  // 🔧 Quiz in progress (ID-only, matches QuizTakingScreen prop)
  const [takingQuizId, setTakingQuizId] = useState<string | number | null>(null);
  const [takingTeam, setTakingTeam] = useState<string[] | undefined>(undefined);

  // Badges and completion pop
  const [badgeProgress, setBadgeProgress] = usePersistentState<BadgeCategory[]>('sciquest_badgeProgress', badgeData);
  const [lastCompletedQuizStats, setLastCompletedQuizStats] = usePersistentState<{ quiz: DoneQuiz; earnedBadges: Badge[]; } | null>('sciquest_lastCompletedQuizStats', null);

  // Profiles
  const [studentProfile, setStudentProfile] = usePersistentState<ProfileData>('sciquest_studentProfile', {
    name: 'Student',
    bio: '',
    avatar: null,
    level: 1,
    xp: 0,
    accuracy: 0,
    streaks: 0,
  });

  const [teacherProfile, setTeacherProfile] = usePersistentState<TeacherProfileData>('sciquest_teacherProfile', {
    name: 'Teacher',
    email: 'teacher@gmail.com',
    motto: '',
    avatar: null,
  });

  // Chat/announcements (start empty)
  const [conversations, setConversations] = usePersistentState('sciquest_conversations', [] as {
    id: string;
    participantNames: string[];
    messages: { id: number; text: string; senderName: string; timestamp: Date }[];
    title?: string;
  }[]);

  // Reports (start empty)
  const [reportsData, setReportsData] = usePersistentState('sciquest_reportsData', {
    singleQuizStudentScores: [] as { name: string; quizNumber: number | string; score: string; classId: string }[],
    allQuizzesStudentScores: [] as { name: string; average: number; classId: string }[],
  });

  /** --------------------
   *  Theme toggle
   * -------------------- */
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  /** --------------------
   *  Data loading (server)
   * -------------------- */
  useEffect(() => {
    const me = getCurrentUser();
    loadClasses();
    loadClassRosters().then((rosters) => {
      if (me?.id) {
        const joined = Object.entries(rosters)
          .filter(([classId, students]) => students.some(s => String((s as any).studentId || s.name || s.id) === String(me.id)))
          .map(([classId]) => classId);
        setStudentJoinedClassIds(joined);
      }
    });
    loadTeacherQuizzes();

    if (me?.id) {
      loadStudentQuizzesBuckets(me.id);
      loadSubmissionsAndUpdateDone(me.id);
    } else {
      setStudentNewQuizzes([]);
      setStudentMissedQuizzes([]);
      setStudentDoneQuizzes([]);
      setStudentJoinedClassIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  /** --------------------
   *  API Calls
   * -------------------- */
  async function loadClasses() {
    try {
      const res = await fetch(`${API_URL}/api/classes`);
      if (!res.ok) throw new Error('Failed to load classes');
      const items = await res.json();
      const mapped: ClassData[] = (items || []).map((c: any) => ({
        id: String(c.id),
        name: c.name || '',
        section: c.section || '',
        code: c.code || '',
        studentCount: Number(c.studentCount || 0),
      }));
      setClasses(mapped);
    } catch (e) {
      console.error(e);
      setClasses([]);
    }
  }

  async function loadClassRosters() {
    try {
      const res = await fetch(`${API_URL}/api/class-students`);
      if (!res.ok) throw new Error('Failed to load class-students');
      const items: Array<{ id: string; classId: string; studentId: string; joinedAt?: string }> = await res.json();

      const byClass: Record<string, ClassStudent[]> = {};
      for (const r of items || []) {
        const key = String(r.classId);
        if (!byClass[key]) byClass[key] = [];
        byClass[key].push({
          id: r.id,
          name: r.studentId,
          level: 1,
          streak: 0,
          accuracy: '0%',
          lastActive: '—',
        } as any);
      }

      setClassRosters(byClass);
      return byClass;
    } catch (e) {
      console.error(e);
      const empty: Record<string, ClassStudent[]> = {};
      setClassRosters(empty);
      return empty;
    }
  }

  async function loadTeacherQuizzes() {
    try {
      const d = await fetch(`${API_URL}/api/quizzes?status=draft`);
      const drafts: ServerQuizSummary[] = d.ok ? await d.json() : [];
      const p = await fetch(`${API_URL}/api/quizzes?status=posted`);
      const posted: ServerQuizSummary[] = p.ok ? await p.json() : [];

      const mapToTeacherQuiz = (q: ServerQuizSummary): TeacherQuiz => ({
        id: typeof q.id === 'string' ? (Number.isNaN(Number(q.id)) ? Date.now() : Number(q.id)) : Number(q.id),
        title: q.title as any,
        type: q.type,
        mode: q.mode,
        status: q.status,
        questions: [],
        dueDate: q.dueDate || undefined,
        postedToClasses: (q.classIds || []).map(cid => {
          const cls = classes.find(c => String(c.id) === String(cid));
          return { id: String(cid), name: cls?.name || '', section: cls?.section || '' };
        }),
      });

      setDraftQuizzes((drafts || []).map(mapToTeacherQuiz));
      setPostedQuizzes((posted || []).map(mapToTeacherQuiz));
    } catch (e) {
      console.error(e);
      setDraftQuizzes([]);
      setPostedQuizzes([]);
    }
  }

  async function loadStudentQuizzesBuckets(studentId: string) {
    try {
      const rosterRes = await fetch(`${API_URL}/api/class-students?studentId=${encodeURIComponent(studentId)}`);
      const roster: Array<{ classId: string }> = rosterRes.ok ? await rosterRes.json() : [];
      const classIds = uniq((roster || []).map(r => String(r.classId)));
      setStudentJoinedClassIds(classIds);

      // 👇 if you add classId filtering in your endpoint, you can call it once
      const qRes = await fetch(`${API_URL}/api/quizzes?status=posted`);
      const postedAll: ServerQuizSummary[] = qRes.ok ? await qRes.json() : [];
      const posted = postedAll.filter(q => (q.classIds || []).some(cid => classIds.includes(String(cid))));

      const sRes = await fetch(`${API_URL}/api/submissions?studentId=${encodeURIComponent(studentId)}`);
      const submissions: ServerSubmission[] = sRes.ok ? await sRes.json() : [];
      const subByQuiz = new Map(submissions.map(s => [String(s.quizId), s]));

      const now = Date.now();
      const toClientQuiz = (q: ServerQuizSummary): Quiz => ({
        id: q.id as any,
        topic: q.title as any,
        subpart: q.type,
        questions: (q.questions || []).map(it => ({
          id: Number(it.id),
          type: 'multiple-choice',
          question: '',
          options: [],
          answer: '',
          points: Number(it.points) || 1,
        })),
        dueDate: q.dueDate || undefined,
        mode: q.mode,
      });

      const newQs: Quiz[] = [];
      const missedQs: Quiz[] = [];
      const doneQs: DoneQuiz[] = [];

      for (const q of posted) {
        const sub = subByQuiz.get(String(q.id));
        if (sub) {
          doneQs.push({ ...toClientQuiz(q), score: '0/0', questionResults: [] });
          continue;
        }
        const dueMs = q.dueDate ? new Date(q.dueDate).getTime() : undefined;
        if (dueMs && dueMs < now) missedQs.push(toClientQuiz(q));
        else newQs.push(toClientQuiz(q));
      }

      const sortByDue = (a: Quiz, b: Quiz) =>
        (new Date(b.dueDate || 0).getTime()) - (new Date(a.dueDate || 0).getTime());
      newQs.sort(sortByDue);
      missedQs.sort(sortByDue);

      setStudentNewQuizzes(newQs);
      setStudentMissedQuizzes(missedQs);
      setStudentDoneQuizzes(doneQs);
    } catch (e) {
      console.error(e);
      setStudentNewQuizzes([]);
      setStudentMissedQuizzes([]);
      setStudentDoneQuizzes([]);
    }
  }

  async function loadSubmissionsAndUpdateDone(studentId: string) {
    try {
      const sRes = await fetch(`${API_URL}/api/submissions?studentId=${encodeURIComponent(studentId)}`);
      if (!sRes.ok) return;
      const subs: ServerSubmission[] = await sRes.json();
      if (!subs?.length) return;
      // merge if needed
    } catch (e) {
      console.error(e);
    }
  }

  /** --------------------
   *  Quiz Posting actions (teacher)
   * -------------------- */
  const handlePostQuiz = async (details: { quizId: number; dueDate: string; classIds: string[] }) => {
    try {
      const res = await fetch(`${API_URL}/api/quizzes/${details.quizId}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classIds: details.classIds, dueDate: details.dueDate }),
      });
      if (!res.ok) throw new Error('Failed to post quiz');
      await loadTeacherQuizzes();

      const me = getCurrentUser();
      if (me?.id) await loadStudentQuizzesBuckets(me.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnpostQuiz = async (quizId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/quizzes/${quizId}/unpost`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to unpost quiz');
      await loadTeacherQuizzes();

      const me = getCurrentUser();
      if (me?.id) await loadStudentQuizzesBuckets(me.id);
    } catch (e) {
      console.error(e);
    }
  };

  /** --------------------
   *  Student quiz completion
   * -------------------- */
  const updateStudentStats = (allDoneQuizzes: DoneQuiz[], currentProfile: ProfileData) => {
    let totalPoints = 0;
    allDoneQuizzes.forEach(quiz => {
      const parts = quiz.score.split('/');
      if (parts.length === 2) totalPoints += parseInt(parts[0], 10) || 0;
    });
    const xp = totalPoints * 10;
    const level = Math.floor(xp / xpPerLevel) + 1;

    let totalScore = 0;
    let totalPossible = 0;
    allDoneQuizzes.forEach(quiz => {
      const [s, p] = quiz.score.split('/');
      totalScore += parseInt(s, 10) || 0;
      totalPossible += parseInt(p, 10) || 0;
    });
    const accuracy = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

    const streaks = allDoneQuizzes.reduce((count, q) => {
      const [s, p] = q.score.split('/');
      const si = parseInt(s, 10);
      const pi = parseInt(p, 10);
      return count + (pi > 0 && si === pi ? 1 : 0);
    }, 0);

    const newProfile = { ...currentProfile, xp, level, accuracy, streaks };
    setStudentProfile(newProfile);
    return newProfile;
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

  const handleQuizComplete = async (quizId: number | string, results: { questionId: number; wasCorrect: boolean }[], teamMembers?: string[]) => {
    const quiz = [...studentNewQuizzes, ...studentMissedQuizzes].find(q => String(q.id) === String(quizId));
    if (!quiz || !quiz.questions) {
      setTakingQuizId(null);
      setTakingTeam(undefined);
      return;
    }

    let score = 0;
    results.forEach(result => {
      if (result.wasCorrect) {
        const question = quiz.questions!.find(q => q.id === result.questionId);
        if (question) score += question.points;
      }
    });
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const newDoneQuiz: DoneQuiz = { ...quiz, score: `${score}/${totalPoints}` };

    if (quiz.mode === 'Team' && teamMembers?.length) {
      const resultsMap = new Map(results.map(r => [r.questionId, r.wasCorrect]));
      newDoneQuiz.questionResults = quiz.questions.map((question, index) => ({
        questionId: question.id,
        wasCorrect: resultsMap.get(question.id) || false,
        studentName: teamMembers[index % teamMembers.length],
      })) as unknown as QuestionResult[];
    } else {
      newDoneQuiz.questionResults = results as QuestionResult[];
    }

    const updatedDoneQuizzes = [newDoneQuiz, ...studentDoneQuizzes];

    const { updatedBadgeProgress, newlyEarnedBadges } = checkAndAwardBadges(newDoneQuiz, studentDoneQuizzes);
    setBadgeProgress(updatedBadgeProgress);
    setLastCompletedQuizStats({ quiz: newDoneQuiz, earnedBadges: newlyEarnedBadges });

    setStudentNewQuizzes(prev => prev.filter(q => String(q.id) !== String(quizId)));
    setStudentMissedQuizzes(prev => prev.filter(q => String(q.id) !== String(quizId)));
    setStudentDoneQuizzes(updatedDoneQuizzes);

    const newProfile = updateStudentStats(updatedDoneQuizzes, studentProfile);

    setClassRosters(prevRosters => {
      const me = getCurrentUser();
      if (!me?.id) return prevRosters;

      const newR = { ...prevRosters };
      studentJoinedClassIds.forEach(classId => {
        if (newR[classId]) {
          newR[classId] = newR[classId].map(stu =>
            (stu.name === newProfile.name || String((stu as any).id) === String(me.id))
              ? { ...stu, level: newProfile.level, streak: newProfile.streaks, accuracy: `${newProfile.accuracy}%`, lastActive: t('today') }
              : stu
          );
        }
      });
      return newR;
    });

    // (Optional) POST submission to server here

    setReportsData(prev => {
      const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
      const studentName = newProfile.name;
      const currentClassId = studentJoinedClassIds[0];

      const newSingleScores = [...prev.singleQuizStudentScores];
      const existingIdx = newSingleScores.findIndex(s => s.name === studentName && String(s.quizNumber) === String(quizId));
      if (existingIdx > -1) {
        newSingleScores[existingIdx] = { ...newSingleScores[existingIdx], score: `${percentage}%` };
      } else if (currentClassId) {
        newSingleScores.push({ name: studentName, quizNumber: quizId, score: `${percentage}%`, classId: currentClassId });
      }

      const newAllScores = [...prev.allQuizzesStudentScores];
      const idx2 = newAllScores.findIndex(s => s.name === studentName);
      if (idx2 > -1) newAllScores[idx2] = { ...newAllScores[idx2], average: newProfile.accuracy };
      else if (currentClassId) newAllScores.push({ name: studentName, average: newProfile.accuracy, classId: currentClassId });

      return { singleQuizStudentScores: newSingleScores, allQuizzesStudentScores: newAllScores };
    });

    // 🔧 close taking view
    setTakingQuizId(null);
    setTakingTeam(undefined);
  };

  /** --------------------
   *  Messaging helpers
   * -------------------- */
  const handleSendMessageToConversation = (conversationId: string, newMessage: Omit<{ id: number; text: string; senderName: string; timestamp: Date }, 'id'>) => {
    setConversations(prev => {
      const i = prev.findIndex(c => c.id === conversationId);
      if (i > -1) {
        const updated = { ...prev[i] };
        updated.messages.push({ ...newMessage, id: Date.now() });
        const next = [...prev];
        next.splice(i, 1);
        next.unshift(updated);
        return next;
      }
      return prev;
    });
  };

  const handleSendMessage = (participant1: string, participant2: string, newMessage: Omit<{ id: number; text: string; senderName: string; timestamp: Date }, 'id'>) => {
    const conversationId = [participant1, participant2].sort().join('-');
    setConversations(prev => {
      const i = prev.findIndex(c => c.id === conversationId);
      if (i > -1) {
        const updated = { ...prev[i] };
        updated.messages.push({ ...newMessage, id: Date.now() });
        const next = [...prev];
        next.splice(i, 1);
        next.unshift(updated);
        return next;
      } else {
        const newConvo = { id: conversationId, participantNames: [participant1, participant2], messages: [{ ...newMessage, id: Date.now() }] };
        return [newConvo, ...prev];
      }
    });
  };

  const handleSendAnnouncement = (message: string, classIds: string[]) => {
    const newMessage = { text: message, senderName: teacherProfile.name, timestamp: new Date() };
    const conversationIds = classIds.map(id => `class-${id}-announcements`);
    setConversations(prev => {
      let next = [...prev];
      conversationIds.forEach(cid => {
        const i = next.findIndex(c => c.id === cid);
        if (i > -1) {
          const updated = { ...next[i] };
          updated.messages = [...updated.messages, { ...newMessage, id: Date.now() + Math.random() }];
          next.splice(i, 1);
          next.unshift(updated);
        } else {
          next.unshift({
            id: cid,
            title: `${classes.find(c => c.id === cid)?.name || 'Class'} - ${classes.find(c => c.id === cid)?.section || ''}`,
            participantNames: [teacherProfile.name],
            messages: [{ ...newMessage, id: Date.now() + Math.random() }],
          });
        }
      });
      return next;
    });
  };

  /** --------------------
   *  Auth / nav handlers
   * -------------------- */
  const handleSaveStudentProfile = (newProfile: Partial<ProfileData>) => setStudentProfile(prev => ({ ...prev, ...newProfile }));
  const handleSaveTeacherProfile = (newProfile: Partial<TeacherProfileData>) => setTeacherProfile(prev => ({ ...prev, ...newProfile }));
  const handleStudentAccountCreate = (username: string) => { setStudentProfile(prev => ({ ...prev, name: username, bio: 'New SciQuest Explorer!' })); setView('verifyAccount'); };
  const handleTeacherAccountCreate = (username: string) => { setTeacherProfile(prev => ({ ...prev, name: username, motto: 'New SciQuest Educator!' })); setView('verifyAccount'); };
  const handleBackToMain = () => setView('main');
  const handleLogin = () => { setView('studentDashboard'); setDashboardView('home'); };
  const handleTeacherLogin = () => setView('teacherDashboard');
  const handleAccountVerified = () => setView(authFlowReturnView);
  const navigateToInfoScreen = (target: 'help' | 'aboutUs' | 'privacyPolicy') => { setInfoScreenReturnView(view); setView(target); };

  // 🔧 Bridge from QuizzesScreen -> StudentDashboard -> App:
  //    accept either (id) or (quizObject) to be robust
  const handleTakeQuizInApp = (payload: any, team?: string[]) => {
    const pickedId =
      payload && typeof payload === 'object' ? payload.id :
        payload ?? null;

    console.log('[App] onTakeQuiz received id:', pickedId, 'raw:', payload);

    if (!pickedId) {
      console.error('[App] onTakeQuiz missing id!');
      return;
    }
    setTakingQuizId(pickedId);
    setTakingTeam(team);
  };

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
      default:
        return (
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

  const mainClasses =
    view === 'studentDashboard' || view === 'teacherDashboard'
      ? 'min-h-screen w-full bg-gray-50 dark:bg-brand-deep-purple font-sans'
      : view === 'help' || view === 'aboutUs' || view === 'privacyPolicy'
        ? 'min-h-screen w-full bg-brand-deep-purple font-sans'
        : 'min-h-screen w-full bg-brand-deep-purple flex items-center justify-center p-4 font-sans';

  const handleSetAppView = (targetView: View) => {
    if (['help', 'aboutUs', 'privacyPolicy'].includes(targetView)) navigateToInfoScreen(targetView as any);
    else setView(targetView);
  };

  return (
    <main className={mainClasses}>
      {view === 'studentDashboard' ? (
        // 🔧 If a quiz is currently selected, render the taking screen instead of the dashboard
        takingQuizId ? (
          <QuizTakingScreen
            quizId={takingQuizId}
            teamMembers={takingTeam}
            onQuizComplete={handleQuizComplete}
          />
        ) : (
          <StudentDashboard
            activeView={dashboardView}
            setView={setDashboardView}
            setAppView={handleSetAppView}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
            classes={classes}
            onAddStudentToClass={(classId, prof) => {
              // Optionally POST /api/class-students then reload:
              loadClassRosters();
            }}
            newQuizzes={studentNewQuizzes}
            missedQuizzes={studentMissedQuizzes}
            doneQuizzes={studentDoneQuizzes}

            // 🔧 wire the callback down so QuizzesScreen can call it
            onTakeQuiz={handleTakeQuizInApp}

            onQuizComplete={handleQuizComplete}
            badgeProgress={badgeProgress}
            lastCompletedQuizStats={lastCompletedQuizStats}
            onDismissCompletionScreen={() => setLastCompletedQuizStats(null)}
            profile={studentProfile}
            onSaveProfile={profile => setStudentProfile(profile)}
            xpPerLevel={xpPerLevel}
            reportsData={reportsData}
            classRosters={classRosters}
            studentJoinedClassIds={studentJoinedClassIds}
            postedQuizzes={postedQuizzes}
            teamsData={{}}
            conversations={conversations}
            onSendMessage={handleSendMessage}
            onSendMessageToConversation={handleSendMessageToConversation}
            teacherProfile={teacherProfile}
          />
        )
      ) : view === 'teacherDashboard' ? (
        <TeacherDashboard
          setAppView={handleSetAppView}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
          onSendAnnouncement={handleSendAnnouncement}
          classes={classes}
          classRosters={classRosters}
          onCreateClass={(name, section, code) => {
            // Optionally POST then reload:
            loadClasses();
          }}
          draftQuizzes={draftQuizzes}
          postedQuizzes={postedQuizzes}
          onSaveDraftQuiz={(q, questions) => {
            // Optionally POST then reload:
            loadTeacherQuizzes();
          }}
          onUpdateDraftQuiz={(updated) => {
            // Optionally PATCH then reload:
            loadTeacherQuizzes();
          }}
          onDeleteDraftQuiz={(quizId) => {
            // Optionally DELETE then reload:
            loadTeacherQuizzes();
          }}
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
