import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SciQuestLogo from './SciQuestLogo';
import { API_URL } from '../server/src/config';

interface AdminDashboardProps {
  onBackToLanding: () => void;
  onLogout: () => void;
}

interface AdminUser {
  id: string;
  role: 'teacher' | 'student' | 'admin';
  email: string;
  name: string;
  level?: number;
  xp?: number;
  accuracy?: number;
  createdAt?: string;
}

interface ClassSummary {
  id: string;
  name?: string;
  section?: string;
  teacherId?: string;
  studentCount?: number;
}

type TabKey = 'teachers' | 'students';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToLanding, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('teachers');
  const [teachers, setTeachers] = useState<AdminUser[]>([]);
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const currentAdmin = useMemo(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('authToken');
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = authHeaders();
      const commonOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        credentials: 'include',
      };

      const [teacherRes, studentRes, classesRes] = await Promise.all([
        fetch(`${API_URL}/api/users?role=teacher`, commonOptions),
        fetch(`${API_URL}/api/users?role=student`, commonOptions),
        fetch(`${API_URL}/api/classes`, {
          method: 'GET',
          credentials: 'include',
        }),
      ]);

      if (teacherRes.status === 401 || studentRes.status === 401) {
        setError('Your session expired. Please log in again.');
        onLogout();
        return;
      }
      if (!teacherRes.ok) throw new Error(await teacherRes.text() || 'Failed to load teachers');
      if (!studentRes.ok) throw new Error(await studentRes.text() || 'Failed to load students');
      if (!classesRes.ok) throw new Error(await classesRes.text() || 'Failed to load classes');

      const [teacherData, studentData, classesData] = await Promise.all([
        teacherRes.json(),
        studentRes.json(),
        classesRes.json(),
      ]);

      setTeachers(Array.isArray(teacherData) ? teacherData : []);
      setStudents(Array.isArray(studentData) ? studentData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (err: any) {
      console.error('[AdminDashboard] loadData failed', err);
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, onLogout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const list = activeTab === 'teachers' ? teachers : students;
    if (!term) return list;
    return list.filter((user) =>
      [user.name, user.email, user.role]
        .filter(Boolean)
        .map((field) => String(field).toLowerCase())
        .some((field) => field.includes(term)),
    );
  }, [activeTab, searchTerm, students, teachers]);

  const totalStudents = students.length;
  const totalTeachers = teachers.length;

  const classSummaryByTeacher = useMemo(() => {
    const map = new Map<string, number>();
    for (const cls of classes) {
      if (cls.teacherId) {
        const key = String(cls.teacherId);
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return map;
  }, [classes]);

  const totalClasses = classes.length;

  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Remove ${user.name} (${user.role}) permanently? This cannot be undone.`)) {
      return;
    }

    setBusyUserId(user.id);
    setFeedback(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...authHeaders(),
      };
      const res = await fetch(`${API_URL}/api/users/${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (res.status === 401) {
        setFeedback({ type: 'error', message: 'Session expired. Please log in again.' });
        onLogout();
        return;
      }
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to remove user');
      }

      setFeedback({ type: 'success', message: `${user.name} has been removed.` });
      await loadData();
    } catch (err: any) {
      console.error('[AdminDashboard] delete user failed', err);
      setFeedback({ type: 'error', message: err?.message || 'Unable to remove user' });
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-brand-deep-purple text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-10">
        <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:items-center md:justify-between mb-6 md:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 md:gap-6">
            <div className="flex-shrink-0">
              <SciQuestLogo />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-wide">Admin Control Center</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                Signed in as {currentAdmin?.name ?? currentAdmin?.email ?? 'Administrator'}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={onBackToLanding}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg border border-brand-accent text-brand-accent font-semibold hover:bg-brand-accent/10 transition"
            >
              Back to Landing
            </button>
            <button
              onClick={onLogout}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg bg-brand-accent text-white font-semibold shadow hover:bg-brand-accent/90 transition"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 md:mb-10">
          <div className="bg-white/90 dark:bg-brand-mid-purple/60 p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-brand-light-purple/30">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teachers</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2">{totalTeachers}</p>
            <p className="text-xs text-gray-400 mt-1">
              {classSummaryByTeacher.size} with active classes
            </p>
          </div>
          <div className="bg-white/90 dark:bg-brand-mid-purple/60 p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-brand-light-purple/30">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 uppercase tracking-wider">Students</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2">{totalStudents}</p>
            <p className="text-xs text-gray-400 mt-1">
              {students.filter(s => (s?.xp ?? 0) > 0).length} actively earning XP
            </p>
          </div>
          <div className="bg-white/90 dark:bg-brand-mid-purple/60 p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm border border-brand-light-purple/30">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 uppercase tracking-wider">Classes</p>
            <p className="text-2xl sm:text-3xl font-bold mt-2">{totalClasses}</p>
            <p className="text-xs text-gray-400 mt-1">
              {classes.reduce((sum, cls) => sum + (cls.studentCount ?? 0), 0)} total seats
            </p>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-brand-mid-purple/70 rounded-2xl sm:rounded-3xl shadow-xl border border-brand-light-purple/40 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/30 dark:border-brand-light-purple/30">
            <div className="flex gap-2 sm:gap-3">
              {(['teachers', 'students'] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-brand-accent text-white shadow-md'
                      : 'bg-transparent border border-brand-light-purple/30 text-gray-600 dark:text-gray-200'
                  }`}
                >
                  {tab === 'teachers' ? 'Teachers' : 'Students'}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name or email…"
              className="w-full sm:w-64 px-3 sm:px-4 py-2 text-sm rounded-full border border-gray-300 dark:border-brand-light-purple/40 bg-white/80 dark:bg-brand-deep-purple/60 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>

          <div className="max-h-[60vh] sm:max-h-[480px] overflow-auto">
            {loading ? (
              <div className="p-6 sm:p-8 text-center text-gray-500 dark:text-gray-200 text-sm">
                Loading {activeTab}…
              </div>
            ) : error ? (
              <div className="p-6 sm:p-8 text-center text-red-500 text-sm">{error}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500 dark:text-gray-200 text-sm">
                No {activeTab} found.
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block md:hidden divide-y divide-gray-200/60 dark:divide-brand-light-purple/20">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 hover:bg-gray-50/80 dark:hover:bg-brand-mid-purple/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm mb-1">{user.name || '—'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                          <div className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-1">ID: {user.id}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={busyUserId === user.id}
                          className="px-3 py-1.5 text-xs font-semibold rounded-full border border-red-500 text-red-500 hover:bg-red-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200 text-xs font-semibold">
                          Active
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-semibold">
                          Lv {user.level ?? 1}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          XP: {user.xp ?? 0}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          Accuracy: {Math.round(Number.isFinite(user.accuracy) ? (user.accuracy as number) : 0)}%
                        </span>
                        {activeTab === 'teachers' && (
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            Classes: {classSummaryByTeacher.get(user.id) ?? 0}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <table className="hidden md:table min-w-full text-sm">
                  <thead className="bg-gray-100/80 dark:bg-brand-deep-purple/80 text-gray-600 dark:text-gray-200 uppercase tracking-wide text-xs">
                    <tr>
                      <th className="text-left px-6 py-3">ID</th>
                      <th className="text-left px-6 py-3">Name</th>
                      <th className="text-left px-6 py-3">Email</th>
                      <th className="text-left px-6 py-3">Status</th>
                      <th className="text-left px-6 py-3">Level</th>
                      <th className="text-left px-6 py-3">XP</th>
                      <th className="text-left px-6 py-3">Accuracy</th>
                      {activeTab === 'teachers' && (
                        <th className="text-left px-6 py-3">Classes</th>
                      )}
                      <th className="text-right px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-t border-gray-200/60 dark:border-brand-light-purple/20 hover:bg-gray-50/80 dark:hover:bg-brand-mid-purple/40 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{user.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{user.name || '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 dark:text-gray-200">{user.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200 text-xs font-semibold">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-semibold">
                            Lv {user.level ?? 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">{user.xp ?? 0}</td>
                        <td className="px-6 py-4">
                          {Math.round(Number.isFinite(user.accuracy) ? (user.accuracy as number) : 0)}%
                        </td>
                        {activeTab === 'teachers' && (
                          <td className="px-6 py-4">
                            {classSummaryByTeacher.get(user.id) ?? 0}
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={busyUserId === user.id}
                              className="px-3 py-1.5 text-xs font-semibold rounded-full border border-red-500 text-red-500 hover:bg-red-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 sm:mt-6 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm ${
              feedback.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

