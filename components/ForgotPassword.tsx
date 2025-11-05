
import React, { useState } from 'react';
import SciQuestLogo from './SciQuestLogo';
import InputField from './InputField';
import LoginButton from './LoginButton';
import OutlineButton from './OutlineButton';
import { useTranslations } from '../hooks/useTranslations';

interface ForgotPasswordProps {
  onBack: () => void;
  onSendCode: () => void;
}

const LockIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-brand-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V7a4 4 0 018 0v2" />
  </svg>
);

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onSendCode }) => {
  const { t } = useTranslations();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSendCodeClick = () => {
    if (!email.trim()) {
      setError(t('allFieldsRequired'));
      return;
    }
    setError('');
    onSendCode();
  };

  return (
    <>
      <SciQuestLogo />
      <div className="flex items-center mt-6 mb-2">
        <LockIcon />
        <h2 className="text-2xl font-bold text-white">{t('forgotPasswordTitle')}</h2>
      </div>
      <p className="mb-6 text-gray-300 text-center">{t('forgotPasswordInstruction')}</p>
      
      <div className="w-full space-y-4">
        <InputField
          type="email"
          placeholder={t('emailPlaceholder')}
          aria-label="Email for password recovery"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          required
        />
        {error && <p className="text-red-400 text-xs text-center -mt-2">{error}</p>}
        <LoginButton onClick={handleSendCodeClick}>{t('sendVerificationCode')}</LoginButton>
      </div>

      <div className="w-full mt-6">
        <OutlineButton onClick={onBack}>{t('back')}</OutlineButton>
      </div>
    </>
  );
};

export default ForgotPassword;
