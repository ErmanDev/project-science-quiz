

import React from 'react';

// For NotificationCard
export const BellIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a2 2 0 10-4 0v.083A6 6 0 004 11v3.159c0 .538-.214 1.055-.595 1.436L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

export const EnvelopeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);


// For BottomNav
export const QuizIcon: React.FC<{ isActive?: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={isActive ? "h-8 w-8 text-white" : "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

export const RankingIcon: React.FC<{ isActive?: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={isActive ? "h-8 w-8 text-white" : "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.5V6M15 3.5V6M3.75 9H20.25M6 6.75h12V20.25a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V6.75zM12 12.75v5.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 12.75h3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a2.25 2.25 0 002.25-2.25H9.75A2.25 2.25 0 0012 21z" />
    </svg>
);

export const HomeIcon: React.FC<{ isActive?: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={isActive ? "h-8 w-8 text-white" : "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

export const BadgesIcon: React.FC<{ isActive?: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={isActive ? "h-8 w-8 text-white" : "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);

export const ProfileIcon: React.FC<{ isActive?: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={isActive ? "h-8 w-8 text-white" : "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export const MessageIcon: React.FC<{isActive?: boolean}> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={isActive ? "h-8 w-8 text-white" : "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);


// For QuizzesScreen Filters
const IconWrapper: React.FC<{children: React.ReactNode, isActive: boolean}> = ({children, isActive}) => (
    <div className={`w-8 h-8 ${isActive ? 'text-white' : 'text-gray-300'}`}>
        {children}
    </div>
);

export const NewQuizIcon: React.FC<{isActive: boolean}> = ({ isActive }) => (
    <IconWrapper isActive={isActive}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12V7.5L19.5 12H15z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 2.5l4 4" transform="translate(-10, 8) rotate(-45 19.5 4.5)" />
        </svg>
    </IconWrapper>
);

export const MissedQuizIcon: React.FC<{isActive: boolean}> = ({ isActive }) => (
    <IconWrapper isActive={isActive}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9l-6 6-6-6" />
        </svg>
    </IconWrapper>
);

export const DoneQuizzesIcon: React.FC<{isActive: boolean}> = ({ isActive }) => (
    <IconWrapper isActive={isActive}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    </IconWrapper>
);

// For Rankings Screen
export const FilterIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
);

export const PodiumLaurel: React.FC<{color: string}> = ({color}) => (
    <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M60 110C35.1472 110 15 89.8528 15 65C15 40.1472 35.1472 20 60 20C84.8528 20 105 40.1472 105 65C105 89.8528 84.8528 110 60 110Z" fill="none" stroke={color} strokeWidth="5"/>
        <path d="M60 20C50 35 45 60 45 65C45 70 50 95 60 110" stroke={color} strokeWidth="5" strokeLinecap="round"/>
        <path d="M60 20C70 35 75 60 75 65C75 70 70 95 60 110" stroke={color} strokeWidth="5" strokeLinecap="round"/>
        <path d="M45 65H75" stroke={color} strokeWidth="5" strokeLinecap="round"/>
        <path d="M20 60L45 55" stroke={color} strokeWidth="5" strokeLinecap="round"/>
        <path d="M99 60L75 55" stroke={color} strokeWidth="5" strokeLinecap="round"/>
        <path d="M20 70L45 75" stroke={color} strokeWidth="5" strokeLinecap="round"/>
        <path d="M99 70L75 75" stroke={color} strokeWidth="5" strokeLinecap="round"/>
    </svg>
);

export const ListLaurel: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z" stroke="#f59e0b" strokeWidth="1.5"/>
        <path d="M12 3C10 6 9 11 9 12C9 13 10 18 12 21" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 3C14 6 15 11 15 12C15 13 14 18 12 21" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);


export const AvatarRank2: React.FC = () => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#4B2A85"/>
        <path d="M40 58C47.732 58 54 51.732 54 44V41C54 33.268 47.732 27 40 27C32.268 27 26 33.268 26 41V44C26 51.732 32.268 58 40 58Z" fill="#E0B18A"/>
        <path d="M40 27C36 27 34 22 37 19C40 16 43 19 43 23C46 20 49 24 45 27H40Z" fill="#5D4037"/>
        <path d="M30 60H50V68H30V60Z" fill="#37474F"/>
        <path d="M35 60L33 68" stroke="white" strokeWidth="1.5"/>
    </svg>
);

export const AvatarRank1: React.FC = () => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#4B2A85"/>
        <path d="M40 58C47.732 58 54 51.732 54 44V41C54 33.268 47.732 27 40 27C32.268 27 26 33.268 26 41V44C26 51.732 32.268 58 40 58Z" fill="#FFD3B5"/>
        <path d="M40 27C35 25 36 18 40 18C44 18 45 25 40 27Z" fill="#FBC02D"/>
        <path d="M28 58H52C52 65 47 68 40 68C33 68 28 65 28 58Z" fill="#78909C"/>
    </svg>
);

export const AvatarRank3: React.FC = () => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="40" fill="#4B2A85"/>
        <path d="M40 58C47.732 58 54 51.732 54 44V41C54 33.268 47.732 27 40 27C32.268 27 26 33.268 26 41V44C26 51.732 32.268 58 40 58Z" fill="#F5CBA7"/>
        <path d="M40 27C36 25 37 19 40 20C43 19 44 25 40 27Z" fill="#212121"/>
        <path d="M34 58L40 68L46 58H34Z" fill="#1E88E5"/>
    </svg>
);


export const GenericListAvatar: React.FC = () => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="#2C1250"/>
        <circle cx="20" cy="16" r="6" fill="#6C47FF"/>
        <path d="M10 32C10 26.4772 14.4772 22 20 22C25.5228 22 30 26.4772 30 32V34H10V32Z" fill="#6C47FF"/>
    </svg>
);

// For Profile Screen
export const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className ?? "h-4 w-4 text-brand-glow hover:text-white transition-colors"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L13.2 5.232z" />
    </svg>
  );
  
  export const SettingsIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-300 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  
  export const LevelUpIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );

  export const ChevronRightIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );

