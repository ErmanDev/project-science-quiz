import React, { useState } from 'react';
import SciQuestLogo from './SciQuestLogo';
import InputField from './InputField';
import LoginButton from './LoginButton';
import OutlineButton from './OutlineButton';
import { useTranslations } from '../hooks/useTranslations';
import { REQUIRE_VERIFICATION, API_URL } from '../server/src/config';

interface CreateTeacherAccountProps {
  onBack: () => void;
  onAccountCreateSubmit: (username: string) => void;
}

const CreateTeacherAccount: React.FC<CreateTeacherAccountProps> = ({ onBack, onAccountCreateSubmit }) => {
  const { t } = useTranslations();
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fullName.trim() || !employeeId.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError(t('allFieldsRequired'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch') || 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: fullName,
          password,
          role: 'teacher',
          employeeId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || 'Registration failed.');
        return;
      }

      if ((data as any)?.token) localStorage.setItem('authToken', (data as any).token);
      if ((data as any)?.user) localStorage.setItem('currentUser', JSON.stringify((data as any).user));

      if (REQUIRE_VERIFICATION) {
        console.log('Verification required. Redirecting to VerifyCode...');
      } else {
        onAccountCreateSubmit(fullName);
      }
    } catch (e) {
      setError('Unable to connect to server.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SciQuestLogo />
      <p className="mb-6 text-gray-300 text-center text-sm">
        {t('learnPlayMaster')}
      </p>

      <div className="w-full space-y-4">
        <InputField
          type="text"
          placeholder={t('fullNamePlaceholder')}
          aria-label="Full Name"
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); setError(''); }}
          required
        />
        <InputField
          type="text"
          placeholder={t('employeeIdPlaceholder')}
          aria-label="Teacher ID"
          value={employeeId}
          onChange={(e) => { setEmployeeId(e.target.value); setError(''); }}
          required
        />
        <InputField
          type="email"
          placeholder={t('emailPlaceholder')}
          aria-label="Email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
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
        <InputField
          type="password"
          placeholder={t('confirmPasswordPlaceholder')}
          aria-label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
          required
        />

        {error && <p className="text-red-400 text-xs text-center -mt-2">{error}</p>}

        <LoginButton onClick={loading ? undefined : handleSubmit} disabled={loading}>
          {loading ? t('loading') || 'Creating…' : t('createAccountButton')}
        </LoginButton>
      </div>

      <div className="w-full border-t border-gray-500/50 my-6"></div>

      <div className="w-full">
        <OutlineButton onClick={loading ? undefined : onBack} disabled={loading}>
          {t('back')}
        </OutlineButton>
      </div>
    </>
  );
};

export default CreateTeacherAccount;
