
import React from 'react';
import SciQuestLogo from './SciQuestLogo';
import InputField from './InputField';
import LoginButton from './LoginButton';
import { useTranslations } from '../hooks/useTranslations';

interface ResetPasswordProps {
  onPasswordReset: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onPasswordReset }) => {
  const { t } = useTranslations();
  return (
    <>
      <SciQuestLogo />
      <p className="mt-6 mb-6 text-gray-300 text-center">{t('resetPasswordTitle')}</p>

      <div className="w-full space-y-4">
        <InputField type="password" placeholder={t('newPasswordPlaceholder')} aria-label="Enter New Password" />
        <InputField type="password" placeholder={t('confirmPasswordPlaceholder')} aria-label="Confirm Password" />
        <LoginButton onClick={onPasswordReset}>{t('resetPasswordButton')}</LoginButton>
      </div>
    </>
  );
};

export default ResetPassword;