// For Settings Modal
const SettingsIconWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
    <div className="w-6 h-6 text-brand-glow">{children}</div>
);

export const MusicIcon: React.FC = () => (
    <SettingsIconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-12c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
        </svg>
    </SettingsIconWrapper>
);

export const SoundIcon: React.FC = () => (
    <SettingsIconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
    </SettingsIconWrapper>
);

export const DarkModeIcon: React.FC = () => (
    <SettingsIconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    </SettingsIconWrapper>
);

export const LanguageIcon: React.FC = () => (
    <SettingsIconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.06 16.06l-4.24-4.24M2.12 12.12l4.24 4.24M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    </SettingsIconWrapper>
);

export const NotificationIcon: React.FC = () => (
    <SettingsIconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a2 2 0 10-4 0v.083A6 6 0 004 11v3.159c0 .538-.214 1.055-.595 1.436L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    </SettingsIconWrapper>
);

export const HelpIcon: React.FC = () => (
    <SettingsIconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    </SettingsIconWrapper>
);

// New icon for Help Modal title
export const HelpTitleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="helpIconGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#helpIconGradient)" />
        <path d="M10.5 8.5C10.5 7.67157 11.1716 7 12 7C12.8284 7 13.5 7.67157 13.5 8.5C13.5 9.13314 13.0538 9.66444 12.4428 9.88285C11.666 10.1667 11 10.8333 11 12V13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="16" r="1" fill="white" />
    </svg>
);

// New icon for About Us Modal title
export const AboutUsTitleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="aboutIconGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
        </defs>
        <rect width="24" height="24" rx="4" fill="url(#aboutIconGradient)" />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="sans-serif">i</text>
    </svg>
);

// New icon for Privacy Policy Modal title
export const PrivacyTitleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 24 24">
        <defs>
            <linearGradient id="privacyIconGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
        </defs>
        <rect width="24" height="24" rx="4" fill="url(#privacyIconGradient)" />
        <g transform="translate(4 3)">
            <rect x="1" y="7" width="14" height="8" rx="2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M4 7V4a4 4 0 018 0v3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </g>
    </svg>
);


export const AboutUsIcon: React.FC = () => (
    <SettingsIconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    </SettingsIconWrapper>
);

export const PrivacyIcon: React.FC = () => (
    <SettingsIconWrapper>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    </SettingsIconWrapper>
);

export const LogoutIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

// New Icons for Music Setting
export const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

export const MeatballMenuIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
    </svg>
);

export const TrashIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

// New icon for image upload in EditQuestionModal
export const ImageIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className ?? "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);


// For Teacher Dashboard BottomNav
export const ClassroomIcon: React.FC<{ isActive?: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={isActive ? "h-8 w-8 text-white" : "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.274-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.274.356-1.857m0 0a5.002 5.002 0 019.288 0M12 14a5 5 0 100-10 5 5 0 000 10z" />
    </svg>
);

export const QuizBankIcon: React.FC<{ isActive?: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={isActive ? "h-8 w-8 text-white" : "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 12h14M5 16h14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 8V6.5A1.5 1.5 0 0 0 13.5 5h-3A1.5 1.5 0 0 0 9 6.5V8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8v5l3-2.5L15 13V8" />
    </svg>
);

export const ReportsIcon: React.FC<{ isActive?: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={isActive ? "h-8 w-8 text-white" : "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6" />
    </svg>
);

// For Reports Screen title
export const ReportsTitleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mr-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6" />
    </svg>
);


// For ClassDetailScreen
export const FlameIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.12l-2.495 3.89a1 1 0 00.94 1.45h3.44a1 1 0 00.94-1.45l-2.495-3.89a1 1 0 00-.94-.12z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" transform="translate(0, -3)" />
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16z" opacity="0" />
      <path fillRule="evenodd" d="M8.293 11.293a1 1 0 011.414 0L12 13.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" transform="translate(0, 5)" />
       <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 2z M5.503 3.52a.75.75 0 01.229 1.043l-1.928 3.338a.75.75 0 11-1.299-.75l1.928-3.338a.75.75 0 011.07-.293zM14.497 3.52a.75.75 0 011.07.293l1.928 3.338a.75.75 0 11-1.3.75l-1.928-3.338a.75.75 0 01.23-1.043z" opacity="0.5"/>
    </svg>
  );

export const PostIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

export const UserAddIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
);