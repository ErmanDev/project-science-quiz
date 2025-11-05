import React, { useState, useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';

interface TeamPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDone: (teamName: string, members: string[]) => void;
  studentName: string;
}

// Simple generic avatar icons for the modal
const MemberAvatar: React.FC<{ index: number }> = ({ index }) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    const color = colors[index % colors.length];
    return (
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        </div>
    );
};

const TeamPlayersModal: React.FC<TeamPlayersModalProps> = ({ isOpen, onClose, onDone, studentName }) => {
    const { t } = useTranslations();
    const [teamName, setTeamName] = useState('');
    const [members, setMembers] = useState<string[]>([]);
    const [newMemberName, setNewMemberName] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setTeamName('');
            setMembers([studentName]);
            setNewMemberName('');
        }
    }, [isOpen, studentName]);

    if (!isOpen) return null;

    const handleAddMember = () => {
        if (newMemberName.trim()) {
            setMembers([...members, newMemberName.trim()]);
            setNewMemberName('');
        }
    };
    
    const handleRemoveMember = (index: number) => {
        // student can't remove themselves
        if (index === 0) return;
        setMembers(members.filter((_, i) => i !== index));
    };

    const handleDone = () => {
        if (teamName.trim() && members.length > 0) {
            onDone(teamName.trim(), members);
        }
    };
    
    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-sm bg-gradient-to-b from-[#1e3a8a] via-[#2c1250] to-[#1a0b2e] rounded-2xl p-6 flex flex-col items-center border border-brand-light-purple/50 text-white"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-3xl font-bold font-orbitron mb-6">Team Players</h2>
                
                <div className="w-full text-left mb-4">
                    <label className="font-semibold text-gray-300">Members</label>
                    <div className="flex items-center space-x-2 mt-2 py-2 overflow-x-auto">
                        {members.map((member, index) => (
                           <div key={index} className="relative flex-shrink-0 group text-center">
                                <MemberAvatar index={index} />
                                <p className="text-xs mt-1 truncate w-12">{member.split(' ')[0]}</p>
                                {index > 0 && ( // Don't allow removing the current user
                                    <button
                                        onClick={() => handleRemoveMember(index)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-white flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label={`Remove ${member}`}
                                    >
                                        &times;
                                    </button>
                                )}
                           </div>
                        ))}
                    </div>
                </div>

                <div className="w-full space-y-4">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            placeholder="Enter member name"
                            className="w-full bg-brand-deep-purple/50 border border-brand-light-purple/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow"
                        />
                         <button onClick={handleAddMember} className="p-3 bg-brand-accent rounded-full hover:shadow-glow transition-shadow">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </button>
                    </div>

                    <div>
                        <label className="font-semibold text-gray-300 mb-2 block text-left">Team Name</label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Enter your team name"
                            className="w-full bg-brand-deep-purple/50 border border-brand-light-purple/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow"
                        />
                    </div>
                </div>

                <div className="w-full flex space-x-4 mt-8">
                    <button onClick={onClose} className="w-full bg-brand-mid-purple/80 border border-brand-light-purple text-white font-semibold py-3 rounded-lg transition-colors hover:bg-brand-light-purple/80">
                        {t('cancel')}
                    </button>
                    <button onClick={handleDone} disabled={!teamName.trim() || members.length === 0} className="w-full bg-brand-accent text-white font-semibold py-3 rounded-lg transition-all hover:bg-opacity-90 hover:shadow-glow disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                        {t('done')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeamPlayersModal;
