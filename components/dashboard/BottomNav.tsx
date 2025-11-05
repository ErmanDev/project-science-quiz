

import React from 'react';
import { QuizIcon, RankingIcon, HomeIcon, BadgesIcon, ProfileIcon } from '../icons';
import { DashboardView } from '../../data/quizzes';
import { useTranslations } from '../../hooks/useTranslations';

interface BottomNavProps {
    activeView: DashboardView;
    onNavigate: (view: DashboardView) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onNavigate }) => {
    const { t } = useTranslations();

    const navItems = [
        { view: 'quizzes', label: t('quizzes'), icon: QuizIcon },
        { view: 'rankings', label: t('rankings'), icon: RankingIcon },
        { view: 'home', label: t('home'), icon: HomeIcon },
        { view: 'badges', label: t('badges'), icon: BadgesIcon },
        { view: 'profile', label: t('profile'), icon: ProfileIcon },
    ] as const;

    // Find the index of the active item to calculate the circle's position
    const activeIndex = navItems.findIndex(item => item.view === activeView);

    return (
        <div className="absolute bottom-0 left-0 right-0 w-full max-w-sm mx-auto">
            {/* The main nav container needs a fixed height to contain the elevated circle */}
            <nav className="relative h-24">
                {/* The background bar for the navigation */}
                <div className="absolute bottom-0 left-0 right-0 bg-gray-100/70 dark:bg-brand-mid-purple/70 backdrop-blur-md h-16 rounded-t-2xl"></div>

                {/* The sliding circle element that indicates the active item */}
                <div
                    className="absolute bottom-4 w-16 h-16 bg-gradient-to-b from-blue-500 to-brand-accent rounded-full shadow-glow border-4 border-gray-50 dark:border-brand-deep-purple transition-all duration-300 ease-in-out"
                    style={{
                        // This calculation moves the circle. Each item slot is 20% wide.
                        // We go to the middle of the slot (10%) and then pull back by half the circle's width (2rem).
                        left: activeIndex !== -1 ? `calc(${activeIndex * 20}% + 10% - 2rem)` : 'calc(50% - 2rem)',
                        opacity: activeIndex !== -1 ? 1 : 0, // Hide if no item is active (e.g., chat view)
                    }}
                ></div>

                {/* Container for the clickable button elements */}
                <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center">
                    {navItems.map((item, index) => {
                        const isActive = activeIndex === index;
                        const IconComponent = item.icon;

                        return (
                            <button
                                key={item.view}
                                onClick={() => onNavigate(item.view)}
                                aria-label={item.label}
                                className={`flex flex-col items-center justify-center space-y-1 w-1/5 h-full transition-all duration-300 ease-in-out
                                    ${isActive
                                        ? '-translate-y-4' // Lifts the active icon into the circle
                                        : 'text-gray-500 dark:text-gray-400 hover:text-brand-accent dark:hover:text-white'
                                    }
                                `}
                            >
                                <IconComponent isActive={isActive} />
                                {/* Only show label if the item is not active */}
                                {!isActive && <span className="text-xs">{item.label}</span>}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};

export default BottomNav;
