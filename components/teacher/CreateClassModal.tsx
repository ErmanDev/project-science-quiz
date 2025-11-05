import React, { useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { API_URL } from '../../server/src/config'; // ✅ FRONTEND config (not from server)

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId?: string;
}

const generateClassCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

const resolveTeacherId = (explicit?: string): string | null => {
  if (explicit?.trim()) return explicit.trim();
  try {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;
    const u = JSON.parse(raw);
    return (u?.id && String(u.id)) || (u?.email && String(u.email)) || null;
  } catch {
    return null;
  }
};

const CreateClassModal: React.FC<CreateClassModalProps> = ({ isOpen, onClose, teacherId }) => {
  const { t } = useTranslations();
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(''); // soft-success / soft-warning message

  if (!isOpen) return null;

  // ---- helpers to create announcement & notification ----
  const createClassAnnouncement = async ({
    title,
    body,
    senderId,
    classId,
  }: {
    title: string;
    body: string;
    senderId: string;
    classId: string;
  }) => {
    const payload = {
      title,
      body,
      senderId,
      classId,
      date: new Date().toISOString(),
    };
    const res = await fetch(`${API_URL}/api/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => 'Failed to create announcement'));
    const created = await res.json();
    // notify rest of the app
    window.dispatchEvent(new CustomEvent('announcement:created', { detail: created }));
    return created;
  };

  // This will quietly no-op if /api/notifications doesn’t exist yet.
  const createClassNotification = async ({
    title,
    body,
    classId,
    createdBy,
  }: {
    title: string;
    body: string;
    classId: string;
    createdBy: string;
  }) => {
    try {
      const payload = {
        title,
        body,
        recipientType: 'class',   // suggested shape; adjust if your backend differs
        recipientId: classId,
        createdAt: new Date().toISOString(),
        createdBy,
        read: false,
      };
      const res = await fetch(`${API_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => 'Failed to create notification'));
      const created = await res.json();
      window.dispatchEvent(new CustomEvent('notification:created', { detail: created }));
      return created;
    } catch (err) {
      // Don’t block class creation on notification errors.
      console.warn('[notifications] post failed:', err);
      setInfo('Class created. Announcement posted. (Notification service unavailable.)');
      return null;
    }
  };

  const handleCreate = async () => {
    setError('');
    setInfo('');

    const effectiveTeacherId = resolveTeacherId(teacherId);
    if (!className.trim() || !section.trim()) return;
    if (!effectiveTeacherId) {
      setError('Missing teacher ID. Please log in again as a teacher.');
      return;
    }

    // Duplicate check (same name+section for this teacher)
    try {
      const checkRes = await fetch(`${API_URL}/api/classes?teacherId=${encodeURIComponent(effectiveTeacherId)}`);
      if (!checkRes.ok) throw new Error('Validation failed');
      const existing = await checkRes.json();

      const nameLower = className.trim().toLowerCase();
      const sectionLower = section.trim().toLowerCase();
      const duplicate = existing?.some(
        (c: any) =>
          c?.name?.trim()?.toLowerCase() === nameLower &&
          c?.section?.trim()?.toLowerCase() === sectionLower
      );
      if (duplicate) {
        setError('A class with this name and section already exists.');
        return;
      }
    } catch {
      setError('Unable to validate class name. Try again.');
      return;
    }

    // Create class
    const newClass = {
      id: `cls_${Date.now()}`,
      name: className.trim(),
      section: section.trim(),
      code: generateClassCode(),
      studentCount: 0,
      teacherId: effectiveTeacherId,
    };

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClass),
      });
      if (!res.ok) throw new Error('Failed to create class');

      const savedClass = await res.json();

      // ✅ Emit refresh for classroom screen
      window.dispatchEvent(new CustomEvent('class:created', { detail: savedClass }));

      // ✅ Create a class-scoped announcement
      const annTitle = 'New class created';
      const annBody = `${newClass.name} - ${newClass.section} is now available. Class code: ${newClass.code}`;
      await createClassAnnouncement({
        title: annTitle,
        body: annBody,
        senderId: effectiveTeacherId,
        classId: savedClass.id,
      });

      // ✅ Create a class-scoped notification (best-effort)
      const notifTitle = 'Class created';
      const notifBody = `${newClass.name} - ${newClass.section} has been created.`;
      await createClassNotification({
        title: notifTitle,
        body: notifBody,
        classId: savedClass.id,
        createdBy: effectiveTeacherId,
      });

      // Close modal
      setClassName('');
      setSection('');
      setInfo('Class created and announcement posted.');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error creating class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative w-full max-w-xs bg-gradient-to-b from-[#1E3A8A] to-[#4B2A85] rounded-2xl p-6 flex flex-col items-center backdrop-blur-md border border-white/10 text-white" onClick={(e)=>e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6">{t('createNewClass')}</h2>

        <div className="w-full space-y-4 text-left">
          <div>
            <label className="text-sm font-semibold mb-2 block">{t('className')}</label>
            <input
              type="text"
              placeholder={t('enterClassName')}
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full bg-blue-900/60 border-2 border-transparent focus:border-blue-400 rounded-lg px-4 py-2 text-white placeholder-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">{t('section')}</label>
            <input
              type="text"
              placeholder={t('enterSection')}
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full bg-blue-900/60 border-2 border-transparent focus:border-blue-400 rounded-lg px-4 py-2 text-white placeholder-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-300"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        {info && !error && <p className="text-green-300 text-sm mt-2 text-center">{info}</p>}

        <div className="w-full flex space-x-4 mt-8">
          <button onClick={onClose} className="w-full bg-brand-light-purple/80 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out hover:bg-brand-light-purple focus:outline-none focus:ring-2 focus:ring-brand-glow focus:ring-opacity-75">
            {t('cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !className.trim() || !section.trim()}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('loading') : t('create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateClassModal;
