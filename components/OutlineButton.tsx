
import React from 'react';

interface OutlineButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const OutlineButton: React.FC<OutlineButtonProps> = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-transparent border border-brand-glow text-white font-semibold py-3 px-4 rounded-lg
                 transition-all duration-300 ease-in-out
                 hover:bg-brand-glow/10 hover:shadow-glow
                 focus:outline-none focus:ring-2 focus:ring-brand-glow focus:ring-opacity-75"
    >
      {children}
    </button>
  );
};

export default OutlineButton;
