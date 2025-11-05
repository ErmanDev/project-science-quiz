// src/components/teacher/PostQuizModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { API_URL } from '../../server/src/config';
import type { TeacherQuiz } from '../../data/teacherQuizzes';

// If you already export ClassData elsewhere, import it instead of redefining.
export interface ClassData {
  id: string;
  name: string;
  section: string;
  code: string;
  studentCount: number;
  teacherId: string;
}

interface PostQuizModalProps {
  isOpen: boolean;
  quiz: TeacherQuiz | null;
  onClose: () => void;
  onPost: (details: { quizId: number | string; dueDate: string; classIds: string[] }) => void;
}

const PostQuizModal: React.FC<PostQuizModalProps> = ({ isOpen, quiz, onClose, onPost }) => {
  const { t } = useTranslations();

  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string>('');
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());

  // Resolve teacherId from localStorage (same logic you use elsewhere)
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

  // When opening: set default due date (tomorrow), reset, and fetch classes from API/db.json
  useEffect(() => {
    if (!isOpen) return;

    // default due date = tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setDueDate(`${yyyy}-${mm}-${dd}`);

    setSelectedClassIds(new Set());
    setLoadErr('');

    const fetchClasses = async () => {
      if (!teacherId) {
        setLoadErr('Not logged in as teacher.');
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/classes?teacherId=${encodeURIComponent(teacherId)}`);
        if (!res.ok) {
          const msg = await res.text().catch(() => 'Failed to load classes');
          throw new Error(msg);
        }
        const data: ClassData[] = await res.json();
        setClasses(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setLoadErr(err?.message || 'Failed to load classes.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [isOpen, teacherId]);

  if (!isOpen || !quiz) return null;

  const handleClassToggle = (classId: string) => {
    setSelectedClassIds(prev => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  };

  const handlePost = () => {
    if (!dueDate || selectedClassIds.size === 0) return;
    const combinedDateTime = `${dueDate}T${dueTime}`;
    onPost({
      quizId: quiz.id, // keep original type (number|string) to match your API
      dueDate: combinedDateTime,
      classIds: Array.from(selectedClassIds),
    });
  };

  const isPostDisabled = !dueDate || selectedClassIds.size === 0 || !!loadErr;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-gradient-to-b from-brand-accent/90 via-blue-500/80 to-brand-mid-purple/90 rounded-2xl p-6 flex flex-col backdrop-blur-md border border-white/10 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
               viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <h2 className="text-2xl font-bold font-orbitron mb-4 text-center">
          {t('postQuizTitle')}
        </h2>

        {/* Due date/time */}
        <div className="space-y-4">
          <div>
            <label className="font-semibold mb-2 block">{t('setDueDate')}</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-brand-deep-purple/50 border border-brand-light-purple/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow"
              />
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="w-full bg-brand-deep-purple/50 border border-brand-light-purple/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow"
              />
            </div>
          </div>

          {/* Class list from db.json */}
          <div>
            <label className="font-semibold mb-2 block">{t('postToClasses')}</label>
            <div className="space-y-2 max-h-32 overflow-y-auto hide-scrollbar bg-black/20 p-2 rounded-lg">
              {loading ? (
                <p className="text-center text-gray-300 py-2">{t('loading') || 'Loading…'}</p>
              ) : loadErr ? (
                <p className="text-center text-red-300 py-2">{loadErr}</p>
              ) : classes.length > 0 ? (
                classes.map(cls => (
                  <label
                    key={cls.id}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClassIds.has(cls.id)}
                      onChange={() => handleClassToggle(cls.id)}
                      className="h-5 w-5 rounded border-gray-300 text-brand-accent focus:ring-brand-glow bg-brand-deep-purple/50 accent-brand-accent"
                    />
                    <span>{cls.name} — {cls.section}</span>
                  </label>
                ))
              ) : (
                <p className="text-center text-gray-400 py-4">{t('noClassesToPost')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-4 mt-6">
          <button
            onClick={onClose}
            className="w-full bg-brand-light-purple/80 text-white font-semibold py-2 rounded-lg transition-colors hover:bg-brand-light-purple"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handlePost}
            disabled={isPostDisabled}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-300 ease-in-out hover:bg-blue-500 hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-500/50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {t('postQuizButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostQuizModal;
