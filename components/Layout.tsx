import React, { useState, useContext, useEffect } from 'react';
import LeftSidebar from './LeftSidebar';
import MainPanel from './MainPanel';
import RightSidebar from './RightSidebar';
import SettingsModal from './SettingsModal';
import { ChevronLeftIcon, ChevronRightIcon, MenuIcon, SparklesIcon } from './icons';
import { WorkspaceContext } from '../App';
import { PatchcatLogo } from './icons';

const MobileHeader: React.FC<{ onToggleLeft: () => void; onToggleRight: () => void; aiEnabled: boolean }> = ({ onToggleLeft, onToggleRight, aiEnabled }) => (
    <div className="md:hidden flex items-center justify-between p-2 h-[61px] bg-bg-subtle border-b border-border-default flex-shrink-0">
        <button onClick={onToggleLeft} className="p-2 text-text-muted hover:text-text-default">
            <MenuIcon className="w-6 h-6" />
        </button>
        <PatchcatLogo />
        {aiEnabled ? (
            <button onClick={onToggleRight} className="p-2 text-brand hover:opacity-80">
                <SparklesIcon className="w-6 h-6" />
            </button>
        ) : <div className="w-10"></div>}
    </div>
);


const Layout: React.FC = () => {
  const { state } = useContext(WorkspaceContext)!;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
        const desktop = window.innerWidth >= 768;
        setIsDesktop(desktop);
        // Default sidebar states for desktop
        if (desktop) {
            setLeftSidebarOpen(true);
            setRightSidebarOpen(true);
        } else {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(false);
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const rightSidebarWidth = !state.settings.aiEnabled
    ? 'md:w-0'
    : rightSidebarOpen
    ? 'md:w-80'
    : 'md:w-20';

  const isOverlayVisible = !isDesktop && (leftSidebarOpen || rightSidebarOpen);

  return (
    <div className="h-screen w-screen bg-bg-default text-text-default flex flex-col md:flex-row overflow-hidden">
        {isOverlayVisible && (
            <div 
                className="fixed inset-0 bg-black/60 z-30"
                onClick={() => {
                    setLeftSidebarOpen(false);
                    setRightSidebarOpen(false);
                }}
            />
        )}
      {/* Left Sidebar Wrapper */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ease-in-out bg-bg-subtle
            fixed md:relative inset-y-0 left-0 z-40 transform
            ${leftSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-20 md:translate-x-0'}`
        }
      >
        <LeftSidebar 
            isOpen={leftSidebarOpen} 
            setIsOpen={setLeftSidebarOpen}
            onOpenSettings={() => setIsSettingsOpen(true)} 
        />
      </div>

      {/* Main Content Area */}
      <div className="relative flex-grow flex flex-col min-w-0 md:border-l md:border-r border-border-default overflow-hidden">
        <MobileHeader 
            onToggleLeft={() => setLeftSidebarOpen(!leftSidebarOpen)} 
            onToggleRight={() => setRightSidebarOpen(!rightSidebarOpen)}
            aiEnabled={state.settings.aiEnabled}
        />
        
        {/* Left Sidebar Toggle Button - Desktop */}
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="absolute top-1/2 -left-[13px] transform -translate-y-1/2 z-20 p-1 rounded-full bg-bg-muted hover:bg-border-default border-2 border-border-default hidden md:block"
          aria-label={leftSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {leftSidebarOpen ? <ChevronLeftIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
        </button>

        <MainPanel />
        
        {/* Right Sidebar Toggle Button - Desktop */}
        {state.settings.aiEnabled && (
             <button
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                className="absolute top-1/2 -right-[13px] transform -translate-y-1/2 z-20 p-1 rounded-full bg-bg-muted hover:bg-border-default border-2 border-border-default hidden md:block"
                aria-label={rightSidebarOpen ? 'Collapse AI assistant' : 'Expand AI assistant'}
             >
                {rightSidebarOpen ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
            </button>
        )}
      </div>

      {/* Right Sidebar Wrapper */}
        {state.settings.aiEnabled && (
            <div
                className={`flex-shrink-0 transition-all duration-300 ease-in-out bg-bg-subtle
                    fixed md:relative inset-y-0 right-0 z-40 transform
                    ${rightSidebarOpen ? 'translate-x-0 w-80' : 'translate-x-full w-80 md:w-20 md:translate-x-0'}`
                }
            >
                <RightSidebar isOpen={rightSidebarOpen} setIsOpen={setRightSidebarOpen} />
            </div>
        )}
      
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
};

export default Layout;