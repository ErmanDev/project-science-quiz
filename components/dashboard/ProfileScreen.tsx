import React, { useState, useMemo } from 'react';
import { PencilIcon, SettingsIcon, LevelUpIcon, ChevronRightIcon } from '../icons';
import { badgeData } from '../../data/badges';
import EditProfileModal from './EditProfileModal';
import { ProfileData } from '../StudentDashboard';
import SettingsModal from './SettingsModal';
import { useTranslations } from '../../hooks/useTranslations';
import { DashboardView, View } from '../../data/quizzes';
import { Conversation } from '../../App';

interface StatCardProps {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, icon }) => (
  <div className="bg-white dark:bg-brand-mid-purple/80 border border-gray-200 dark:border-brand-light-purple/50 rounded-xl p-3 text-center flex flex-col justify-center items-center h-24">
    <div className="flex items-center justify-center">
      <span className="text-3xl font-bold font-orbitron text-gray-800 dark:text-white">{value}</span>
      {icon}
    </div>
    <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
  </div>
);

interface ProfileScreenProps {
  profile: ProfileData;
  onSave: (newProfile: Partial<ProfileData>) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  setView: (view: DashboardView) => void;
  setAppView: (view: View) => void;
  onViewMessages: () => void;
  conversations: Conversation[];
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onSave,
  isDarkMode,
  onToggleDarkMode,
  setView,
  setAppView,
  onViewMessages,
  conversations,
}) => {
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const { t } = useTranslations();

  const displayedBadges = useMemo(
    () => badgeData.flatMap((category) => category.badges).slice(0, 8),
    []
  );

  const latestMessageData = useMemo(() => {
    if (!conversations || conversations.length === 0) return null;

    // Keep your original logic (first conversation), but guard shapes
    const mostRecentConversation = conversations[0];
    const msgs = mostRecentConversation?.messages ?? [];
    if (msgs.length === 0) return null;

    const latestMsg = msgs[msgs.length - 1];

    const names = mostRecentConversation?.participantNames ?? [];
    const otherParticipant =
      names.find((name) => name && name !== (profile?.name ?? '')) || names[0] || 'User';

    // Normalize timestamp -> Date
    const rawTs =
      (latestMsg as any)?.timestamp ??
      (latestMsg as any)?.createdAt ??
      (latestMsg as any)?.date ??
      Date.now();
    const ts = new Date(rawTs);
    const date = isNaN(ts.getTime())
      ? ''
      : ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      id: (latestMsg as any)?.id ?? `${Date.now()}`,
      title: `Chat with ${otherParticipant}`,
      preview: (latestMsg as any)?.text ?? '',
      sender: (latestMsg as any)?.senderName ?? otherParticipant,
      date,
    };
  }, [conversations, profile?.name]);

  const getInitials = (name: string) => {
    const safe = (name || '').trim();
    if (!safe) return '??';
    const parts = safe.split(/\s+/);
    if (parts.length > 1 && parts[parts.length - 1]) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return safe.substring(0, 2).toUpperCase();
  };

  const handleSaveProfile = (newProfile: Partial<ProfileData>) => {
    onSave(newProfile);
    setEditModalOpen(false);
  };

  const isModalOpen = isEditModalOpen || isSettingsModalOpen;

  return (
    <div className="relative">
      <div className={`space-y-6 transition-all duration-300 px-4 pt-8 ${isModalOpen ? 'blur-sm' : ''}`}>
        {/* Header/Profile */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt="Profile Avatar"
                className="w-16 h-16 bg-brand-mid-purple rounded-lg object-cover shadow-glow"
              />
            ) : (
              <div className="w-16 h-16 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-3xl text-white shadow-glow">
                {getInitials(profile?.name ?? '')}
              </div>
            )}
            <div>
              <h1 className="flex items-center space-x-2 font-bold text-xl">
                <span>{profile?.name ?? 'Student'}</span>
                <button onClick={() => setEditModalOpen(true)} aria-label="Edit name">
                  <PencilIcon />
                </button>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('bioLabel')}: "{profile?.bio ?? ''}"
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('sectionLabel')}: Fortitude
              </p>
            </div>
          </div>
          <button onClick={() => setSettingsModalOpen(true)} aria-label="Settings">
            <SettingsIcon />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard value={(profile?.xp ?? 0).toString()} label={t('xp')} />
          <StatCard value={(profile?.level ?? 1).toString()} label={t('level')} icon={<LevelUpIcon />} />
          <StatCard value={`${profile?.accuracy ?? 0}%`} label={t('accuracy')} />
          <StatCard value={(profile?.streaks ?? 0).toString()} label={t('streaks')} />
        </div>

        {/* Messages preview */}
        <button
          onClick={onViewMessages}
          className="w-full text-left group transition-transform duration-200 hover:scale-[1.02]"
          aria-label="View messages inbox"
        >
          <div className="flex justify-between items-center mb-3">
            <h2 className="flex items-center space-x-2 text-2xl font-bold font-orbitron text-brand-glow">
              <span>{t('message')}</span>
              {(conversations?.length ?? 0) > 0 && (
                <span className="flex items-center justify-center w-6 h-6 text-sm font-sans font-bold bg-red-500 rounded-full text-white">
                  {conversations!.length}
                </span>
              )}
            </h2>
            <ChevronRightIcon />
          </div>
          <div className="bg-white dark:bg-brand-mid-purple/30 rounded-2xl border border-gray-200 dark:border-brand-light-purple/50 p-4 shadow-lg group-hover:shadow-glow transition-shadow duration-200">
            {latestMessageData ? (
              <div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>From: {latestMessageData.sender}</span>
                  <span>{latestMessageData.date}</span>
                </div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-1">
                  {latestMessageData.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {latestMessageData.preview}
                </p>
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">No new messages.</p>
            )}
          </div>
        </button>

        {/* Badges */}
        <button
          onClick={() => setView('badges')}
          className="w-full text-left group transition-transform duration-200 hover:scale-[1.02]"
          aria-label="View all badges"
        >
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold font-orbitron text-brand-glow">{t('badges')}</h2>
            <ChevronRightIcon />
          </div>
          <div className="bg-white dark:bg-brand-mid-purple/30 rounded-2xl border border-gray-200 dark:border-brand-light-purple/50 p-4 shadow-lg group-hover:shadow-glow transition-shadow duration-200">
            <div className="grid grid-cols-4 gap-4">
              {displayedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="w-16 h-16 bg-gray-100 dark:bg-black/20 rounded-lg flex items-center justify-center p-1"
                >
                  <img src={badge.imgSrc} alt={badge.name} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </div>
        </button>
      </div>

      {/* Modals */}
      {isEditModalOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveProfile}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
          setView={setView}
          setAppView={setAppView}
        />
      )}
    </div>
  );
};

export default ProfileScreen;
