
import React from 'react';
import { ProfileData } from '../StudentDashboard';
import { useTranslations } from '../../hooks/useTranslations';

interface HeaderProps {
  onJoinClassClick: () => void;
  profile: Pick<ProfileData, 'name' | 'avatar' | 'level' | 'xp'>;
  xpPerLevel: number;
}

const getInitials = (name: string) => {
    const names = name.trim().split(' ');
    if (names.length > 1 && names[names.length - 1]) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};


const Header: React.FC<HeaderProps> = ({ onJoinClassClick, profile, xpPerLevel }) => {
  const { t } = useTranslations();
  const xpForCurrentLevelStart = (profile.level - 1) * xpPerLevel;
  const xpInCurrentLevel = profile.xp - xpForCurrentLevelStart;
  const progressPercentage = Math.max(0, Math.min(100, (xpInCurrentLevel / xpPerLevel) * 100));

  return (
    <header className="px-4 pt-8 pb-4">
      <div className="flex items-center space-x-4">
        {profile.avatar ? (
            <img src={profile.avatar} alt="Profile Avatar" className="w-14 h-14 bg-brand-mid-purple rounded-lg object-cover" />
        ) : (
            <div className="w-14 h-14 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-2xl text-white">
                {getInitials(profile.name)}
            </div>
        )}

        <div className="flex-grow">
          <h1 className="font-bold text-lg">{profile.name}</h1>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('level')} {profile.level}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{xpInCurrentLevel} / {xpPerLevel} XP</p>
          </div>
          <div className="w-full bg-gray-200 dark:bg-brand-mid-purple rounded-full h-1.5 mt-1">
            <div className="bg-brand-glow h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
        <button 
          onClick={onJoinClassClick}
          className="bg-transparent border border-gray-300 dark:border-brand-light-purple text-gray-800 dark:text-white text-sm font-semibold py-2 px-4 rounded-lg
                           hover:bg-gray-100/50 dark:hover:bg-brand-light-purple/50 transition-colors duration-300">
          {t('joinClass')}
        </button>
      </div>
    </header>
  );
};

export default Header;