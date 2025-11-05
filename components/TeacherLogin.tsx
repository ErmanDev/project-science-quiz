import React, { useState } from 'react';
import SciQuestLogo from './SciQuestLogo';
import InputField from './InputField';
import LoginButton from './LoginButton';
import OutlineButton from './OutlineButton';
import { useTranslations } from '../hooks/useTranslations';
import TermsAndConditionsModal from './TermsAndConditionsModal';
import { API_URL } from '../server/src/config';

interface TeacherLoginProps {
  onBack: () => void;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
  onLogin: () => void;
}

const TeacherLogin: React.FC<TeacherLoginProps> = ({
  onBack,
  onForgotPassword,
  onCreateAccount,
  onLogin,
}) => {
  const { t } = useTranslations();
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginClick = async () => {
    if (!username.trim() || !password.trim()) {
      setError(t('allFieldsRequired'));
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username.trim(), password }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setError(data?.error || 'Invalid email or password.');
        return;
      }

      if (data?.user?.role !== 'teacher') {
        setError('Only teachers are allowed to log in.');
        return;
      }

      if (data?.token) localStorage.setItem('authToken', data.token);
      if (data?.user) localStorage.setItem('currentUser', JSON.stringify(data.user));

      const termsAccepted = localStorage.getItem('teacherTermsAccepted');
      if (termsAccepted === 'true') {
        onLogin();
      } else {
        setIsTermsModalOpen(true);
      }
    } catch (e) {
      console.error(e);
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTerms = () => {
    localStorage.setItem('teacherTermsAccepted', 'true');
    setIsTermsModalOpen(false);
    onLogin();
  };

  return (
    <>
      <SciQuestLogo />
      <p className="mt-2 text-gray-300 text-center font-semibold text-lg">{t('teacherPortal')}</p>
      <p className="mt-1 mb-6 text-gray-300 text-center text-sm">{t('learnPlayMaster')}</p>

      <div className="w-full space-y-4">
        <InputField
          type="text"
          placeholder={t('usernameEmailPlaceholder')}
          aria-label="Username or Email"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(''); }}
          required
        />
        <InputField
          type="password"
          placeholder={t('passwordPlaceholder')}
          aria-label="Password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          required
        />

        {error && <p className="text-red-400 text-xs text-center -mt-2">{error}</p>}

        <LoginButton onClick={loading ? undefined : handleLoginClick} disabled={loading}>
          {loading ? (t('loading') || 'Signing in…') : t('login')}
        </LoginButton>
      </div>

      {/* <div className="text-center mt-4 w-full">
        <button onClick={onForgotPassword} className="text-sm text-brand-glow hover:underline bg-transparent border-none">
          {t('forgotPasswordPrompt')}
        </button>
      </div> */}

      <div className="text-center mt-2 text-sm text-gray-400">
        {t('dontHaveAccount')}{' '}
        <button onClick={onCreateAccount} className="text-sm text-brand-glow hover:underline bg-transparent border-none">
          {t('createAccountNow')}
        </button>
      </div>

      <div className="w-full border-t border-gray-500/50 my-6" />

      <div className="w-full">
        <OutlineButton onClick={onBack}>{t('back')}</OutlineButton>
      </div>

      <TermsAndConditionsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={handleAcceptTerms}
      />
    </>
  );
};

export default TeacherLogin;
