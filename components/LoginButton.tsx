
import React from 'react';

interface LoginButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const LoginButton: React.FC<LoginButtonProps> = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full bg-brand-accent text-white font-semibold py-3 px-4 rounded-lg
                 transition-all duration-300 ease-in-out
                 hover:bg-opacity-90 hover:shadow-glow
                 focus:outline-none focus:ring-2 focus:ring-brand-glow focus:ring-opacity-75"
    >
      {children}
    </button>
  );
};

export default LoginButton;
