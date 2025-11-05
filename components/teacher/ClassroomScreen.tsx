import React, { useCallback, useEffect, useState } from 'react';
import { API_URL } from '../../server/src/config';          // ✅ FRONTEND config
import ClassCard, { ClassData } from '../ClassCard';
import { useTranslations } from '../../hooks/useTranslations';

interface ClassroomScreenProps {
  onOpenClass: (classData: ClassData) => void;
}

const ClassroomScreen: React.FC<ClassroomScreenProps> = ({ onOpenClass }) => {
  const { t } = useTranslations();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClasses = useCallback(async () => {
    try {
      setError('');
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!currentUser) { setError('Not logged in'); return; }
      if (currentUser.role !== 'teacher') { setError('Only teachers can view classes.'); return; }
      const teacherId = currentUser.id || currentUser.email;

      const res = await fetch(`${API_URL}/api/classes?teacherId=${encodeURIComponent(teacherId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setClasses(data);
    } catch (e) {
      console.error('Failed to fetch classes:', e);
      setError('Unable to load classes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  // 🔔 Refetch when modal fires "class:created"
  useEffect(() => {
    const onCreated = (e: Event) => {
      // optional: optimistic add if payload is provided
      const detail = (e as CustomEvent).detail;
      if (detail && detail.id) {
        setClasses(prev => {
          const exists = prev.some(c => c.id === detail.id);
          return exists ? prev : [detail, ...prev];
        });
      } else {
        fetchClasses();
      }
    };
    window.addEventListener('class:created', onCreated as EventListener);
    return () => window.removeEventListener('class:created', onCreated as EventListener);
  }, [fetchClasses]);

  if (loading) return <p className="text-center text-gray-400">{t('loading') || 'Loading classes…'}</p>;
  if (error)   return <p className="text-center text-red-400">{error}</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{t('yourClass')}</h2>
      <div className="space-y-4">
        {classes.length > 0 ? (
          classes.map(c => <ClassCard key={c.id} classData={c} onOpenClass={onOpenClass} />)
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-10">
            <p>No classes yet.</p>
            <p>Click the + button to create your first class!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomScreen;
