import React, { useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { getMessages, Message } from '../../data/messages';
import MessageDetailModal from './MessageDetailModal';

interface MessagesInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
}

const MessageItem: React.FC<{ message: Message; onClick: () => void }> = ({ message, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="w-full text-left p-3 bg-white/5 dark:bg-black/20 rounded-lg shadow-sm hover:bg-white/10 dark:hover:bg-black/30 transition-colors duration-200"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-white">{message.title}</h4>
                    <p className="text-sm text-gray-300">{message.sender}</p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">{message.date}</p>
            </div>
            <p className="text-sm text-gray-300 mt-1 truncate">{message.preview}</p>
        </button>
    );
};

const MessagesInboxModal: React.FC<MessagesInboxModalProps> = ({ isOpen, onClose, messages }) => {
    const { t } = useTranslations();
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    if (!isOpen) {
        return null;
    }

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4"
                onClick={onClose}
            >
                <div
                    className="relative w-full max-w-sm h-[70vh] bg-gradient-to-b from-brand-accent/90 via-blue-500/80 to-brand-mid-purple/90 rounded-2xl p-6 flex flex-col backdrop-blur-md border border-white/10 text-white"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={onClose} className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h2 className="text-2xl font-bold font-orbitron mb-4 text-center">{t('message')}</h2>
                    <div className="flex-grow space-y-2 overflow-y-auto hide-scrollbar pr-2 -mr-3">
                        {messages.map(msg => (
                            <MessageItem key={msg.id} message={msg} onClick={() => setSelectedMessage(msg)} />
                        ))}
                    </div>
                     <button
                        onClick={onClose}
                        className="mt-4 w-full font-bold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out bg-black/50 border border-blue-300/50 hover:bg-black/70 hover:shadow-glow text-white flex-shrink-0"
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
            <MessageDetailModal
                isOpen={!!selectedMessage}
                message={selectedMessage}
                onClose={() => setSelectedMessage(null)}
            />
        </>
    );
};

export default MessagesInboxModal;