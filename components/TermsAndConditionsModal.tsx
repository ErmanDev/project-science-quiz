import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import OutlineButton from './OutlineButton';
import LoginButton from './LoginButton';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({ isOpen, onClose, onAccept }) => {
  const { t } = useTranslations();

  if (!isOpen) {
    return null;
  }
  
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const Section: React.FC<{ title: string, content: string }> = ({ title, content }) => (
      <div className="space-y-1">
          <h3 className="font-bold text-lg text-brand-glow">{title}</h3>
          <p className="text-sm text-gray-300">{content}</p>
      </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm bg-gradient-to-b from-brand-accent/90 via-blue-500/80 to-brand-mid-purple/90 rounded-2xl p-6 flex flex-col backdrop-blur-md border border-white/10 text-white"
        onClick={handleModalContentClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
      >
        <button onClick={onClose} className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <h2 id="terms-title" className="text-2xl font-bold font-orbitron mb-4 text-center">{t('termsTitle')}</h2>
        
        <div className="flex-grow space-y-4 overflow-y-auto hide-scrollbar pr-2 max-h-64 mb-6">
            <Section title={t('termsContentP1Title')} content={t('termsContentP1')} />
            <Section title={t('termsContentP2Title')} content={t('termsContentP2')} />
            <Section title={t('termsContentP3Title')} content={t('termsContentP3')} />
            <Section title={t('termsContentP4Title')} content={t('termsContentP4')} />
        </div>

        <div className="flex space-x-4">
            <OutlineButton onClick={onClose}>{t('decline')}</OutlineButton>
            <LoginButton onClick={onAccept}>{t('accept')}</LoginButton>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsModal;