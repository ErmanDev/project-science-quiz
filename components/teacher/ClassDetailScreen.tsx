import React, { useEffect, useMemo, useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { ClassData } from './ClassroomScreen';
import { ClassStudent } from '../../data/classStudentData';
import { FlameIcon } from '../icons';
import { API_URL } from '../../server/src/config';

interface ClassDetailScreenProps {
  classData: ClassData;
  onBack: () => void;
  students: ClassStudent[]; // kept for backwards compatibility / fallback
}

type Announcement = {
  id: string;
  title: string;
  body: string;
  senderId: string;
  classId?: string | null;
  date: string; // ISO
};

/** The shape we render after fetching and enriching with user data */
type FetchedStudent = {
  studentId: string;
  membershipId?: string;
  name: string;
  email?: string;
  level: number | string;
  streak: number | string;
  accuracy: string;
  lastActive: string;
  joinedAt?: string;
};

const StudentRow: React.FC<{ student: FetchedStudent }> = ({ student }) => {
  const { t } = useTranslations();
  const [firstName, ...lastNameParts] = (student.name || '').split(' ');
  const lastName = lastNameParts.join(' ');
  const lastActiveText = () => {
    if (student.lastActive === 'Today') return t('today');
    if (student.lastActive === 'Yesterday') return t('yesterday');
    return student.lastActive;
  };
  return (
    <tr className="border-b border-brand-light-purple/30">
      <td className="py-3 pr-2">
        <div>{firstName}</div>
        <div className="text-sm text-gray-400">{lastName}</div>
      </td>
      <td className="py-3 px-2 text-center">{student.level}</td>
      <td className="py-3 px-2 text-center flex items-center justify-center gap-1">
        {student.streak}
        <FlameIcon />
      </td>
      <td className="py-3 px-2 text-center">{student.accuracy}</td>
      <td className="py-3 pl-2 text-center">{lastActiveText()}</td>
    </tr>
  );
};

const ClassDetailScreen: React.FC<ClassDetailScreenProps> = ({ classData, onBack, students }) => {
  const { t } = useTranslations();

  // ---------------- Teacher identity (unchanged) ----------------
  const teacherId = useMemo(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      if (!raw) return null;
      const u = JSON.parse(raw);
      return (u?.id && String(u.id)) || (u?.email && String(u.email)) || null;
    } catch {
      return null;
    }
  }, []);

  // ---------------- Announcements (unchanged) ----------------
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [aLoading, setALoading] = useState(false);
  const [aError, setAError] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  const fetchAnnouncements = async () => {
    try {
      setALoading(true);
      setAError('');
      const res = await fetch(`${API_URL}/api/announcements?classId=${encodeURIComponent(classData.id)}`);
      if (!res.ok) throw new Error('Failed to load announcements');
      const data: Announcement[] = await res.json();
      setAnnouncements(
        (Array.isArray(data) ? data : []).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    } catch (e: any) {
      setAError(e?.message || 'Failed to load announcements');
    } finally {
      setALoading(false);
    }
  };

  const apiCreateAnnouncement = async (payload: Omit<Announcement, 'id'>) => {
    const res = await fetch(`${API_URL}/api/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => 'Failed to create announcement'));
    return res.json();
  };

  const apiUpdateAnnouncement = async (id: string, patch: Partial<Announcement>) => {
    const res = await fetch(`${API_URL}/api/announcements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => 'Failed to update announcement'));
    return res.json();
  };

  const apiDeleteAnnouncement = async (id: string) => {
    const res = await fetch(`${API_URL}/api/announcements/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(await res.text().catch(() => 'Failed to delete announcement'));
    return res.json();
  };

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData?.id]);

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setEditTitle(a.title);
    setEditBody(a.body);
    setEditMsg('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditBody('');
    setEditMsg('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editTitle.trim() || !editBody.trim()) {
      setEditMsg('Title and message are required.');
      return;
    }
    try {
      setEditSaving(true);
      await apiUpdateAnnouncement(editingId, {
        title: editTitle.trim(),
        body: editBody.trim(),
        date: new Date().toISOString(),
      });
      setEditMsg('Saved.');
      await fetchAnnouncements();
      cancelEdit();
    } catch (e: any) {
      setEditMsg(e?.message || 'Failed to save changes.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    setSubmitMsg('');
    if (!teacherId) {
      setSubmitMsg('Not logged in as teacher.');
      return;
    }
    if (!title.trim() || !body.trim()) {
      setSubmitMsg('Title and message are required.');
      return;
    }
    try {
      setSubmitting(true);
      await apiCreateAnnouncement({
        title: title.trim(),
        body: body.trim(),
        senderId: teacherId,
        classId: classData.id,
        date: new Date().toISOString(),
      });
      setTitle('');
      setBody('');
      setSubmitMsg('Announcement posted!');
      await fetchAnnouncements();
    } catch (e: any) {
      setSubmitMsg(e?.message || 'Failed to create announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async (a: Announcement) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await apiDeleteAnnouncement(a.id);
      await fetchAnnouncements();
    } catch (e: any) {
      alert(e?.message || 'Failed to delete announcement.');
    }
  };

  // ---------------- FETCH STUDENTS (joined at server, no localStorage) ----------------
  const [classStudents, setClassStudents] = useState<FetchedStudent[]>([]);
  const [stuLoading, setStuLoading] = useState(false);
  const [stuError, setStuError] = useState('');

  const dedupeBy = <T, K extends string | number>(arr: T[], key: (x: T) => K) => {
    const seen = new Set<K>();
    return arr.filter((x) => {
      const k = key(x);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const fetchClassStudents = async () => {
    try {
      setStuLoading(true);
      setStuError('');

      // One-call endpoint that already joins classStudents -> users from db.json
      const res = await fetch(
        `${API_URL}/api/class-students/by-class/${encodeURIComponent(classData.id)}`
      );
      if (!res.ok) throw new Error('Failed to load class students');
      const data: FetchedStudent[] = await res.json();

      // Extra safety: dedupe by studentId
      setClassStudents(dedupeBy(data ?? [], (s) => String(s.studentId)));
    } catch (e: any) {
      setStuError(e?.message || 'Failed to load students');
      // fallback: render whatever was passed in props (if any)
      const fallback = (students || []).map((s: any) => ({
        studentId: s.studentId ?? s.id,
        membershipId: s.membershipId,
        name: s.name ?? 'Unknown',
        email: s.email ?? '',
        level: s.level ?? 1,
        streak: s.streak ?? 0,
        accuracy: s.accuracy ?? '0%',
        lastActive: s.lastActive ?? 'Today',
      })) as FetchedStudent[];
      setClassStudents(dedupeBy(fallback, (x) => String(x.studentId)));
    } finally {
      setStuLoading(false);
    }
  };

  useEffect(() => {
    fetchClassStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classData?.id]);

  const uniqueStudents = useMemo(
    () => dedupeBy(classStudents, (s) => String(s.studentId)),
    [classStudents]
  );

  const studentCount = uniqueStudents.length;

  // ---------------- RENDER ----------------
  return (
    <div className="relative space-y-4 h-full flex flex-col">
      {/* Class card header */}
      <div
        className="bg-brand-mid-purple/80 rounded-2xl p-4 text-white border border-brand-light-purple/50 shadow-lg flex-shrink-0 cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
        onClick={onBack}
      >
        <div className="flex justify-between items-start">
          <div className="text-left space-y-1">
            <h3 className="font-bold text-xl">{`${classData.name} - ${classData.section}`}</h3>
            {/* live count from fetched list */}
            <p className="text-md">{`${studentCount} ${t('students')}`}</p>
            <p className="text-md font-semibold">{`${t('classCode')}: ${classData.code}`}</p>
          </div>
        </div>
      </div>

      {/* Announcements block (unchanged) */}
      <div className="bg-brand-mid-purple/80 rounded-2xl p-4 text-white border border-brand-light-purple/50 shadow-lg flex-shrink-0">
        <h2 className="text-xl font-bold mb-3">{t('announcements') || 'Announcements'}</h2>

        {/* Create announcement */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-start">
          <input
            type="text"
            placeholder={t('Title') || 'Title'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="md:col-span-2 w-full bg-brand-deep-purple/50 border border-brand-light-purple/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow"
          />
          <input
            type="text"
            placeholder={t('Message') || 'Message'}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="md:col-span-2 w-full bg-brand-deep-purple/50 border border-brand-light-purple/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow"
          />
          <button
            onClick={handleCreateAnnouncement}
            disabled={submitting || !title.trim() || !body.trim() }
            className="md:col-span-1 w-full bg-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-300 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-500/50 disabled:cursor-not-allowed"
          >
            {submitting ? (t('loading') || 'Posting…') : (t('post') || 'Post')}
          </button>
        </div>
        {submitMsg && (
          <p className={`mt-2 text-sm ${submitMsg.includes('Failed') ? 'text-red-300' : 'text-green-300'}`}>
            {submitMsg}
          </p>
        )}

        {/* List announcements */}
        <div className="mt-4 space-y-2">
          {aLoading ? (
            <p className="text-gray-300">{t('loading') || 'Loading…'}</p>
          ) : aError ? (
            <p className="text-red-300">{aError}</p>
          ) : announcements.length === 0 ? (
            <p className="text-gray-300">{t('No announcements yet.') || 'No announcements yet.'}</p>
          ) : (
            announcements.map((a) => {
              const canModify = teacherId && a.senderId === teacherId;

              if (editingId === a.id) {
                return (
                  <div key={a.id} className="bg-brand-deep-purple/50 border border-brand-light-purple/40 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-brand-deep-purple/50 border border-brand-light-purple/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow mr-3"
                        placeholder="Title"
                      />
                      <span className="text-xs text-gray-300">{new Date(a.date).toLocaleString()}</span>
                    </div>
                    <input
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="w-full bg-brand-deep-purple/50 border border-brand-light-purple/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow"
                      placeholder="Message"
                    />
                    {editMsg && <p className={`text-sm ${editMsg.includes('Failed') ? 'text-red-300' : 'text-green-300'}`}>{editMsg}</p>}
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 rounded-lg bg-gray-600/70 hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={editSaving || !editTitle.trim() || !editBody.trim()}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-500/50 disabled:cursor-not-allowed"
                      >
                        {editSaving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={a.id} className="bg-brand-deep-purple/50 border border-brand-light-purple/40 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">{a.title}</h4>
                    <span className="text-xs text-gray-300">{new Date(a.date).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-200 text-sm mt-1">{a.body}</p>

                  {canModify && (
                    <div className="flex gap-2 justify-end mt-2">
                      <button
                        onClick={() => startEdit(a)}
                        className="px-3 py-1 rounded-lg bg-brand-light-purple/80 hover:bg-brand-light-purple transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(a)}
                        className="px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Students list */}
      <div className="bg-brand-mid-purple/80 rounded-2xl p-4 text-white border border-brand-light-purple/50 shadow-lg flex-grow flex flex-col min-h-0">
        <h2 className="text-xl font-bold mb-3 flex-shrink-0">{t('students')}</h2>

        {stuLoading ? (
          <p className="text-gray-300">{t('loading') || 'Loading…'}</p>
        ) : stuError ? (
          <div className="text-sm text-red-300 mb-2">{stuError}</div>
        ) : null}

        <div className="overflow-y-auto hide-scrollbar flex-grow">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-brand-mid-purple/80">
              <tr className="border-b-2 border-brand-light-purple/50 text-gray-300">
                <th className="py-2 pr-2 font-semibold">{t('name')}</th>
                <th className="py-2 px-2 font-semibold text-center">{t('level')}</th>
                <th className="py-2 px-2 font-semibold text-center">{t('streak')}</th>
                <th className="py-2 px-2 font-semibold text-center">{t('accuracy')}</th>
                <th className="py-2 pl-2 font-semibold text-center">{t('lastActive')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-light-purple/30">
              {uniqueStudents.length > 0
                ? uniqueStudents.map((student) => (
                    <StudentRow key={student.studentId} student={student} />
                  ))
                : (students || []).map((s) => (
                    <StudentRow
                      key={String((s as any).studentId ?? s.id)}
                      student={{
                        name: (s as any).name ?? 'Unknown',
                        level: (s as any).level ?? 1,
                        streak: (s as any).streak ?? 0,
                        accuracy: (s as any).accuracy ?? '0%',
                        lastActive: (s as any).lastActive ?? 'Today',
                        studentId: String((s as any).studentId ?? s.id),
                      } as FetchedStudent}
                    />
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailScreen;
