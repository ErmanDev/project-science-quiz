import React, { useState } from 'react';
import SciQuestLogo from './SciQuestLogo';
import { useTranslations } from '../hooks/useTranslations';
import { REQUIRE_VERIFICATION, API_URL } from '../server/src/config';
import TeacherAccountForm, { TeacherAccountFormSubmitResult } from './TeacherAccountForm';
import OutlineButton from './OutlineButton';

interface CreateTeacherAccountProps {
  onBack: () => void;
  onAccountCreateSubmit: (username: string) => void;
}

const CreateTeacherAccount: React.FC<CreateTeacherAccountProps> = ({ onBack, onAccountCreateSubmit }) => {
  const { t } = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async ({
    fullName,
    email,
    password,
    employeeId,
  }: {
    fullName: string;
    email: string;
    password: string;
    employeeId: string;
  }): Promise<TeacherAccountFormSubmitResult> => {
    try {
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
        const message = data?.error || t('registrationFailed') || 'Registration failed.';
        return { ok: false, error: message };
      }

      if ((data as any)?.token) localStorage.setItem('authToken', (data as any).token);
      if ((data as any)?.user) localStorage.setItem('currentUser', JSON.stringify((data as any).user));

      if (REQUIRE_VERIFICATION) {
        console.log('Verification required. Redirecting to VerifyCode...');
      }

      return { ok: true };
    } catch (e) {
      console.error(e);
      const message = t('unableToConnect') || 'Unable to connect to server.';
      return { ok: false, error: message };
    }
  };

  return (
    <>
      <SciQuestLogo />
      <p className="mb-6 text-gray-300 text-center text-sm">
        {t('learnPlayMaster')}
      </p>

      <TeacherAccountForm
        onSubmit={handleSubmit}
        onSuccess={({ fullName }) => {
          if (!REQUIRE_VERIFICATION) {
            onAccountCreateSubmit(fullName);
          }
        }}
        includeCancelButton={false}
        submitLabel={t('createAccountButton')}
        cancelLabel={t('back')}
        className="w-full space-y-4"
        onLoadingChange={setIsSubmitting}
      />

      <div className="w-full border-t border-gray-500/50 my-6" />

      <div className="w-full">
        <OutlineButton onClick={isSubmitting ? undefined : onBack}>
          {t('back')}
        </OutlineButton>
      </div>
    </>
  );
};

export default CreateTeacherAccount;
