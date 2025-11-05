import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { Message } from '../../data/messages';

interface MessageDetailModalProps {
  isOpen: boolean;
  message: Message | null;
  onClose: () => void;
}

const MessageDetailModal: React.FC<MessageDetailModalProps> = ({ isOpen, message, onClose }) => {
    const { t } = useTranslations();
    
    if (!isOpen || !message) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-sm bg-gradient-to-b from-brand-accent/90 via-blue-500/80 to-brand-mid-purple/90 rounded-2xl p-6 flex flex-col backdrop-blur-md border border-white/10 text-white"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h3 className="text-2xl font-bold font-orbitron">{message.title}</h3>
                <div className="text-xs text-left text-gray-300 my-2">
                    <span>From: {message.sender}</span> | <span>{message.date}</span>
                </div>
                <div className="flex-grow bg-black/20 p-4 rounded-lg text-sm text-gray-200 overflow-y-auto hide-scrollbar max-h-60 my-4">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                <button
                    onClick={onClose}
                    className="mt-4 w-full font-bold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out bg-black/50 border border-blue-300/50 hover:bg-black/70 hover:shadow-glow text-white"
                >
                    {t('close')}
                </button>
            </div>
        </div>
    );
};

export default MessageDetailModal;