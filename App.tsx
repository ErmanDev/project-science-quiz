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
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import { ClassData } from './components/ClassCard';
import { ClassStudent } from './data/classStudentData';
import { TeacherQuiz } from './data/teacherQuizzes';
import { Quiz, DoneQuiz, View, DashboardView } from './data/quizzes';
import { Badge, BadgeCategory, badgeData } from './data/badges';
import { TeacherProfileData } from './components/teacher/EditTeacherProfileModal';
import { usePersistentState } from './hooks/usePersistentState';
import { API_URL } from './server/src/config';
import QuizTakingScreen from './components/quiz/QuizTakingScreen';
import { badgesApi } from './src/api';

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
  // Reset badge progress once: clear localStorage to use default badgeData (all progress = 0)
  useEffect(() => {
    const stored = localStorage.getItem('sciquest_badgeProgress');
    if (stored) {
      // Clear stored badge progress to reset to default (all progress = 0)
      localStorage.removeItem('sciquest_badgeProgress');
    }
  }, []);
  
  const [badgeProgress, setBadgeProgress] = usePersistentState<BadgeCategory[]>('sciquest_badgeProgress', badgeData);
  const [lastCompletedQuizStats, setLastCompletedQuizStats] = usePersistentState<{ quiz: DoneQuiz; earnedBadges: Badge[]; expInfo?: { expGain: number; oldLevel: number; newLevel: number; oldExp: number; newExp: number } } | null>('sciquest_lastCompletedQuizStats', null);

  const [studentProfile, setStudentProfile] = usePersistentState<ProfileData>('sciquest_studentProfile', {
    name: 'Student', bio: '', avatar: null, level: 1, xp: 0, accuracy: 0, streaks: 0,
  });
  const [teacherProfile, setTeacherProfile] = usePersistentState<TeacherProfileData>('sciquest_teacherProfile', {
    name: 'Teacher', email: 'teacher@gmail.com', motto: '', avatar: null, activeClassId: '',
  });

  const [conversations, setConversations] = usePersistentState('sciquest_conversations', [] as {
    id: string; participantNames: string[]; messages: { id: number; text: string; senderName: string; timestamp: Date }[]; title?: string;
  }[]);

  const [reportsData, setReportsData] = useState<{
    singleQuizStudentScores: Array<{ name: string; quizNumber: number | string; score: string; classId: string; avatar?: string | null }>;
    allQuizzesStudentScores: Array<{ name: string; average: number; classId: string; avatar?: string | null }>;
  }>({
    singleQuizStudentScores: [],
    allQuizzesStudentScores: [],
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
    loadReportsData();

    if (me?.id) {
      // Refresh student profile (full name, bio, and section via users API)
      (async () => {
        try {
          const ures = await fetch(`${API_URL}/api/users/public/${encodeURIComponent(String(me.id))}`);
          if (ures.ok) {
            const u = await ures.json();
            setStudentProfile(prev => ({
              ...prev,
              name: u?.name || prev.name,
              bio: u?.bio ?? prev.bio,
              level: typeof u?.level === 'number' ? u.level : (prev.level || 1),
              xp: typeof u?.xp === 'number' ? u.xp : (typeof u?.exp === 'number' ? u.exp : (prev.xp || 0)),
              accuracy: typeof u?.accuracy === 'number' ? u.accuracy : (prev.accuracy || 0),
            }));
            // If the API returned class info, prefer it to set the first joined class id
            if (u?.class?.id) {
              setStudentJoinedClassIds(prev => {
                const next = new Set(prev);
                next.add(String(u.class.id));
                return Array.from(next);
              });
            }
          }
        } catch {}
      })();
      // Optimistically set from localStorage user immediately
      setTeacherProfile(prev => ({
        ...prev,
        name: me?.name || prev.name,
        email: me?.email || prev.email,
      }));
      // refresh teacher profile (name/email) dynamically from server if logged in
      (async () => {
        try {
          const ures = await fetch(`${API_URL}/api/users/${encodeURIComponent(String(me.id))}`);
          if (ures.ok) {
            const u = await ures.json();
            setTeacherProfile(prev => ({
              ...prev,
              name: u?.name || prev.name,
              email: u?.email || prev.email,
            }));
          }
        } catch (e) {
          // non-fatal
          console.warn('[App] Failed to refresh teacher profile', e);
        }
      })();
      loadStudentQuizzesBuckets(me.id);
      loadBadgeProgress(me.id);
    } else {
      setStudentNewQuizzes([]); setStudentMissedQuizzes([]); setStudentDoneQuizzes([]); setStudentJoinedClassIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Refresh student quizzes immediately after joining a class
  useEffect(() => {
    const handler = (e: any) => {
      const me = getCurrentUser();
      if (me?.id) {
        loadStudentQuizzesBuckets(me.id);
        loadBadgeProgress(me.id);
      }
    };
    window.addEventListener('class:joined' as any, handler);
    return () => window.removeEventListener('class:joined' as any, handler);
  }, []);

  // Refresh badge progress when badges view is accessed
  useEffect(() => {
    if (view === 'studentDashboard' && dashboardView === 'badges') {
      const me = getCurrentUser();
      if (me?.id) {
        loadBadgeProgress(me.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardView]);

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
      
      // Fetch all users to get student names
      const usersRes = await fetch(`${API_URL}/api/users?role=student`);
      const users: Array<{ id: string; name: string }> = usersRes.ok ? await usersRes.json() : [];
      const userMap = new Map(users.map(u => [String(u.id), u.name]));
      
      const byClass: Record<string, ClassStudent[]> = {};
      for (const r of items || []) {
        const key = String(r.classId);
        if (!byClass[key]) byClass[key] = [];
        const studentName = userMap.get(String(r.studentId)) || r.studentId;
        byClass[key].push({ id: r.id, name: studentName, level: 1, streak: 0, accuracy: '0%', lastActive: '—' } as any);
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

  async function loadReportsData() {
    try {
      const res = await fetch(`${API_URL}/api/reports`);
      if (res.ok) {
        const data = await res.json();
        setReportsData({
          singleQuizStudentScores: data.singleQuizStudentScores || [],
          allQuizzesStudentScores: data.allQuizzesStudentScores || [],
        });
      } else {
        setReportsData({ singleQuizStudentScores: [], allQuizzesStudentScores: [] });
      }
    } catch (error) {
      console.error('[App] Failed to load reports data:', error);
      setReportsData({ singleQuizStudentScores: [], allQuizzesStudentScores: [] });
    }
  }

  async function loadBadgeProgress(studentId: string) {
    try {
      const progress = await badgesApi.getProgress(studentId);
      setBadgeProgress(progress);
    } catch (error) {
      console.error('[App] Failed to load badge progress:', error);
      // Keep existing badge progress on error
    }
  }

  async function loadStudentQuizzesBuckets(studentId: string) {
    try {
      // classes joined
      const rosterRes = await fetch(`${API_URL}/api/class-students?studentId=${encodeURIComponent(studentId)}`);
      const roster: Array<{ classId: string }> = rosterRes.ok ? await rosterRes.json() : [];
      const classIds = uniq((roster || []).map(r => String(r.classId)));
      setStudentJoinedClassIds(classIds);

      // posted quizzes - only show quizzes that:
      // 1. Belong to at least one class (have non-empty classIds array)
      // 2. The student has joined at least one of those classes
      const qRes = await fetch(`${API_URL}/api/quizzes?status=posted`);
      const postedAll: ServerQuizSummary[] = qRes.ok ? await qRes.json() : [];
      const posted = postedAll.filter(q => {
        // Only show quizzes that have classIds and the student is in at least one of those classes
        const quizClassIds = Array.isArray(q.classIds) ? q.classIds : [];
        return quizClassIds.length > 0 && 
               classIds.length > 0 && 
               quizClassIds.some(cid => classIds.includes(String(cid)));
      });

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
          category: 'Earth and Space',
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
      await loadReportsData();
      const me = getCurrentUser(); if (me?.id) await loadStudentQuizzesBuckets(me.id);
    } catch (e) { console.error(e); }
  };
  const handleUnpostQuiz = async (quizId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/quizzes/${quizId}/unpost`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to unpost quiz');
      await loadTeacherQuizzes();
      await loadReportsData();
      const me = getCurrentUser(); if (me?.id) await loadStudentQuizzesBuckets(me.id);
    } catch (e) { console.error(e); }
  };

  // quiz completion from taking screen
  const handleQuizComplete = async (
    quizId: number | string,
    _results: { questionId: number; wasCorrect: boolean }[],
    _teamMembers?: string[],
    expInfo?: { expGain: number; oldLevel: number; newLevel: number; oldExp: number; newExp: number },
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
      await loadBadgeProgress(me.id);
      await loadReportsData(); // Refresh reports after quiz completion
      try {
        const ures = await fetch(`${API_URL}/api/users/${encodeURIComponent(String(me.id))}`);
        if (ures.ok) {
          const u = await ures.json();
          setStudentProfile(prev => ({
            ...prev,
            name: u.name || prev.name,
            level: typeof u.level === 'number' ? u.level : (prev.level || 1),
            xp: typeof u.xp === 'number' ? u.xp : (typeof u.exp === 'number' ? u.exp : (prev.xp || 0)),
            accuracy: typeof u.accuracy === 'number' ? u.accuracy : (prev.accuracy || 0),
          }));
        }
      } catch (e) {
        console.error('[App] refresh user failed', e);
      }
      
      // Set completion stats with EXP info if available
      // Get submissions to find the quiz score
      let submissions: ServerSubmission[] = [];
      try {
        const sRes = await fetch(`${API_URL}/api/submissions?studentId=${encodeURIComponent(String(me.id))}`);
        if (sRes.ok) {
          submissions = await sRes.json();
        }
      } catch (e) {
        console.error('[App] Failed to load submissions for completion screen', e);
      }
      
      // Wait a bit for quizzes to load, then set completion stats
      if (expInfo) {
        setTimeout(() => {
          // Get the done quiz from the refreshed list
          const doneQuiz = studentDoneQuizzes.find(q => String(q.id) === String(quizId));
          if (doneQuiz) {
            setLastCompletedQuizStats({
              quiz: doneQuiz,
              earnedBadges: [], // Badges would be calculated elsewhere
              expInfo,
            });
          } else {
            // If not found, create a minimal done quiz from the quizId
            // Try to get score from submission if available
            const submission = submissions.find(s => String(s.quizId) === String(quizId));
            const scoreStr = submission 
              ? `${submission.score ?? 0}/${submission.totalPoints ?? 0}`
              : '0/0';
            
            setLastCompletedQuizStats({
              quiz: {
                id: quizId as any,
                topic: 'Quiz',
                subpart: 'Normal',
                questions: [],
                score: scoreStr,
                questionResults: [],
                mode: 'Solo', // Default mode
              },
              earnedBadges: [],
              expInfo,
            });
          }
        }, 100);
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
    (view === 'studentDashboard' || view === 'teacherDashboard' || view === 'adminDashboard')
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
            <SciQuestLogo onLogoClick={() => setView('admin')} />
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
            onAddStudentToClass={async (classId) => {
              try {
                // Ensure class rosters reflect membership
                const rosters = await loadClassRosters();
                // Update joined class ids immediately in UI
                setStudentJoinedClassIds(prev => {
                  const next = new Set(prev);
                  next.add(String(classId));
                  return Array.from(next);
                });
                // Optionally refresh posted quizzes bucket to show relevant quizzes
                const me = getCurrentUser();
                if (me?.id) {
                  await loadStudentQuizzesBuckets(me.id);
                }
              } catch {
                // ignore
              }
            }}
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
          reportsData={reportsData}
          profile={teacherProfile}
          onSaveProfile={(np) => setTeacherProfile(prev => ({ ...prev, ...np }))}
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
      ) : view === 'admin' ? (
        <CenteredCard>
          <AdminLogin
            onBack={() => setView('main')}
            onLogin={() => {
              setView('adminDashboard');
            }}
          />
        </CenteredCard>
      ) : view === 'adminDashboard' ? (
        <AdminDashboard
          onBackToLanding={() => setView('main')}
          onLogout={() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            setView('main');
          }}
        />
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
