// src/App.tsx
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
import { Quiz, DoneQuiz, View, DashboardView } from './data/quizzes';
import { Badge, BadgeCategory, badgeData } from './data/badges';
import { TeacherProfileData } from './components/teacher/EditTeacherProfileModal';
import { usePersistentState } from './hooks/usePersistentState';
import { API_URL } from './server/src/config';
import QuizTakingScreen from './components/quiz/QuizTakingScreen';

type ServerSubmission = {
  id: string;
  quizId: string | number;
  studentId: string;
  score?: number;
  percent?: number;
  submittedAt?: string;
};

type ServerQuizSummary = {
  id: string | number;
  title: string;
  type: 'Card Game' | 'Board Game' | 'Normal' | string;
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

/** Footer links kept on main page and reused under centered cards */
const FooterLinks: React.FC<{ onAbout: () => void; onHelp: () => void; onPrivacy: () => void }> = ({
  onAbout, onHelp, onPrivacy,
}) => (
  <div className="w-full mt-6">
    <div className="w-full border-t border-gray-500/50 my-6"></div>
    <div className="flex justify-around w-full text-sm text-gray-400">
      <button onClick={onAbout} className="bg-transparent border-none text-sm text-gray-400 hover:text-white transition-colors duration-300">
        About SciQuest
      </button>
      <button onClick={onHelp} className="bg-transparent border-none text-sm text-gray-400 hover:text-white transition-colors duration-300">
        Help
      </button>
      <button onClick={onPrivacy} className="bg-transparent border-none text-sm text-gray-400 hover:text-white transition-colors duration-300">
        Privacy
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  // views
  const [view, setView] = usePersistentState<View>('sciquest_view', 'main');
  const [dashboardView, setDashboardView] = usePersistentState<DashboardView>('sciquest_dashboardView', 'home');
  const [isDarkMode, setIsDarkMode] = usePersistentState<boolean>('sciquest_isDarkMode', true);
  const { t } = useTranslations();
  const [infoScreenReturnView, setInfoScreenReturnView] = usePersistentState<View>('sciquest_infoScreenReturnView', 'main');
  const [authFlowReturnView, setAuthFlowReturnView] = usePersistentState<'student' | 'teacher'>('sciquest_authFlowReturnView', 'student');

  // data
  const [classes, setClasses] = usePersistentState<ClassData[]>('sciquest_classes', []);
  const [classRosters, setClassRosters] = usePersistentState<Record<string, ClassStudent[]>>('sciquest_classRosters', {});
  const [draftQuizzes, setDraftQuizzes] = usePersistentState<TeacherQuiz[]>('sciquest_draftQuizzes', []);
  const [postedQuizzes, setPostedQuizzes] = usePersistentState<TeacherQuiz[]>('sciquest_postedQuizzes', []);

  // student buckets
  const [studentNewQuizzes, setStudentNewQuizzes] = usePersistentState<Quiz[]>('sciquest_studentNewQuizzes', []);
  const [studentDoneQuizzes, setStudentDoneQuizzes] = usePersistentState<DoneQuiz[]>('sciquest_studentDoneQuizzes', []);
  const [studentMissedQuizzes, setStudentMissedQuizzes] = usePersistentState<Quiz[]>('sciquest_studentMissedQuizzes', []);
  const [studentJoinedClassIds, setStudentJoinedClassIds] = usePersistentState<string[]>('sciquest_studentJoinedClassIds', []);

  // taking quiz (ID-based)
  const [takingQuizId, setTakingQuizId] = useState<string | number | null>(null);
  const [takingTeam, setTakingTeam] = useState<string[] | undefined>(undefined);

  // badges / profile
  const [badgeProgress, setBadgeProgress] = usePersistentState<BadgeCategory[]>('sciquest_badgeProgress', badgeData);
  const [lastCompletedQuizStats, setLastCompletedQuizStats] = usePersistentState<{ quiz: DoneQuiz; earnedBadges: Badge[]; } | null>('sciquest_lastCompletedQuizStats', null);

  const [studentProfile, setStudentProfile] = usePersistentState<ProfileData>('sciquest_studentProfile', {
    name: 'Student', bio: '', avatar: null, level: 1, xp: 0, accuracy: 0, streaks: 0,
  });
  const [teacherProfile, setTeacherProfile] = usePersistentState<TeacherProfileData>('sciquest_teacherProfile', {
    name: 'Teacher', email: 'teacher@gmail.com', motto: '', avatar: null,
  });

  const [conversations, setConversations] = usePersistentState('sciquest_conversations', [] as {
    id: string; participantNames: string[]; messages: { id: number; text: string; senderName: string; timestamp: Date }[]; title?: string;
  }[]);

  const [reportsData] = usePersistentState('sciquest_reportsData', {
    singleQuizStudentScores: [] as { name: string; quizNumber: number | string; score: string; classId: string }[],
    allQuizzesStudentScores: [] as { name: string; average: number; classId: string }[],
  });

  // theme
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // initial load
  useEffect(() => {
    const me = getCurrentUser();
    loadClasses();
    loadClassRosters().then((rosters) => {
      if (me?.id) {
        const joined = Object.entries(rosters)
          .filter(([_, students]) =>
            students.some(s => String((s as any).name) === String(me.id) || String((s as any).studentId) === String(me.id))
          )
          .map(([classId]) => classId);
        setStudentJoinedClassIds(joined);
      }
    });
    loadTeacherQuizzes();

    if (me?.id) {
      loadStudentQuizzesBuckets(me.id);
    } else {
      setStudentNewQuizzes([]); setStudentMissedQuizzes([]); setStudentDoneQuizzes([]); setStudentJoinedClassIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  async function loadClasses() {
    try {
      const res = await fetch(`${API_URL}/api/classes`);
      const items = res.ok ? await res.json() : [];
      const mapped: ClassData[] = (items || []).map((c: any) => ({
        id: String(c.id), name: c.name || '', section: c.section || '', code: c.code || '', studentCount: Number(c.studentCount || 0),
      }));
      setClasses(mapped);
    } catch { setClasses([]); }
  }

  async function loadClassRosters() {
    try {
      const res = await fetch(`${API_URL}/api/class-students`);
      const items: Array<{ id: string; classId: string; studentId: string }> = res.ok ? await res.json() : [];
      const byClass: Record<string, ClassStudent[]> = {};
      for (const r of items || []) {
        const key = String(r.classId);
        if (!byClass[key]) byClass[key] = [];
        byClass[key].push({ id: r.id, name: r.studentId, level: 1, streak: 0, accuracy: '0%', lastActive: '—' } as any);
      }
      setClassRosters(byClass);
      return byClass;
    } catch { const empty: Record<string, ClassStudent[]> = {}; setClassRosters(empty); return empty; }
  }

  async function loadTeacherQuizzes() {
    try {
      const d = await fetch(`${API_URL}/api/quizzes?status=draft`);
      const drafts: ServerQuizSummary[] = d.ok ? await d.json() : [];
      const p = await fetch(`${API_URL}/api/quizzes?status=posted`);
      const posted: ServerQuizSummary[] = p.ok ? await p.json() : [];

      const mapToTeacherQuiz = (q: ServerQuizSummary): TeacherQuiz => ({
        id: Number(q.id), title: q.title, type: q.type as any, mode: q.mode as any, status: q.status as any,
        questions: [], dueDate: q.dueDate || undefined,
        postedToClasses: (q.classIds || []).map(cid => {
          const cls = classes.find(c => String(c.id) === String(cid));
          return { id: String(cid), name: cls?.name || '', section: cls?.section || '' };
        }),
      });

      setDraftQuizzes((drafts || []).map(mapToTeacherQuiz));
      setPostedQuizzes((posted || []).map(mapToTeacherQuiz));
    } catch { setDraftQuizzes([]); setPostedQuizzes([]); }
  }

  async function loadStudentQuizzesBuckets(studentId: string) {
    try {
      // classes joined
      const rosterRes = await fetch(`${API_URL}/api/class-students?studentId=${encodeURIComponent(studentId)}`);
      const roster: Array<{ classId: string }> = rosterRes.ok ? await rosterRes.json() : [];
      const classIds = uniq((roster || []).map(r => String(r.classId)));
      setStudentJoinedClassIds(classIds);

      // posted quizzes
      const qRes = await fetch(`${API_URL}/api/quizzes?status=posted`);
      const postedAll: ServerQuizSummary[] = qRes.ok ? await qRes.json() : [];
      const posted = postedAll.filter(q => (q.classIds || []).some(cid => classIds.includes(String(cid))));

      // submissions
      const sRes = await fetch(`${API_URL}/api/submissions?studentId=${encodeURIComponent(studentId)}`);
      const submissions: ServerSubmission[] = sRes.ok ? await sRes.json() : [];
      const subByQuiz = new Map(submissions.map(s => [String(s.quizId), s]));

      const now = Date.now();
      const toClientQuiz = (q: ServerQuizSummary): Quiz => ({
        id: q.id as any,
        topic: q.title as any,
        subpart: q.type as any,
        questions: (q.questions || []).map(it => ({
          id: Number(it.id),
          type: 'multiple-choice',
          question: '',
          options: [],
          answer: '',
          points: Number(it.points) || 1,
        })),
        dueDate: q.dueDate || undefined,
        mode: q.mode as any,
      });

      const newQs: Quiz[] = [];
      const missedQs: Quiz[] = [];
      const doneQs: DoneQuiz[] = [];

      for (const q of posted) {
        const sub = subByQuiz.get(String(q.id));
        if (sub) {
          doneQs.push({
            ...toClientQuiz(q),
            score: `${sub.score ?? 0}/${(q.questions || []).reduce((s, it) => s + (it.points || 0), 0)}`,
            questionResults: [],
          });
          continue;
        }
        const dueMs = q.dueDate ? new Date(q.dueDate).getTime() : undefined;
        if (dueMs && dueMs < now) missedQs.push(toClientQuiz(q));
        else newQs.push(toClientQuiz(q));
      }

      const sortByDue = (a: Quiz, b: Quiz) =>
        (new Date(a.dueDate || 0).getTime()) - (new Date(b.dueDate || 0).getTime());
      newQs.sort(sortByDue);
      missedQs.sort(sortByDue);

      setStudentNewQuizzes(newQs);
      setStudentMissedQuizzes(missedQs);
      setStudentDoneQuizzes(doneQs);
    } catch {
      setStudentNewQuizzes([]); setStudentMissedQuizzes([]); setStudentDoneQuizzes([]);
    }
  }

  // posting actions (teacher)
  const handlePostQuiz = async (details: { quizId: number; dueDate: string; classIds: string[] }) => {
    try {
      const res = await fetch(`${API_URL}/api/quizzes/${details.quizId}/post`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details),
      });
      if (!res.ok) throw new Error('Failed to post quiz');
      await loadTeacherQuizzes();
      const me = getCurrentUser(); if (me?.id) await loadStudentQuizzesBuckets(me.id);
    } catch (e) { console.error(e); }
  };
  const handleUnpostQuiz = async (quizId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/quizzes/${quizId}/unpost`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to unpost quiz');
      await loadTeacherQuizzes();
      const me = getCurrentUser(); if (me?.id) await loadStudentQuizzesBuckets(me.id);
    } catch (e) { console.error(e); }
  };

  // quiz completion from taking screen
  const handleQuizComplete = async (
    quizId: number | string,
    _results: { questionId: number; wasCorrect: boolean }[],
  ) => {
    // close taking screen
    setTakingQuizId(null);
    setTakingTeam(undefined);

    // remove from New/Missed immediately
    setStudentNewQuizzes(prev => prev.filter(q => String(q.id) !== String(quizId)));
    setStudentMissedQuizzes(prev => prev.filter(q => String(q.id) !== String(quizId)));

    // refresh buckets & user stats from server (brings it into Done)
    const me = getCurrentUser();
    if (me?.id) {
      await loadStudentQuizzesBuckets(me.id);
      try {
        const ures = await fetch(`${API_URL}/api/users/${encodeURIComponent(String(me.id))}`);
        if (ures.ok) {
          const u = await ures.json();
          setStudentProfile(prev => ({
            ...prev,
            name: u.name || prev.name,
            level: u.level ?? prev.level,
            xp: u.xp ?? prev.xp,
            accuracy: u.accuracy ?? prev.accuracy,
          }));
        }
      } catch (e) {
        console.error('[App] refresh user failed', e);
      }
    }
  };

  const handleTakeQuizInApp = (payload: any, team?: string[]) => {
    const pickedId = (payload && typeof payload === 'object') ? payload.id : payload;
    if (!pickedId) return;
    setTakingQuizId(pickedId);
    setTakingTeam(team);
  };

  const navigateToInfoScreen = (target: 'help'|'aboutUs'|'privacyPolicy') => {
    setInfoScreenReturnView(view);
    setView(target);
  };

  /** Layout classes */
  const mainClasses =
    (view === 'studentDashboard' || view === 'teacherDashboard')
      ? 'min-h-screen w-full bg-gray-50 dark:bg-brand-deep-purple font-sans'
      : 'min-h-screen w-full bg-brand-deep-purple font-sans';

  /** Shared centered card wrapper for login views so both are perfectly centered */
  const CenteredCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent to-purple-600 rounded-3xl blur-xl opacity-30"></div>
        <div className="relative bg-brand-mid-purple/60 backdrop-blur-sm border border-brand-light-purple/50 rounded-2xl text-white p-8 w-full flex flex-col items-center shadow-lg overflow-hidden">
          {children}
          <FooterLinks
            onAbout={() => navigateToInfoScreen('aboutUs')}
            onHelp={() => navigateToInfoScreen('help')}
            onPrivacy={() => navigateToInfoScreen('privacyPolicy')}
          />
        </div>
      </div>
    </div>
  );

  /** Main landing (original content kept) */
  const Landing: React.FC = () => (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent to-purple-600 rounded-3xl blur-xl opacity-30"></div>
        <div className="relative bg-brand-mid-purple/60 backdrop-blur-sm border border-brand-light-purple/50 rounded-2xl text-white p-8 w-full flex flex-col items-center shadow-lg overflow-hidden">
          <>
            <SciQuestLogo />
            <p className="mt-2 text-gray-300 text-center">{t('learnPlayMaster')}</p>
            <div className="w-full space-y-4 mt-8">
              <LoginButton onClick={() => { setView('student'); setAuthFlowReturnView('student'); }}>
                {t('loginAsStudent')}
              </LoginButton>
              <LoginButton onClick={() => { setView('teacher'); setAuthFlowReturnView('teacher'); }}>
                {t('loginAsTeacher')}
              </LoginButton>
            </div>
          </>
          <FooterLinks
            onAbout={() => navigateToInfoScreen('aboutUs')}
            onHelp={() => navigateToInfoScreen('help')}
            onPrivacy={() => navigateToInfoScreen('privacyPolicy')}
          />
        </div>
      </div>
    </div>
  );

  return (
    <main className={mainClasses}>
      {/* Student & Teacher dashboards OR Taking screen */}
      {view === 'studentDashboard' ? (
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
            setAppView={(v) => (['help','aboutUs','privacyPolicy'].includes(v) ? navigateToInfoScreen(v as any) : setView(v))}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(p => !p)}
            classes={classes}
            onAddStudentToClass={() => loadClassRosters()}
            newQuizzes={studentNewQuizzes}
            missedQuizzes={studentMissedQuizzes}
            doneQuizzes={studentDoneQuizzes}
            onTakeQuiz={handleTakeQuizInApp}
            onQuizComplete={handleQuizComplete}
            badgeProgress={badgeProgress}
            lastCompletedQuizStats={lastCompletedQuizStats}
            onDismissCompletionScreen={() => setLastCompletedQuizStats(null)}
            profile={studentProfile}
            onSaveProfile={setStudentProfile}
            xpPerLevel={xpPerLevel}
            reportsData={undefined as any}
            classRosters={classRosters}
            studentJoinedClassIds={studentJoinedClassIds}
            postedQuizzes={postedQuizzes}
            teamsData={{}}
            conversations={conversations}
            onSendMessage={() => {}}
            onSendMessageToConversation={() => {}}
            teacherProfile={{ name: 'Teacher', email: 'teacher@gmail.com', motto: '', avatar: null }}
          />
        )
      ) : view === 'teacherDashboard' ? (
        <TeacherDashboard
          setAppView={setView}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(p => !p)}
          onSendAnnouncement={() => {}}
          classes={classes}
          classRosters={classRosters}
          onCreateClass={() => loadClasses()}
          draftQuizzes={draftQuizzes}
          postedQuizzes={postedQuizzes}
          onSaveDraftQuiz={() => loadTeacherQuizzes()}
          onUpdateDraftQuiz={() => loadTeacherQuizzes()}
          onDeleteDraftQuiz={() => loadTeacherQuizzes()}
          onPostQuiz={handlePostQuiz}
          onUnpostQuiz={handleUnpostQuiz}
          reportsData={undefined as any}
          profile={{ name: 'Teacher', email: 'teacher@gmail.com', motto: '', avatar: null }}
          conversations={conversations}
          onSendMessage={() => {}}
          onSendMessageToConversation={() => {}}
        />
      ) : view === 'help' ? (
        <HelpScreen onBack={() => setView(infoScreenReturnView)} />
      ) : view === 'aboutUs' ? (
        <AboutUsScreen onBack={() => setView(infoScreenReturnView)} />
      ) : view === 'privacyPolicy' ? (
        <PrivacyPolicyScreen onBack={() => setView(infoScreenReturnView)} />
      ) : view === 'student' ? (
        <CenteredCard>
          <StudentLogin
            onBack={() => setView('main')}
            onForgotPassword={() => setView('forgotPassword')}
            onCreateAccount={() => setView('createAccount')}
            onLogin={() => { setView('studentDashboard'); setDashboardView('home'); }}
          />
        </CenteredCard>
      ) : view === 'teacher' ? (
        <CenteredCard>
          <TeacherLogin
            onBack={() => setView('main')}
            onForgotPassword={() => setView('forgotPassword')}
            onCreateAccount={() => setView('createTeacherAccount')}
            onLogin={() => setView('teacherDashboard')}
          />
        </CenteredCard>
      ) : view === 'forgotPassword' ? (
        <CenteredCard>
          <ForgotPassword onBack={() => setView(authFlowReturnView)} onSendCode={() => setView('verifyCode')} />
        </CenteredCard>
      ) : view === 'verifyCode' ? (
        <CenteredCard>
          <VerifyCode email="jhon***********@***.com" onSuccess={() => authFlowReturnView === 'student' ? setView('resetPassword') : setView(authFlowReturnView)} />
        </CenteredCard>
      ) : view === 'resetPassword' ? (
        <CenteredCard>
          <ResetPassword onPasswordReset={() => setView('passwordResetSuccess')} />
        </CenteredCard>
      ) : view === 'passwordResetSuccess' ? (
        <CenteredCard>
          <PasswordResetSuccess onFinish={() => setView(authFlowReturnView)} />
        </CenteredCard>
      ) : view === 'createAccount' ? (
        <CenteredCard>
          <CreateAccount onBack={() => setView(authFlowReturnView)} onAccountCreateSubmit={() => setView('verifyAccount')} />
        </CenteredCard>
      ) : view === 'createTeacherAccount' ? (
        <CenteredCard>
          <CreateTeacherAccount onBack={() => setView(authFlowReturnView)} onAccountCreateSubmit={() => setView('verifyAccount')} />
        </CenteredCard>
      ) : view === 'verifyAccount' ? (
        <CenteredCard>
          <VerifyCode email="jhon***********@***.com" onSuccess={() => setView(authFlowReturnView)} />
        </CenteredCard>
      ) : (
        <Landing />
      )}
    </main>
  );
};

export default App;
