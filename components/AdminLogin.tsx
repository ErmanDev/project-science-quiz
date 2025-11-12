import React, { useState } from 'react';
import SciQuestLogo from './SciQuestLogo';
import InputField from './InputField';
import LoginButton from './LoginButton';
import OutlineButton from './OutlineButton';
import { API_URL } from '../src/config';

interface AdminLoginProps {
  onBack: () => void;
  onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({
  onBack,
  onLogin,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginClick = async () => {
    if (!username.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username.trim(), password, portal: 'admin' }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setError(data?.error || 'Invalid email or password.');
        return;
      }

      if (data?.user?.role !== 'admin') {
        setError('Only administrators are allowed to log in.');
        return;
      }

      if (data?.token) localStorage.setItem('authToken', data.token);
      if (data?.user) localStorage.setItem('currentUser', JSON.stringify(data.user));

      onLogin();
    } catch (e) {
      console.error(e);
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SciQuestLogo />
      <p className="mt-2 text-gray-300 text-center font-semibold text-lg">Admin Portal</p>
      <p className="mt-1 mb-6 text-gray-300 text-center text-sm">Administrative Access</p>

      <div className="w-full space-y-4">
        <InputField
          type="text"
          placeholder="Username or Email"
          aria-label="Username or Email"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(''); }}
          required
        />
        <InputField
          type="password"
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          required
        />

        {error && <p className="text-red-400 text-xs text-center -mt-2">{error}</p>}

        <LoginButton onClick={loading ? undefined : handleLoginClick} disabled={loading}>
          {loading ? 'Signing in…' : 'Login'}
        </LoginButton>
      </div>

      <div className="w-full border-t border-gray-500/50 my-6" />

      <div className="w-full">
        <OutlineButton onClick={onBack}>Back</OutlineButton>
      </div>
    </>
  );
};

export default AdminLogin;

