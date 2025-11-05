import React, {
  useState,
  useRef,
  useEffect,            // ✅ import useEffect
  ChangeEvent,
  KeyboardEvent,
  useMemo,
} from 'react';
import SciQuestLogo from './SciQuestLogo';
import { useTranslations } from '../hooks/useTranslations';
import { REQUIRE_VERIFICATION } from '../server/src/config';  // ✅ correct path

interface VerifyCodeProps {
  email: string;
  onSuccess: () => void;
}

// Small icon component is unchanged
const UsbIcon: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white mb-2">
    <defs>
      <linearGradient id="usbGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a799ff" />
        <stop offset="100%" stopColor="#6c47ff" />
      </linearGradient>
      <filter id="usbGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#usbGlow)" opacity="0.8">
      <path d="M15 5H9C8.44772 5 8 5.44772 8 6V10H16V6C16 5.44772 15.5523 5 15 5Z" stroke="url(#usbGradient)" strokeWidth="1.5" />
      <path d="M12 5V2M12 2H13.5M12 2H10.5" stroke="url(#usbGradient)" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="6" y="10" width="12" height="9" rx="2" stroke="url(#usbGradient)" strokeWidth="1.5" />
      <circle cx="10" cy="14" r="0.5" fill="white" />
      <circle cx="14" cy="14" r="0.5" fill="white" />
      <circle cx="10" cy="16.5" r="0.5" fill="white" />
      <circle cx="14" cy="16.5" r="0.5" fill="white" />
    </g>
  </svg>
);

const VerifyCode: React.FC<VerifyCodeProps> = ({ email, onSuccess }) => {
  // 🔒 Auto-skip when verification is disabled
  useEffect(() => {
    if (!REQUIRE_VERIFICATION) {
      onSuccess(); // immediately continue the flow
    }
  }, [onSuccess]);

  if (!REQUIRE_VERIFICATION) return null; // render nothing when disabled

  const [otp, setOtp] = useState<string[]>(new Array(4).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { t } = useTranslations();

  const isOtpComplete = useMemo(() => otp.every(d => d !== ''), [otp]);

  const handleSuccess = () => {
    if (isOtpComplete) onSuccess();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center text-center -m-8">
      <div className="absolute inset-0 flex items-center justify-center opacity-10 blur-md z-0 scale-125">
        <SciQuestLogo />
      </div>
      <div className="relative z-10 w-full bg-gradient-to-b from-brand-accent/70 via-blue-500/60 to-brand-mid-purple/70 rounded-2xl p-6 flex flex-col items-center backdrop-blur-md border border-white/10">
        <UsbIcon />
        <h2 className="text-3xl font-bold font-orbitron text-white" style={{ textShadow: '0 0 8px rgba(255,255,255,0.8)' }}>
          {t('verifyNow')}
        </h2>
        <p className="mt-2 text-sm text-gray-200 max-w-xs">
          {t('verifyInstruction')}
        </p>
        <p className="text-sm font-semibold text-white my-2">{email}</p>

        <div className="flex justify-center space-x-3 my-6">
          {otp.map((data, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              value={data}
              onChange={e => handleChange(e, index)}
              onKeyDown={e => handleKeyDown(e, index)}
              maxLength={1}
              className="w-12 h-14 text-center text-2xl font-bold text-white bg-black/20 border border-blue-300/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
              aria-label={`Digit ${index + 1} of authentication code`}
            />
          ))}
        </div>

        <p className="text-sm text-gray-200 mb-4">{t('enterAuthCode')}</p>

        <button
          onClick={handleSuccess}
          disabled={!isOtpComplete}
          className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-75 ${
            isOtpComplete
              ? 'bg-black/50 border border-blue-300/50 hover:bg-black/70 hover:shadow-glow'
              : 'bg-gray-700/50 border border-gray-600 text-gray-400 cursor-not-allowed'
          }`}
          style={isOtpComplete ? { color: '#66d9ff', textShadow: '0 0 8px #66d9ff' } : {}}
        >
          {t('submit')}
        </button>
      </div>
    </div>
  );
};

export default VerifyCode;
