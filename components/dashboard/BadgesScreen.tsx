
import React, { useState } from 'react';
import { Badge as BadgeType, BadgeCategory } from '../../data/badges';
import { useTranslations } from '../../hooks/useTranslations';

type FilterType = 'SOLO' | 'TEAM' | 'CLASSROOM';

// Modal component for showing badge details
const BadgeDetailModal: React.FC<{ badge: BadgeType; onClose: () => void }> = ({ badge, onClose }) => {
    const { t } = useTranslations();
    const isUnlocked = badge.progress >= badge.goal;
    
    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-sm bg-gradient-to-b from-brand-accent/90 via-blue-500/80 to-brand-mid-purple/90 rounded-2xl p-6 flex flex-col items-center backdrop-blur-md border border-white/10 text-white text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <img 
                    src={badge.imgSrc} 
                    alt={badge.name} 
                    className={`w-32 h-32 object-contain mb-4 ${!isUnlocked ? 'filter grayscale' : ''}`} 
                />
                <h3 className="text-2xl font-bold font-orbitron">{badge.name}</h3>
                <p className="text-sm text-gray-200 my-2">{badge.description}</p>
                <p className="font-semibold text-lg text-brand-glow mt-2">
                    {t('badgeProgress')}: {badge.progress} / {badge.goal}
                </p>
                <button
                    onClick={onClose}
                    className="mt-6 w-full font-bold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out bg-black/50 border border-blue-300/50 hover:bg-black/70 hover:shadow-glow text-white"
                >
                    {t('close')}
                </button>
            </div>
        </div>
    );
};


// Grid item component for each badge
const BadgeGridItem: React.FC<{ badge: BadgeType; onSelect: () => void; }> = ({ badge, onSelect }) => {
    const isUnlocked = badge.progress >= badge.goal;
    const progressPercentage = Math.min((badge.progress / badge.goal) * 100, 100);

    return (
        <button 
            onClick={onSelect}
            className="flex flex-col items-center text-center space-y-2 group"
            aria-label={`View details for ${badge.name}`}
        >
            <div className="w-20 h-20 bg-gray-100 dark:bg-black/20 rounded-lg flex items-center justify-center p-1 group-hover:bg-gray-200 dark:group-hover:bg-black/40 transition-colors">
                <img 
                    src={badge.imgSrc} 
                    alt={badge.name} 
                    className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 ${!isUnlocked ? 'filter grayscale opacity-60' : ''}`}
                />
            </div>
            <div className="w-full bg-gray-200 dark:bg-black/30 rounded-full h-2">
                <div 
                    className={`h-2 rounded-full transition-all duration-500 ${isUnlocked ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.7)]' : 'bg-brand-glow shadow-[0_0_8px_rgba(167,153,255,0.7)]'}`}
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
             <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">{badge.progress}/{badge.goal}</p>
        </button>
    );
};

const FilterButton: React.FC<{ label: FilterType; activeFilter: FilterType; setFilter: (filter: FilterType) => void; }> = ({ label, activeFilter, setFilter }) => {
    const { t } = useTranslations();
    const isActive = label === activeFilter;
    const translationKey = label.toLowerCase() as 'solo' | 'team' | 'classroom';
    return (
        <button
            onClick={() => setFilter(label)}
            className={`w-full font-semibold py-2 px-4 rounded-lg transition-all duration-300 text-sm
                        ${isActive
                            ? 'bg-gradient-to-r from-blue-500 to-brand-accent shadow-glow text-white'
                            : 'bg-transparent border border-gray-300 dark:border-brand-light-purple/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-black/40'}`
            }
        >
            {t(translationKey)}
        </button>
    );
};

interface BadgesScreenProps {
    badgeProgress: BadgeCategory[];
}

const BadgesScreen: React.FC<BadgesScreenProps> = ({ badgeProgress }) => {
    const [activeFilter, setActiveFilter] = useState<FilterType>('SOLO');
    const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
    const { t } = useTranslations();
    
    // In a real app, this would filter badgeData based on the activeFilter
    const displayedCategories = badgeProgress;

    return (
        <>
            <div className="space-y-4">
                <h2 className="text-4xl font-bold font-orbitron dark:text-white" style={{ textShadow: '0 0 8px #a799ff' }}>
                    {t('badges')}
                </h2>
                
                <div className="flex space-x-2">
                    <FilterButton label="SOLO" activeFilter={activeFilter} setFilter={setActiveFilter} />
                    <FilterButton label="TEAM" activeFilter={activeFilter} setFilter={setActiveFilter} />
                    <FilterButton label="CLASSROOM" activeFilter={activeFilter} setFilter={setActiveFilter} />
                </div>

                <div className="bg-white dark:bg-brand-mid-purple/30 rounded-2xl border border-gray-200 dark:border-brand-light-purple/50 p-4 shadow-lg space-y-6"
                     style={{ boxShadow: '0 0 15px rgba(75, 42, 133, 0.6), inset 0 0 10px rgba(75, 42, 133, 0.4)' }}
                >
                    {displayedCategories.map((category) => (
                        <div key={category.id}>
                            <h3 className="text-xl font-orbitron font-bold mb-3 text-brand-glow">{category.title}</h3>
                            <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                                {category.badges.map((badge) => (
                                    <BadgeGridItem key={badge.id} badge={badge} onSelect={() => setSelectedBadge(badge)} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedBadge && <BadgeDetailModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />}
        </>
    );
};

export default BadgesScreen;
