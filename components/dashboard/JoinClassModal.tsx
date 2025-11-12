import React, { useState } from 'react';
import { API_URL } from '../../server/src/config';
import type { ClassData } from '../ClassCard';
import { useTranslations } from '../../hooks/useTranslations';

interface JoinClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess: (classData: ClassData) => void;
}

type DBClass = ClassData & {
  code?: string;
  teacherId?: string;
  studentCount?: number;
};

export default function JoinClassModal({
  isOpen,
  onClose,
  onJoinSuccess,
}: JoinClassModalProps) {
  const { t } = useTranslations();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  if (!isOpen) return null;

  const getCurrentStudent = () => {
    try {
      const raw = localStorage.getItem('currentUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const handleJoin = async () => {
    setErr('');
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;

    const me = getCurrentStudent();
    if (!me) {
      setErr('Please log in again.');
      return;
    }
    // Use a stable studentId (id preferred; fallback to email)
    const studentId: string = String(me.id || me.email || me.name || 'student');

    try {
      setLoading(true);

      // 1) Find class by join code (served from server/data/db.json)
      const classRes = await fetch(`${API_URL}/api/classes?code=${encodeURIComponent(normalized)}`);
      if (!classRes.ok) throw new Error('Failed to find class by code');
      const candidates: DBClass[] = await classRes.json();

      if (!Array.isArray(candidates) || candidates.length === 0) {
        setErr('Invalid class code.');
        return;
      }
      const cls = candidates[0];

      // 2) OPTIONAL: pre-check if already joined to avoid POST errors / extra writes
      const preCheck = await fetch(
        `${API_URL}/api/class-students?classId=${encodeURIComponent(String(cls.id))}&studentId=${encodeURIComponent(String(studentId))}`
      );
      if (preCheck.ok) {
        const already = await preCheck.json();
        if (Array.isArray(already) && already.length > 0) {
          // already joined — just surface success and exit
          onJoinSuccess(cls);
          // let the rest of the app know
          window.dispatchEvent(new CustomEvent('class:joined', { detail: { classId: cls.id, studentId } }));
          onClose();
          return;
        }
      }

      // 3) Create roster entry in db.json
      const joinRes = await fetch(`${API_URL}/api/class-students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: String(cls.id),
          studentId,
        }),
      });

      if (!joinRes.ok) {
        // handle “already joined” from server
        const text = await joinRes.text().catch(() => '');
        if (joinRes.status === 409) {
          onJoinSuccess(cls);
          window.dispatchEvent(new CustomEvent('class:joined', { detail: { classId: cls.id, studentId } }));
          onClose();
          return;
        }
        throw new Error(text || 'Failed to join class');
      }

      // 4) (Optional) Re-fetch class to reflect updated studentCount
      let finalClass: DBClass = cls;
      const finalRes = await fetch(`${API_URL}/api/classes/${encodeURIComponent(String(cls.id))}`);
      if (finalRes.ok) finalClass = await finalRes.json();

      // 5) Success → bubble to parent & broadcast
      onJoinSuccess(finalClass);
      window.dispatchEvent(new CustomEvent('class:joined', { detail: { classId: finalClass.id, studentId } }));
      onClose();
    } catch (e: any) {
      setErr(e?.message || 'Join failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-brand-mid-purple/90 rounded-2xl p-5 text-gray-800 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-3">{t('joinClass') || 'Join a Class'}</h3>
        <label className="block text-sm mb-1">{t('enterClassCode') || 'Enter class code'}</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. ABCD12"
          className="w-full rounded-lg px-3 py-2 border dark:border-white/10 dark:bg-black/20 outline-none focus:ring-2 focus:ring-brand-glow"
        />
        {err && <p className="text-sm text-red-400 mt-2">{err}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg py-2 bg-gray-200 dark:bg:white/10 hover:opacity-90"
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleJoin}
            disabled={loading || !code.trim()}
            className="flex-1 rounded-lg py-2 bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? (t('loading') || 'Loading…') : (t('join') || 'Join')}
          </button>
        </div>
      </div>
    </div>
  );
}
