

import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'right': return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'left': return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'bottom': return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'top':
      default: return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  }
  return (
    <div className="relative flex items-center tooltip-container">
      {children}
      <div className={`absolute z-10 ${getPositionClasses()} px-2 py-1 bg-bg-muted text-text-default text-xs rounded-md shadow-lg whitespace-nowrap tooltip-text`}>
        {text}
      </div>
    </div>
  );
};

export default Tooltip;