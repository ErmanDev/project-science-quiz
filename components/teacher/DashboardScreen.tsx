// components/dashboard/DashboardScreen.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import NotificationCard from '../dashboard/NotificationCard';
import { BellIcon, EnvelopeIcon } from '../icons';
import { API_URL } from '../../server/src/config';

// ----- Types matching your backend -----
type Announcement = {
  id: string;
  title: string;
  body: string;
  senderId: string;       // <- filter by this
  classId?: string;
  date: string;           // ISO
};

type NotificationDoc = {
  id: string;
  title: string;
  body: string;
  recipientType: 'class' | 'user' | 'all';
  recipientId?: string | null;
  createdAt: string;      // ISO
  createdBy: string;      // <- filter by this
  read: boolean;
  quizId?: string | number;
};

// ----- Small UI bits you already had -----
const LeaderboardPodium: React.FC<{
  position: number; avatar: string; color: string; order: number; offset: string;
}> = ({ position, avatar, color, order, offset }) => (
  <div className={`flex flex-col items-center order-${order}`}>
    <img
      src={avatar}
      alt={`Rank ${position}`}
      className={`w-14 h-14 rounded-full border-4 ${color}`}
      style={{ transform: `translateY(${offset})` }}
    />
  </div>
);

const LeaderboardCard: React.FC = () => {
  const { t } = useTranslations();
  return (
    <div className="bg-white dark:bg-brand-mid-purple/80 rounded-2xl p-4">
      <h2 className="font-bold text-lg mb-2">{t('leaderboard')}</h2>
      <div className="flex justify-around items-end h-28">
        <LeaderboardPodium position={2} avatar="https://i.imgur.com/eC2G5hD.png" color="border-gray-400" order={2} offset="0px" />
        <LeaderboardPodium position={1} avatar="https://i.imgur.com/8Q1Z3vL.png" color="border-yellow-400" order={1} offset="-20px" />
        <LeaderboardPodium position={3} avatar="https://i.imgur.com/T0bC0Fz.png" color="border-yellow-700" order={3} offset="0px" />
      </div>
    </div>
  );
};

// ----- Data loaders -----
async function fetchAnnouncementsBySender(senderId: string): Promise<Announcement[]> {
  const res = await fetch(`${API_URL}/api/announcements?senderId=${encodeURIComponent(senderId)}`);
  if (!res.ok) throw new Error('Failed to load announcements');
  return res.json();
}

async function fetchNotificationsByCreator(createdBy: string): Promise<NotificationDoc[]> {
  const res = await fetch(`${API_URL}/api/notifications?createdBy=${encodeURIComponent(createdBy)}`);
  if (!res.ok) throw new Error('Failed to load notifications');
  return res.json();
}

const DashboardScreen: React.FC = () => {
  const { t } = useTranslations();

  // resolve teacherId from localStorage
  const teacherId: string | null = useMemo(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      const u = raw ? JSON.parse(raw) : null;
      return (u?.id && String(u.id)) || (u?.email && String(u.email)) || null;
    } catch {
      return null;
    }
  }, []);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  const loadAll = useCallback(async () => {
    if (!teacherId) {
      setErr('Not logged in as teacher.');
      setLoading(false);
      return;
    }
    try {
      setErr('');
      setLoading(true);
      const [anns, notifs] = await Promise.all([
        fetchAnnouncementsBySender(teacherId),
        fetchNotificationsByCreator(teacherId),
      ]);

      // sort newest first
      anns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setAnnouncements(anns);
      setNotifications(notifs);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // live updates from other screens
  useEffect(() => {
    const onAnn = (e: Event) => {
      const ce = e as CustomEvent<Announcement>;
      setAnnouncements(prev => {
        const next = [ce.detail, ...prev];
        next.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return next;
      });
    };
    const onNotif = (e: Event) => {
      const ce = e as CustomEvent<NotificationDoc>;
      setNotifications(prev => {
        const next = [ce.detail, ...prev];
        next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return next;
      });
    };
    window.addEventListener('announcement:created' as any, onAnn as any);
    window.addEventListener('notification:created' as any, onNotif as any);
    return () => {
      window.removeEventListener('announcement:created' as any, onAnn as any);
      window.removeEventListener('notification:created' as any, onNotif as any);
    };
  }, []);

  if (loading) {
    return <div className="space-y-4">
      <LeaderboardCard />
      <div className="bg-white dark:bg-brand-mid-purple/80 rounded-2xl p-4 text-sm text-gray-500">{t('loading') || 'Loading…'}</div>
    </div>;
  }

  if (!teacherId) {
    return <div className="space-y-4">
      <LeaderboardCard />
      <div className="bg-white dark:bg-brand-mid-purple/80 rounded-2xl p-4 text-sm text-red-400">Not logged in as teacher.</div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <LeaderboardCard />

      {/* Notifications (createdBy = teacherId) */}
      <div className="bg-white dark:bg-brand-mid-purple/80 rounded-2xl p-4">
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          <BellIcon /> {t('notification') || 'Notifications'}
        </h2>

        {err && <p className="text-red-400 text-sm mb-2">{err}</p>}

        {notifications.length === 0 ? (
          <p className="text-sm text-gray-500">{t('No notifications yet.') || 'No notifications yet.'}</p>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <NotificationCard
                key={n.id}
                icon={<BellIcon />}
                title={n.title || 'Notification'}
                subtitle={new Date(n.createdAt).toLocaleString()}
                description={n.body}
              />
            ))}
          </div>
        )}
      </div>

      {/* Announcements (senderId = teacherId) */}
      <div className="bg-white dark:bg-brand-mid-purple/80 rounded-2xl p-4">
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          <EnvelopeIcon /> {t('announcement') || 'Announcements'}
        </h2>

        {announcements.length === 0 ? (
          <p className="text-sm text-gray-500">{t('No announcements yet.') || 'No announcements yet.'}</p>
        ) : (
          <div className="space-y-2">
            {announcements.map(a => (
              <NotificationCard
                key={a.id}
                icon={<EnvelopeIcon />}
                title={a.title || 'Announcement'}
                subtitle={new Date(a.date).toLocaleString()}
                description={a.body}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardScreen;
