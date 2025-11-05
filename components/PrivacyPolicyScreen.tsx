import React, { useState, useEffect } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { PrivacyTitleIcon } from './icons';
import LoginButton from './LoginButton';
import TermsAndConditionsModal from './TermsAndConditionsModal';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start space-x-3">
        <span className="mt-1.5 flex-shrink-0 w-3 h-3 rounded-full border-2 border-brand-glow bg-brand-accent/50"></span>
        <p className="text-gray-200 text-sm">{children}</p>
    </li>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-2">
        <h3 className="font-bold text-xl">{title}</h3>
        {children}
    </div>
);

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onBack }) => {
  const { t } = useTranslations();
  const [isChecked, setIsChecked] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('termsAccepted') === 'true') {
        setIsChecked(true);
    }
  }, []);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setIsChecked(checked);
      localStorage.setItem('termsAccepted', String(checked));
  };
  
  const handleAcceptTerms = () => {
      localStorage.setItem('termsAccepted', 'true');
      setIsChecked(true);
      setIsTermsModalOpen(false);
  };

  return (
    <>
      <div className="w-full max-w-sm mx-auto h-screen flex flex-col text-white p-6">
          <div className="flex-grow space-y-4 overflow-y-auto hide-scrollbar pr-2 pb-4">
              <div className="flex items-center">
                  <PrivacyTitleIcon />
                  <h2 className="font-orbitron text-3xl font-bold">{t('privacyPolicyTitle')}</h2>
              </div>
              
              <p className="text-sm text-gray-300">{t('privacyPolicyIntro')}</p>

              <Section title={t('infoWeCollectTitle')}>
                  <ul className="space-y-2">
                      <ListItem>{t('infoProfile')}</ListItem>
                      <ListItem>{t('infoProgress')}</ListItem>
                      <ListItem>{t('infoAppSettings')}</ListItem>
                  </ul>
              </Section>

              <Section title={t('howWeUseDataTitle')}>
                  <ul className="space-y-2">
                      <ListItem>{t('usePersonalize')}</ListItem>
                      <ListItem>{t('useTrackPerformance')}</ListItem>
                      <ListItem>{t('useProvideRankings')}</ListItem>
                      <ListItem>{t('useSaveChanges')}</ListItem>
                  </ul>
              </Section>
              
              <Section title={t('dataProtectionTitle')}>
                  <p className="text-sm text-gray-300">{t('dataProtectionText')}</p>
              </Section>

              <Section title={t('parentalGuidanceTitle')}>
                  <p className="text-sm text-gray-300">{t('parentalGuidanceText')}</p>
              </Section>

              <Section title={t('changesToPolicyTitle')}>
                  <p className="text-sm text-gray-300">{t('changesToPolicyText')}</p>
              </Section>

              <p className="text-xs text-gray-400 italic pt-2">{t('privacyPolicyNote')}</p>
          </div>
          <div className="flex-shrink-0 pt-4 border-t border-brand-light-purple/20">
              <div className="flex items-center space-x-2 mb-4">
                  <input
                      type="checkbox"
                      id="terms-checkbox-privacy"
                      checked={isChecked}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 rounded border-gray-300 text-brand-accent focus:ring-brand-glow bg-brand-deep-purple/50 accent-brand-accent"
                  />
                  <label htmlFor="terms-checkbox-privacy" className="text-sm text-gray-300">
                      {t('agreeToTerms')}{' '}
                      <button onClick={() => setIsTermsModalOpen(true)} className="underline text-brand-glow hover:text-white bg-transparent border-none p-0">
                          {t('termsTitle')}
                      </button>
                  </label>
              </div>
              <LoginButton onClick={onBack}>
                  {t('back')}
              </LoginButton>
          </div>
      </div>
      <TermsAndConditionsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={handleAcceptTerms}
      />
    </>
  );
};

export default PrivacyPolicyScreen;