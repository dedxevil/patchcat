
import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="relative flex items-center tooltip-container">
      {children}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-bg-muted text-text-default text-xs rounded-md shadow-lg whitespace-nowrap tooltip-text">
        {text}
      </div>
    </div>
  );
};

export default Tooltip;
