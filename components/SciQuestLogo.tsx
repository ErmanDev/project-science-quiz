
import React from 'react';

interface SciQuestLogoProps {
  onLogoClick?: () => void;
}

const SciQuestLogo: React.FC<SciQuestLogoProps> = ({ onLogoClick }) => {
  return (
    <div className="flex flex-col items-center">
      <div 
        className={`w-20 h-20 mb-4 ${onLogoClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={onLogoClick}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="flaskGradient" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop stopColor="#82aaff"/>
              <stop offset="1" stopColor="#c792ea"/>
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#glow)">
            <path d="M63 90H37C35.3431 90 34 88.6569 34 87V65H30C27.7909 65 26 63.2091 26 61V35C26 32.7909 27.7909 31 30 31H44V15C44 12.7909 45.7909 11 48 11H52C54.2091 11 56 12.7909 56 15V31H70C72.2091 31 74 32.7909 74 35V61C74 63.2091 72.2091 65 70 65H66V87C66 88.6569 64.6569 90 63 90Z" stroke="url(#flaskGradient)" strokeWidth="3"/>
          </g>
          <circle cx="42" cy="78" r="3" fill="#f78dff"/>
          <circle cx="58" cy="75" r="4" fill="#a799ff"/>
          <circle cx="50" cy="82" r="2.5" fill="#82aaff"/>
          <path d="M35 65C40.6667 60.6667 59 59.5 65 65" stroke="#c792ea" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <h1 className="font-orbitron text-5xl font-bold tracking-wider" style={{ textShadow: '0 0 8px #a799ff, 0 0 12px #a799ff, 0 0 20px #6c47ff' }}>
        SciQuest
      </h1>
    </div>
  );
};

export default SciQuestLogo;
