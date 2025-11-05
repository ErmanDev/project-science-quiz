import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { HelpTitleIcon } from './icons';
import LoginButton from './LoginButton';

interface HelpScreenProps {
  onBack: () => void;
}

const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start space-x-3">
        <span className="mt-1.5 flex-shrink-0 w-3 h-3 rounded-full border-2 border-brand-glow bg-brand-accent/50"></span>
        <p className="text-gray-200 text-sm">{children}</p>
    </li>
);

const HelpScreen: React.FC<HelpScreenProps> = ({ onBack }) => {
  const { t } = useTranslations();

  return (
    <div className="w-full max-w-sm mx-auto h-screen flex flex-col text-white p-6">
        <div className="flex-grow space-y-5 overflow-y-auto hide-scrollbar pr-2">
            <div className="flex items-center">
                <HelpTitleIcon />
                <h2 className="font-orbitron text-4xl font-bold">{t('helpTitle')}</h2>
            </div>
            <p className="text-sm text-gray-300">{t('helpWelcome')}</p>

            <div className="space-y-2">
                <h3 className="font-bold text-xl">{t('mainFeatures')}</h3>
                <ul className="space-y-2">
                    <ListItem>{t('featureProfile')}</ListItem>
                    <ListItem>{t('featureQuizzes')}</ListItem>
                    <ListItem>{t('featureCardGame')}</ListItem>
                    <ListItem>{t('featureBoardGame')}</ListItem>
                    <ListItem>{t('featureLeaderboard')}</ListItem>
                    <ListItem>{t('featureSettings')}</ListItem>
                </ul>
            </div>
            
            <div className="space-y-2">
                <h3 className="font-bold text-xl">{t('howToPlay')}</h3>
                <ul className="space-y-2">
                    <ListItem>{t('step1')}</ListItem>
                    <ListItem>{t('step2')}</ListItem>
                    <ListItem>{t('step3')}</ListItem>
                    <ListItem>{t('step4')}</ListItem>
                </ul>
            </div>
        </div>
        <div className="flex-shrink-0 pt-4">
            <LoginButton onClick={onBack}>
                {t('back')}
            </LoginButton>
        </div>
    </div>
  );
};

export default HelpScreen;