

import React, { useState, useRef } from 'react';
import { 
    MusicIcon, SoundIcon, DarkModeIcon, LanguageIcon, NotificationIcon, 
    MessageIcon, HelpIcon, AboutUsIcon, PrivacyIcon, LogoutIcon, 
    UploadIcon, MeatballMenuIcon, TrashIcon
} from '../icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';
import { DashboardView, View } from '../../data/quizzes';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  setView: (view: DashboardView) => void;
  setAppView: (view: View) => void;
}

interface Track {
    id: number;
    name: string;
    type: 'default' | 'uploaded';
}

const defaultMusic: Track[] = [
    { id: 1, name: 'Sci-Fi Dreams.mp3', type: 'default' },
    { id: 2, name: 'Orbital Chill.mp3', type: 'default' },
    { id: 3, name: 'Cybernetic Pulse.mp3', type: 'default' },
];

const Slider: React.FC<{ value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ value, onChange }) => (
    <div className="w-32 h-2 bg-gray-200 dark:bg-black/50 rounded-full relative flex items-center">
        <div 
            className="absolute top-0 left-0 h-full bg-brand-glow rounded-full"
            style={{ width: `${value}%` }}
        />
        <input 
            type="range" 
            min="0" 
            max="100" 
            value={value}
            onChange={onChange}
            className="w-full h-2 appearance-none bg-transparent cursor-pointer relative z-10
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-glow
                       [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-glow [&::-moz-range-thumb]:border-none"
        />
    </div>
);

const ToggleSwitch: React.FC<{ checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-300 dark:bg-brand-deep-purple rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
    </label>
);

const SettingsItem: React.FC<{ icon: React.ReactNode, label: React.ReactNode, children: React.ReactNode }> = ({ icon, label, children }) => (
    <div className="flex items-center justify-between py-2.5">
        <div className="flex items-center space-x-3">
            {icon}
            <span className="font-semibold text-gray-800 dark:text-white">{label}</span>
        </div>
        <div>{children}</div>
    </div>
);

const LinkItem: React.FC<{ icon: React.ReactNode, label: string, onClick?: () => void }> = ({ icon, label, onClick }) => (
     <button onClick={onClick} className="flex items-center justify-between w-full py-2.5 group">
        <div className="flex items-center space-x-3">
            {icon}
            <span className="font-semibold text-gray-800 dark:text-white group-hover:underline">{label}</span>
        </div>
    </button>
);


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isDarkMode, onToggleDarkMode, setView, setAppView }) => {
    const [musicVolume, setMusicVolume] = useState(60);
    const [isNotificationOn, setNotification] = useState(false);
    const [musicTracks, setMusicTracks] = useState<Track[]>(defaultMusic);
    const [isMusicListOpen, setIsMusicListOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const musicMenuRef = useRef<HTMLDivElement>(null);

    const { language, setLanguage } = useLanguage();
    const { t } = useTranslations();
    
    const uploadedMusicCount = musicTracks.filter(t => t.type === 'uploaded').length;

    const handleUploadClick = () => {
        if (uploadedMusicCount >= 10) {
            alert(t('uploadLimitReached'));
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && uploadedMusicCount < 10) {
            const newTrack: Track = {
                id: Date.now(),
                name: file.name,
                type: 'uploaded',
            };
            setMusicTracks(prev => [...prev, newTrack]);
        }
        event.target.value = ''; // Reset input to allow uploading the same file again
    };

    const handleDeleteTrack = (id: number) => {
        setMusicTracks(prev => prev.filter(track => track.id !== id));
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as 'en' | 'fil');
    };

    const handleHelpClick = () => {
        onClose();
        setAppView('help');
    };
    
    const handleAboutUsClick = () => {
        onClose();
        setAppView('aboutUs');
    };

    const handlePrivacyPolicyClick = () => {
        onClose();
        setAppView('privacyPolicy');
    };

    const handleLogout = () => {
        onClose();
        setAppView('main');
    };

    // Close music list if clicked outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (musicMenuRef.current && !musicMenuRef.current.contains(event.target as Node)) {
                setIsMusicListOpen(false);
            }
        };

        if (isMusicListOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMusicListOpen]);

    if (!isOpen) {
        return null;
    }
  
    return (
        <>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="hidden" 
                accept="audio/*" 
            />
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 p-4" onClick={onClose}>
                <div 
                    className="w-full max-w-sm rounded-2xl p-[2px] bg-gradient-to-b from-blue-500 to-brand-accent shadow-glow"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative bg-gray-50 dark:bg-[#21103F] rounded-[14px] p-6 flex flex-col text-gray-800 dark:text-white">
                        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-800 dark:text-white/70 dark:hover:text-white transition-colors" aria-label="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h2 className="text-2xl font-bold font-orbitron mb-4">{t('settings')}</h2>
                        
                        <div className="divide-y divide-gray-200 dark:divide-brand-light-purple/30">
                            <SettingsItem icon={<MusicIcon />} label={t('music')}>
                                <div ref={musicMenuRef} className="relative flex items-center space-x-3">
                                    <Slider value={musicVolume} onChange={(e) => setMusicVolume(parseInt(e.target.value, 10))} />
                                    <button onClick={handleUploadClick} aria-label="Upload music" className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={uploadedMusicCount >= 10}>
                                        <UploadIcon />
                                    </button>
                                    <button onClick={() => setIsMusicListOpen(!isMusicListOpen)} aria-label="Music options" className="text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
                                        <MeatballMenuIcon />
                                    </button>

                                    {isMusicListOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-56 bg-white/90 dark:bg-brand-deep-purple/90 backdrop-blur-md border border-gray-200 dark:border-brand-light-purple/50 rounded-lg shadow-lg z-30">
                                            <ul className="py-1 text-sm text-gray-600 dark:text-gray-200 max-h-48 overflow-y-auto">
                                                {musicTracks.map(track => (
                                                    <li key={track.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-brand-light-purple/20">
                                                        <span className="truncate" title={track.name}>{track.name}</span>
                                                        {track.type === 'uploaded' && (
                                                            <button onClick={() => handleDeleteTrack(track.id)} className="ml-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors">
                                                                <TrashIcon />
                                                            </button>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </SettingsItem>
                            <SettingsItem icon={<DarkModeIcon />} label={t('darkMode')}>
                                <ToggleSwitch checked={isDarkMode} onChange={onToggleDarkMode} />
                            </SettingsItem>
                            <SettingsItem icon={<LanguageIcon />} label={t('language')}>
                                <select 
                                    value={language}
                                    onChange={handleLanguageChange}
                                    className="bg-gray-100 dark:bg-brand-deep-purple border border-gray-300 dark:border-brand-light-purple/50 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-glow"
                                >
                                    <option value="en">{t('english')}</option>
                                    <option value="fil">{t('filipino')}</option>
                                </select>
                            </SettingsItem>
                            <SettingsItem icon={<NotificationIcon />} label={t('notificationToggle')}>
                                <ToggleSwitch checked={isNotificationOn} onChange={() => setNotification(!isNotificationOn)} />
                            </SettingsItem>
                            <LinkItem icon={<HelpIcon />} label={t('help')} onClick={handleHelpClick} />
                            <LinkItem icon={<AboutUsIcon />} label={t('aboutUs')} onClick={handleAboutUsClick} />
                            <LinkItem icon={<PrivacyIcon />} label={t('privacyPolicy')} onClick={handlePrivacyPolicyClick} />
                        </div>

                        <button 
                            onClick={handleLogout}
                            className="w-full bg-transparent border border-gray-300 dark:border-brand-light-purple/80 text-gray-800 dark:text-white font-semibold py-3 px-4 rounded-lg
                                         flex items-center justify-center mt-6
                                         transition-all duration-300 ease-in-out
                                         hover:bg-gray-100 dark:hover:bg-brand-light-purple/20 hover:shadow-glow
                                         focus:outline-none focus:ring-2 focus:ring-brand-glow focus:ring-opacity-75">
                            <LogoutIcon />
                            {t('logout')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsModal;