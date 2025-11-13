import React, { useState } from 'react';
import InputField from './InputField';
import LoginButton from './LoginButton';
import OutlineButton from './OutlineButton';
import { useTranslations } from '../hooks/useTranslations';

export interface TeacherAccountFormValues {
  fullName: string;
  employeeId: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type TeacherAccountFormSubmitResult =
  | { ok: true }
  | { ok: false; error?: string };

interface TeacherAccountFormProps {
  onSubmit: (
    values: Omit<TeacherAccountFormValues, 'confirmPassword'>,
  ) => Promise<TeacherAccountFormSubmitResult> | TeacherAccountFormSubmitResult;
  onSuccess?: (values: Omit<TeacherAccountFormValues, 'confirmPassword'>) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  includeCancelButton?: boolean;
  className?: string;
  initialValues?: Partial<TeacherAccountFormValues>;
  onLoadingChange?: (loading: boolean) => void;
}

const getTrimmedValues = (values: TeacherAccountFormValues) => ({
  fullName: values.fullName.trim(),
  employeeId: values.employeeId.trim(),
  email: values.email.trim(),
  password: values.password,
  confirmPassword: values.confirmPassword,
});

const TeacherAccountForm: React.FC<TeacherAccountFormProps> = ({
  onSubmit,
  onSuccess,
  onCancel,
  submitLabel,
  cancelLabel,
  includeCancelButton = false,
  className,
  initialValues,
  onLoadingChange,
}) => {
  const { t } = useTranslations();
  const [values, setValues] = useState<TeacherAccountFormValues>({
    fullName: initialValues?.fullName ?? '',
    employeeId: initialValues?.employeeId ?? '',
    email: initialValues?.email ?? '',
    password: initialValues?.password ?? '',
    confirmPassword: initialValues?.confirmPassword ?? '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange =
    (field: keyof TeacherAccountFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
      setError('');
    };

  const handleSubmit = async () => {
    const trimmed = getTrimmedValues(values);

    if (
      !trimmed.fullName ||
      !trimmed.employeeId ||
      !trimmed.email ||
      !trimmed.password ||
      !trimmed.confirmPassword
    ) {
      setError(t('allFieldsRequired'));
      return;
    }

    if (trimmed.password !== trimmed.confirmPassword) {
      setError(t('passwordsDoNotMatch') || 'Passwords do not match.');
      return;
    }

    setLoading(true);
    onLoadingChange?.(true);
    setError('');

    try {
      const result = await onSubmit({
        fullName: trimmed.fullName,
        employeeId: trimmed.employeeId,
        email: trimmed.email,
        password: trimmed.password,
      });

      if (!result?.ok) {
        const message = result?.error?.trim();
        setError(message && message.length > 0 ? message : t('registrationFailed') || 'Registration failed.');
        return;
      }

      setValues({
        fullName: '',
        employeeId: '',
        email: '',
        password: '',
        confirmPassword: '',
      });

      onSuccess?.({
        fullName: trimmed.fullName,
        employeeId: trimmed.employeeId,
        email: trimmed.email,
        password: trimmed.password,
      });
    } catch (err) {
      console.error('[TeacherAccountForm] onSubmit failed', err);
      setError(t('unableToConnect') || 'Unable to connect to server.');
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <div className={className ?? 'w-full space-y-4'}>
      <InputField
        type="text"
        placeholder={t('fullNamePlaceholder')}
        aria-label="Full Name"
        value={values.fullName}
        onChange={handleChange('fullName')}
        required
      />
      <InputField
        type="text"
        placeholder={t('employeeIdPlaceholder')}
        aria-label="Teacher ID"
        value={values.employeeId}
        onChange={handleChange('employeeId')}
        required
      />
      <InputField
        type="email"
        placeholder={t('emailPlaceholder')}
        aria-label="Email"
        value={values.email}
        onChange={handleChange('email')}
        required
      />
      <InputField
        type="password"
        placeholder={t('passwordPlaceholder')}
        aria-label="Password"
        value={values.password}
        onChange={handleChange('password')}
        required
      />
      <InputField
        type="password"
        placeholder={t('confirmPasswordPlaceholder')}
        aria-label="Confirm Password"
        value={values.confirmPassword}
        onChange={handleChange('confirmPassword')}
        required
      />

      {error && <p className="text-red-400 text-xs text-center -mt-2">{error}</p>}

      <LoginButton onClick={loading ? undefined : handleSubmit}>
        {loading ? t('loading') || 'Creating…' : submitLabel ?? t('createAccountButton')}
      </LoginButton>

      {includeCancelButton && onCancel && (
        <OutlineButton onClick={loading ? undefined : onCancel}>
          {cancelLabel ?? t('back')}
        </OutlineButton>
      )}
    </div>
  );
};

export default TeacherAccountForm;

