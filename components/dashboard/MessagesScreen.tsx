import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { Conversation, ChatMessage } from '../../App';
import { ProfileData } from './StudentDashboard';
import { TeacherProfileData } from '../teacher/EditTeacherProfileModal';
import { GenericListAvatar } from '../icons';
import { ClassData } from '../teacher/ClassroomScreen';
import AnnouncementModal from '../teacher/AnnouncementModal';

// --- HELPER ICONS ---

const BackIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

const NewChatIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const SendIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

const AnnouncementIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.136A1.76 1.76 0 015.882 11H12m0 0a1.76 1.76 0 001.76-1.76V5.882a1.76 1.76 0 00-3.52 0v4.356a1.76 1.76 0 001.76 1.76z" />
    </svg>
);

// --- SUB-COMPONENTS ---

const ChatScreen: React.FC<{
    conversation: Conversation;
    currentUser: { name: string };
    onSendMessage: (text: string) => void;
    onBack: () => void;
    userRole: 'student' | 'teacher';
}> = ({ conversation, currentUser, onSendMessage, onBack, userRole }) => {
    const [newMessage, setNewMessage] = useState('');
    const otherParticipant = conversation.participantNames.find(p => p !== currentUser.name) || 'Chat';
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isAnnouncement = !!conversation.title;


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation.messages]);

    const handleSend = () => {
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };
    
    const formatTime = (date: Date) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);

    return (
        <div className="p-4 h-full flex flex-col bg-brand-deep-purple text-white">
            <header className="flex items-center space-x-4 mb-4 flex-shrink-0">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-brand-light-purple/50">
                    <BackIcon />
                </button>
                <h2 className="text-xl font-bold font-orbitron">{conversation.title || otherParticipant}</h2>
            </header>
            <div className="flex-grow overflow-y-auto pr-1 space-y-4 hide-scrollbar">
                {conversation.messages.map((msg, index) => {
                    const isMe = msg.senderName === currentUser.name;
                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {(!isMe && isAnnouncement) && <div className="text-xs text-gray-400 ml-2 mb-1">{msg.senderName}</div>}
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isMe ? 'bg-blue-600 rounded-br-none' : 'bg-brand-mid-purple rounded-bl-none'}`}>
                                <p>{msg.text}</p>
                            </div>
                            <span className="text-xs text-gray-400 mt-1 px-1">{formatTime(msg.timestamp)}</span>
                        </div>
                    );
                })}
                 <div ref={messagesEndRef} />
            </div>
            <footer className="flex-shrink-0 pt-4 flex items-center space-x-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-grow bg-brand-mid-purple border border-brand-light-purple/50 rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-glow"
                />
                <button onClick={handleSend} className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-colors disabled:bg-gray-500" disabled={!newMessage.trim()}>
                    <SendIcon />
                </button>
            </footer>
        </div>
    );
};

const ChatListScreen: React.FC<{
    conversations: Conversation[];
    currentUser: { name: string };
    onSelectConversation: (conversationId: string) => void;
    onNewChat: () => void;
    onNewAnnouncement?: () => void;
    userRole: 'student' | 'teacher';
    onBack?: () => void;
}> = ({ conversations, currentUser, onSelectConversation, onNewChat, onBack, onNewAnnouncement, userRole }) => {
    const { t } = useTranslations();

    return (
        <div className="p-4 h-full flex flex-col">
            <header className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center space-x-4">
                    {onBack && (
                        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-brand-light-purple/50">
                            <BackIcon />
                        </button>
                    )}
                    <h2 className="text-2xl font-bold font-orbitron">{t('chat')}</h2>
                </div>
                <div className="flex items-center space-x-2">
                    {userRole === 'teacher' && onNewAnnouncement && (
                        <button onClick={onNewAnnouncement} title="New Announcement" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-brand-light-purple/50">
                            <AnnouncementIcon />
                        </button>
                    )}
                    <button onClick={onNewChat} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-brand-light-purple/50">
                        <NewChatIcon />
                    </button>
                </div>
            </header>
            <div className="space-y-2 overflow-y-auto flex-grow pr-1 hide-scrollbar">
                {conversations.map(convo => {
                    const otherParticipant = convo.title || convo.participantNames.find(p => p !== currentUser.name) || 'User';
                    const lastMessage = convo.messages[convo.messages.length - 1];
                    const preview = lastMessage ? `${lastMessage.senderName === currentUser.name ? 'You: ' : ''}${lastMessage.text}` : 'No messages yet';

                    return (
                        <button key={convo.id} onClick={() => onSelectConversation(convo.id)} className="w-full text-left p-3 bg-white dark:bg-brand-mid-purple/80 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-brand-mid-purple transition-colors duration-200 flex items-center space-x-3">
                            <GenericListAvatar />
                            <div className="flex-grow overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold truncate">{otherParticipant}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">{lastMessage && new Date(lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-300 truncate">{preview}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};


const NewChatScreen: React.FC<{
    contacts: { name: string }[];
    onStartChat: (contactName: string) => void;
    onBack: () => void;
}> = ({ contacts, onStartChat, onBack }) => {
    return (
         <div className="p-4 h-full flex flex-col">
            <header className="flex items-center space-x-4 mb-4 flex-shrink-0">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-brand-light-purple/50">
                    <BackIcon />
                </button>
                <h2 className="text-2xl font-bold font-orbitron">New Chat</h2>
            </header>
             <div className="space-y-2 overflow-y-auto flex-grow hide-scrollbar pr-1">
                 {contacts.map(contact => (
                    <button key={contact.name} onClick={() => onStartChat(contact.name)} className="w-full text-left p-3 bg-white dark:bg-brand-mid-purple/80 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-brand-mid-purple transition-colors duration-200 flex items-center space-x-3">
                        <GenericListAvatar />
                        <h4 className="font-bold">{contact.name}</h4>
                    </button>
                 ))}
             </div>
        </div>
    );
};


// --- MAIN ORCHESTRATOR COMPONENT ---

interface ChatHubProps {
  userRole: 'student' | 'teacher';
  currentUser: ProfileData | TeacherProfileData;
  conversations: Conversation[];
  contacts: { name: string }[];
  onSendMessage: (participant1: string, participant2: string, newMessage: Omit<ChatMessage, 'id'>) => void;
  onSendMessageToConversation: (conversationId: string, newMessage: Omit<ChatMessage, 'id'>) => void;
  onBack?: () => void;
  onSendAnnouncement?: (message: string, classIds: string[]) => void;
  classes?: ClassData[];
}

const createConversationId = (name1: string, name2: string) => {
    return [name1, name2].sort().join('-');
};

const ChatHubScreen: React.FC<ChatHubProps> = ({ userRole, currentUser, conversations, contacts, onSendMessage, onSendMessageToConversation, onBack, onSendAnnouncement, classes }) => {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'chat' | 'new'>('list');
    const [isAnnounceModalOpen, setAnnounceModalOpen] = useState(false);

    const handleSelectConversation = (conversationId: string) => {
        setActiveConversationId(conversationId);
        setView('chat');
    };

    const handleSendMessageInChat = (text: string) => {
        const conversation = conversations.find(c => c.id === activeConversationId);
        if (conversation) {
            const newMessage: Omit<ChatMessage, 'id'> = { senderName: currentUser.name, text, timestamp: new Date() };
            if (conversation.title) { // This is a group chat.
                onSendMessageToConversation(conversation.id, newMessage);
            } else { // This is a P2P chat.
                const participant2 = conversation.participantNames.find(p => p !== currentUser.name);
                if (participant2) {
                    onSendMessage(currentUser.name, participant2, newMessage);
                }
            }
        }
    };
    
    const handleStartChat = (contactName: string) => {
        const conversationId = createConversationId(currentUser.name, contactName);
        setActiveConversationId(conversationId);
        setView('chat');
        // If it's a new chat with no messages, it will be created on the first send.
    };

    const handleAnnounce = (message: string) => {
        if (onSendAnnouncement && classes) {
            const allClassIds = classes.map(c => c.id);
            onSendAnnouncement(message, allClassIds);
        }
        setAnnounceModalOpen(false);
    };

    if (view === 'chat' && activeConversationId) {
        let conversation = conversations.find(c => c.id === activeConversationId);
        if (!conversation) {
             const otherParticipantName = activeConversationId.replace(currentUser.name, '').replace('-', '');
             conversation = {
                 id: activeConversationId,
                 participantNames: [currentUser.name, otherParticipantName],
                 messages: []
             }
        }
        return <ChatScreen conversation={conversation} currentUser={currentUser} onSendMessage={handleSendMessageInChat} onBack={() => setView('list')} userRole={userRole} />;
    }

    if (view === 'new') {
        return <NewChatScreen contacts={contacts} onStartChat={handleStartChat} onBack={() => setView('list')} />;
    }

    return (
        <>
            <ChatListScreen
                conversations={conversations}
                currentUser={currentUser}
                onSelectConversation={handleSelectConversation}
                onNewChat={() => setView('new')}
                onNewAnnouncement={userRole === 'teacher' ? () => setAnnounceModalOpen(true) : undefined}
                userRole={userRole}
                onBack={onBack}
            />
            {userRole === 'teacher' && (
                <AnnouncementModal
                    isOpen={isAnnounceModalOpen}
                    onClose={() => setAnnounceModalOpen(false)}
                    onAnnounce={handleAnnounce}
                />
            )}
        </>
    );
};

export default ChatHubScreen;