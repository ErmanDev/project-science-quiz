
import React from 'react';
import { TeacherProfileData } from './EditTeacherProfileModal';

interface TeacherHeaderProps {
    onCreateClassClick: () => void;
    profile: TeacherProfileData;
}

const getInitials = (name: string) => {
    const names = name.trim().split(' ');
    if (names.length > 1 && names[names.length - 1]) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const TeacherHeader: React.FC<TeacherHeaderProps> = ({ onCreateClassClick, profile }) => {
    return (
        <header className="p-4">
            <div className="flex items-center justify-between space-x-4">
                 <div className="flex items-center space-x-3">
                    {profile.avatar ? (
                        <img src={profile.avatar} alt="Teacher Avatar" className="w-12 h-12 rounded-lg object-cover shadow-lg" />
                    ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-brand-accent rounded-lg flex items-center justify-center font-bold text-2xl text-white shadow-lg">
                            {getInitials(profile.name)}
                        </div>
                    )}
                    <div>
                        <h1 className="font-bold text-lg text-gray-800 dark:text-white">{profile.name}</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">"{profile.motto}"</p>
                    </div>
                </div>
                <button 
                  onClick={onCreateClassClick}
                  className="bg-brand-mid-purple/80 border border-brand-light-purple text-white text-sm font-semibold py-2 px-4 rounded-lg
                                   hover:bg-brand-light-purple/80 transition-colors duration-300">
                  Create Class
                </button>
            </div>
        </header>
    );
};

export default TeacherHeader;
