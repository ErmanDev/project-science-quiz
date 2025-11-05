
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface PasswordResetSuccessProps {
  onFinish: () => void;
}

const LockIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const PasswordResetSuccess: React.FC<PasswordResetSuccessProps> = ({ onFinish }) => {
  const { t } = useTranslations();
  return (
    <div className="relative w-full flex flex-col items-center text-center -m-8">
      <div className="absolute inset-0 flex items-center justify-center opacity-10 blur-md z-0 scale-125">
        {/* Intentionally empty for background effect from parent */}
      </div>
      <div className="relative z-10 w-full bg-gradient-to-b from-brand-accent/70 via-blue-500/60 to-brand-mid-purple/70 rounded-2xl p-8 flex flex-col items-center backdrop-blur-md border border-white/10">

        <div className="flex items-center mb-6">
          <LockIcon />
          <h2 className="text-xl font-bold text-white/80">{t('forgotPasswordTitle')}</h2>
        </div>
        
        <div className="w-full border-t border-white/20 my-4"></div>

        <div className="flex items-center mt-4">
            <CheckIcon />
            <h3 className="text-2xl font-bold text-white">{t('passwordResetSuccessTitle')}</h3>
        </div>

        <p className="mt-4 text-sm text-gray-200 max-w-xs">
          {t('passwordResetSuccessMessage')}
        </p>
        
        <button
          onClick={onFinish}
          className={`w-full font-bold py-3 px-4 rounded-lg mt-8
                     transition-all duration-300 ease-in-out
                     focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-75
                     bg-black/50 border border-blue-300/50 hover:bg-black/70 hover:shadow-glow text-white`}
        >
          {t('okay')}
        </button>
      </div>
    </div>
  );
};

export default PasswordResetSuccess;