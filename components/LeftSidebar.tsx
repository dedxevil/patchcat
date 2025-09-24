import React, { useContext } from 'react';
import { WorkspaceContext } from '../App';
import { HistoryIcon, SettingsIcon, TrashIcon, PatchcatLogo, PatchcatLogoIconOnly, CloseIcon } from './icons';
import Tooltip from './Tooltip';
import { ApiRequest } from '../types';
import { getMethodColorClass } from '../constants';

interface LeftSidebarProps {
  onOpenSettings: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ onOpenSettings, isOpen, setIsOpen }) => {
  const { state, dispatch } = useContext(WorkspaceContext)!;
  const { history } = state;

  const handleSelectHistory = (request: ApiRequest) => {
    dispatch({ type: 'ADD_TAB', payload: { request } });
    setIsOpen(false); // Close sidebar on mobile after selection
  };
  
  const handleDeleteHistory = (e: React.MouseEvent, requestId: string) => {
      e.stopPropagation();
      dispatch({ type: 'REMOVE_HISTORY', payload: requestId });
  };
  
  const handleClearHistory = () => {
      if(window.confirm('Are you sure you want to clear all history?')) {
          dispatch({ type: 'CLEAR_HISTORY' });
      }
  }

  return (
    <div className="h-full flex flex-col bg-bg-subtle text-sm pt-[61px] md:pt-0">
      <div className={`p-3 h-[61px] flex items-center border-b border-border-default absolute top-0 left-0 right-0 md:relative md:border-b-0 ${isOpen ? 'justify-between' : 'justify-center'}`}>
        <div className={`flex items-center ${!isOpen && 'hidden'}`}>
          <PatchcatLogo />
        </div>
        <div className={`${isOpen ? 'hidden' : 'block'}`}>
            <PatchcatLogoIconOnly />
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-text-muted hover:text-text-default">
            <CloseIcon />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        {isOpen && (
            <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-semibold flex items-center gap-2">
                    <HistoryIcon /> History
                    </h2>
                    {history.length > 0 && (
                        <Tooltip text="Clear all history">
                            <button onClick={handleClearHistory} className="text-text-muted hover:text-danger p-1">
                                <TrashIcon />
                            </button>
                        </Tooltip>
                    )}
                </div>
            
                {history.length === 0 ? (
                    <p className="text-xs text-text-muted p-2">Your request history will appear here.</p>
                ) : (
                    <ul className="space-y-1">
                    {history.map(req => (
                        <li
                        key={req.id}
                        onClick={() => handleSelectHistory(req)}
                        className="group flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-bg-muted"
                        >
                        <div className="flex-grow truncate">
                            <span className={`font-bold text-xs ${getMethodColorClass(req.method)}`}>{req.method}</span>
                            <p className="text-xs text-text-default truncate">{req.name}</p>
                        </div>
                        <button onClick={(e) => handleDeleteHistory(e, req.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger p-1 flex-shrink-0">
                            <TrashIcon />
                        </button>
                        </li>
                    ))}
                    </ul>
                )}
            </div>
        )}
      </div>
      <div className="p-3 border-t border-border-default">
        <Tooltip text="Settings">
          <button onClick={onOpenSettings} className={`w-full flex items-center gap-2 p-2 rounded-md hover:bg-bg-muted ${!isOpen && 'justify-center'}`}>
            <SettingsIcon /> {isOpen && 'Settings'}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default LeftSidebar;
