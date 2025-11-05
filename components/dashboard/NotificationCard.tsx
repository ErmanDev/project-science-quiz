import React from 'react';

interface NotificationCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  onClick?: () => void;
  onDismiss?: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ icon, title, subtitle, description, onClick, onDismiss }) => {
  const commonClasses = "bg-gradient-to-r from-blue-500 to-brand-accent p-4 rounded-xl flex items-start space-x-4 shadow-lg w-full text-left";
  const interactiveClasses = "transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-glow focus:ring-opacity-75";

  const content = (
    <>
      <div className="text-white flex-shrink-0 pt-1">
        {icon}
      </div>
      <div className="flex-grow">
        <h3 className="font-bold text-sm text-gray-200">{title}</h3>
        <p className="font-semibold text-white">{subtitle}</p>
        <p className="text-xs text-gray-300">{description}</p>
      </div>
      {onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
          aria-label="Dismiss notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </>
  );

  const finalContainerClasses = `${commonClasses} ${onClick ? interactiveClasses : ''}`;

  if (onClick) {
    return (
      <button onClick={onClick} className={finalContainerClasses}>
        {content}
      </button>
    );
  }

  return (
    <div className={finalContainerClasses}>
      {content}
    </div>
  );
};

export default NotificationCard;
