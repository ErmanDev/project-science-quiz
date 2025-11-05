
import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';

const LeaderboardPodium: React.FC<{ position: number; name: string; avatar: string; color: string; order: number; offset: string }> = ({ position, avatar, color, order, offset }) => (
    <div className={`flex flex-col items-center order-${order}`}>
        <img src={avatar} alt={`Rank ${position}`} className={`w-16 h-16 rounded-full border-4 ${color}`} style={{ transform: `translateY(${offset})` }}/>
        <span className="text-xs mt-2 text-gray-500 dark:text-gray-300">{position}</span>
    </div>
);

const Badge: React.FC<{imgSrc: string}> = ({imgSrc}) => (
    <div className="w-16 h-16">
        <img src={imgSrc} alt="Badge" />
    </div>
);

const LastQuiz: React.FC = () => {
  const { t } = useTranslations();
  return (
    <div className="bg-white dark:bg-brand-mid-purple/80 rounded-2xl p-4">
      <h2 className="font-bold text-lg mb-2">{t('lastQuiz')}</h2>
      
      {/* Leaderboard */}
      <div className="mb-4">
        <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-300 mb-2">{t('leaderboard')}</h3>
        <div className="flex justify-around items-end h-28">
            <LeaderboardPodium position={2} name="Jane" avatar="https://i.pravatar.cc/150?img=47" color="border-gray-400" order={2} offset="0px" />
            <LeaderboardPodium position={1} name="John" avatar="https://i.pravatar.cc/150?img=68" color="border-yellow-400" order={1} offset="-20px" />
            <LeaderboardPodium position={3} name="Doe" avatar="https://i.pravatar.cc/150?img=32" color="border-yellow-700" order={3} offset="0px"/>
        </div>
      </div>
      
      {/* Badges */}
      <div>
        <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-300 mb-2">{t('badges')}</h3>
        <div className="flex space-x-4">
            <Badge imgSrc="https://i.imgur.com/sR4aG2b.png" />
            <Badge imgSrc="https://i.imgur.com/3Z4a2Zg.png" />
        </div>
      </div>
    </div>
  );
};

export default LastQuiz;