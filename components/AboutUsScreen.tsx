import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { AboutUsTitleIcon } from './icons';
import LoginButton from './LoginButton';

interface AboutUsScreenProps {
  onBack: () => void;
}

const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start space-x-3">
        <span className="mt-1.5 flex-shrink-0 w-3 h-3 rounded-full border-2 border-brand-glow bg-brand-accent/50"></span>
        <p className="text-gray-200 text-sm">{children}</p>
    </li>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-1">
        <h3 className="font-bold text-xl">{title}</h3>
        {children}
    </div>
);

const AboutUsScreen: React.FC<AboutUsScreenProps> = ({ onBack }) => {
  const { t } = useTranslations();

  return (
    <div className="w-full max-w-sm mx-auto h-screen flex flex-col text-white p-6">
        <div className="flex-grow space-y-5 overflow-y-auto hide-scrollbar pr-2">
            <div className="flex items-center">
                <AboutUsTitleIcon />
                <h2 className="font-orbitron text-4xl font-bold">{t('aboutUsTitle')}</h2>
            </div>
            
            <p className="text-sm text-gray-300">{t('aboutUsIntro')}</p>

            <Section title={t('missionTitle')}>
                <p className="text-sm text-gray-300">{t('missionText')}</p>
            </Section>

            <Section title={t('visionTitle')}>
                <p className="text-sm text-gray-300">{t('visionText')}</p>
            </Section>
            
            <Section title={t('ourTeamTitle')}>
                <ul className="space-y-2">
                    <ListItem>{t('teamProjectLeader')}</ListItem>
                    <ListItem>{t('teamUIDesigner')}</ListItem>
                    <ListItem>{t('teamDeveloper')}</ListItem>
                    <ListItem>{t('teamContentSpecialist')}</ListItem>
                </ul>
            </Section>

            <p className="text-xs text-gray-400 italic pt-4">{t('aboutUsNote')}</p>
        </div>
        <div className="flex-shrink-0 pt-4">
            <LoginButton onClick={onBack}>
                {t('back')}
            </LoginButton>
        </div>
    </div>
  );
};

export default AboutUsScreen;