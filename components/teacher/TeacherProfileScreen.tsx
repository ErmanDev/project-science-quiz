import React, { useState, useMemo } from 'react';
import { PencilIcon, ChevronRightIcon } from '../icons';
import { useTranslations } from '../../hooks/useTranslations';
import { ClassData } from './ClassroomScreen';
import { TeacherQuiz } from '../../data/teacherQuizzes';
import EditTeacherProfileModal, { TeacherProfileData } from './EditTeacherProfileModal';
import TeacherSettingsModal from './TeacherSettingsModal';
import { TeacherDashboardView } from './TeacherBottomNav';
import { View } from '../../data/quizzes';
import { Conversation } from '../../App';

const TeacherSettingsIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24">
    <defs>
      <linearGradient id="teacherSettingsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#6c47ff', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path
      fill="url(#teacherSettingsGradient)"
      d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17-.59-1.69-.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22-.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"
    />
  </svg>
);

interface StatBoxProps {
  value: number;
  label: string;
}

const StatBox: React.FC<StatBoxProps> = ({ value, label }) => (
  <div className="bg-brand-mid-purple/70 border border-brand-light-purple/50 rounded-xl py-3 px-4 flex flex-col items-center justify-center w-24">
    <p className="text-3xl font-orbitron font-bold text-white">{value}</p>
    <p className="text-xs text-gray-300">{label}</p>
  </div>
);

interface TeacherProfileScreenProps {
  classes: ClassData[];
  quizzes: TeacherQuiz[];
  profile: TeacherProfileData;
  onSave: (newProfile: Partial<TeacherProfileData>) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  setView: (view: TeacherDashboardView) => void;
  setAppView: (view: View) => void;
  conversations?: Conversation[]; // made optional to be safe
}

const safeInitials = (name?: string) => {
  const n = (name || '').trim();
  if (!n) return '??';
  const parts = n.split(/\s+/);
  return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : n.substring(0, 2).toUpperCase();
};

const TeacherProfileScreen: React.FC<TeacherProfileScreenProps> = ({
  classes,
  quizzes,
  profile,
  onSave,
  isDarkMode,
  onToggleDarkMode,
  setView,
  setAppView,
  conversations = [], // default to empty array
}) => {
  const { t } = useTranslations();
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

  const totalClasses = Array.isArray(classes) ? classes.length : 0;
  const totalStudents = Array.isArray(classes)
    ? classes.reduce((sum, c) => sum + (Number(c?.studentCount) || 0), 0)
    : 0;
  const totalQuizzes = Array.isArray(quizzes) ? quizzes.length : 0;

  const latestMessageData = useMemo(() => {
    if (!conversations || conversations.length === 0) return null;

    const mostRecentConversation = conversations[0];
    const msgs = mostRecentConversation?.messages ?? [];
    if (msgs.length === 0) return null;

    const latestMsg: any = msgs[msgs.length - 1];
    const names: string[] = mostRecentConversation?.participantNames ?? [];
    const otherParticipant = names.find((n) => n && n !== profile?.name) || names[0] || 'User';

    // Normalize timestamp safely
    const rawTs = latestMsg?.timestamp ?? latestMsg?.createdAt ?? latestMsg?.date ?? Date.now();
    const d = new Date(rawTs);
    const date = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      id: String(latestMsg?.id ?? ''),
      title: mostRecentConversation?.title || `Chat with ${otherParticipant}`,
      preview: String(latestMsg?.text ?? ''),
      sender: String(latestMsg?.senderName ?? otherParticipant),
      date,
    };
  }, [conversations, profile?.name]);

  const handleSaveProfile = (newProfile: Partial<TeacherProfileData>) => {
    onSave(newProfile);
    setEditModalOpen(false);
  };

  const isModalOpen = isEditModalOpen || isSettingsModalOpen;

  return (
    <div className="relative">
      <div
        className={`w-full bg-brand-deep-purple text-white p-6 pt-10 flex flex-col items-center transition-all duration-300 ${
          isModalOpen ? 'blur-sm' : ''
        }`}
      >
        <button
          onClick={() => setSettingsModalOpen(true)}
          className="absolute top-6 right-6 text-brand-glow"
          aria-label="Settings"
        >
          <TeacherSettingsIcon />
        </button>

        <div className="w-28 h-28 rounded-3xl flex items-center justify-center mb-4 shadow-glow overflow-hidden">
          {profile?.avatar ? (
            <img src={profile.avatar} alt="Teacher Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-brand-accent flex items-center justify-center">
              <span className="text-6xl font-bold font-orbitron">{safeInitials(profile?.name)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold">{profile?.name || 'Teacher'}</h1>
          <button onClick={() => setEditModalOpen(true)} aria-label="Edit name">
            <PencilIcon className="w-5 h-5 text-brand-glow" />
          </button>
        </div>

        <div className="text-center text-sm text-gray-300 mt-2 space-y-0.5">
          {profile?.email ? <p>{profile.email}</p> : null}
          {typeof profile?.motto === 'string' ? <p>"{profile.motto}"</p> : null}
        </div>

        <div className="flex justify-center space-x-4 mt-8">
          <StatBox value={totalClasses} label={t('classes')} />
          <StatBox value={totalStudents} label={t('students')} />
          <StatBox value={totalQuizzes} label={t('quizzes')} />
        </div>

        <button
          onClick={() => setView('announcements')}
          className="w-full text-left group transition-transform duration-200 hover:scale-[1.02] mt-8"
          aria-label="View messages inbox"
        >
          <div className="flex justify-between items-center mb-3">
            <h2 className="flex items-center space-x-2 text-2xl font-bold font-orbitron text-brand-glow">
              <span>{t('message')}</span>
              {(conversations?.length ?? 0) > 0 && (
                <span className="flex items-center justify-center w-6 h-6 text-sm font-sans font-bold bg-red-500 rounded-full text-white">
                  {conversations.length}
                </span>
              )}
            </h2>
            <ChevronRightIcon />
          </div>
          <div className="bg-brand-mid-purple/70 rounded-2xl border border-brand-light-purple/50 p-4 shadow-lg group-hover:shadow-glow transition-shadow duration-200">
            {latestMessageData ? (
              <div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>From: {latestMessageData.sender}</span>
                  <span>{latestMessageData.date}</span>
                </div>
                <p className="font-semibold text-gray-200 mt-1">{latestMessageData.title}</p>
                <p className="text-sm text-gray-400 truncate">{latestMessageData.preview}</p>
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4">No new messages.</p>
            )}
          </div>
        </button>
      </div>

      {isEditModalOpen && (
        <EditTeacherProfileModal
          profile={profile}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveProfile}
        />
      )}
      {isSettingsModalOpen && (
        <TeacherSettingsModal
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

export default TeacherProfileScreen;
