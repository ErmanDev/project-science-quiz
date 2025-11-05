import React, { useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnnounce: (message: string) => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ isOpen, onClose, onAnnounce }) => {
  const { t } = useTranslations();
  const [message, setMessage] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleAnnounceClick = () => {
    if (message.trim()) {
      onAnnounce(message);
      setMessage('');
    }
  };

  return (
    <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10"
        onClick={onClose}
    >
      <div
        className="absolute top-36 left-4 right-4 bg-gradient-to-b from-blue-600 to-brand-accent rounded-2xl p-6 flex flex-col items-center border border-white/10 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">{t('announcement')}</h2>
        
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('enterYourMessage')}
          className="w-full h-32 bg-brand-deep-purple/50 border-2 border-brand-light-purple/50 rounded-lg p-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-glow transition-all duration-300 resize-none"
        />

        <button
          onClick={handleAnnounceClick}
          disabled={!message.trim()}
          className="mt-6 bg-brand-mid-purple/80 border border-brand-light-purple text-white font-semibold py-2 px-8 rounded-lg transition-all duration-300 ease-in-out hover:bg-brand-light-purple/80 focus:outline-none focus:ring-2 focus:ring-brand-glow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('send')}
        </button>
      </div>
    </div>
  );
};

export default AnnouncementModal;