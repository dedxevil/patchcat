import React, { useState, useContext } from 'react';
import LeftSidebar from './LeftSidebar';
import MainPanel from './MainPanel';
import RightSidebar from './RightSidebar';
import SettingsModal from './SettingsModal';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { WorkspaceContext } from '../App';

const Layout: React.FC = () => {
  const { state } = useContext(WorkspaceContext)!;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  const rightSidebarWidth = !state.settings.aiEnabled
    ? 'w-0'
    : rightSidebarOpen
    ? 'w-80'
    : 'w-20';

  return (
    <div className="h-screen w-screen bg-bg-default text-text-default flex">
      {/* Left Sidebar Wrapper */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ease-in-out ${
          leftSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <LeftSidebar 
            isOpen={leftSidebarOpen} 
            onOpenSettings={() => setIsSettingsOpen(true)} 
        />
      </div>

      {/* Main Panel */}
      <div className="relative flex-grow flex flex-col min-w-0 border-l border-r border-border-default">
        {/* Left Sidebar Toggle Button */}
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="absolute top-1/2 -left-[13px] transform -translate-y-1/2 z-20 p-1 rounded-full bg-bg-muted hover:bg-border-default border-2 border-border-default"
          aria-label={leftSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {leftSidebarOpen ? <ChevronLeftIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
        </button>

        <MainPanel />
        
        {/* Right Sidebar Toggle Button */}
        {state.settings.aiEnabled && (
             <button
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                className="absolute top-1/2 -right-[13px] transform -translate-y-1/2 z-20 p-1 rounded-full bg-bg-muted hover:bg-border-default border-2 border-border-default"
                aria-label={rightSidebarOpen ? 'Collapse AI assistant' : 'Expand AI assistant'}
             >
                {rightSidebarOpen ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
            </button>
        )}
      </div>

      {/* Right Sidebar Wrapper */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ease-in-out ${rightSidebarWidth}`}
      >
        {state.settings.aiEnabled && <RightSidebar isOpen={rightSidebarOpen} />}
      </div>
      
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
};

export default Layout;