
import React, { useContext, useState } from 'react';
import { WorkspaceContext } from '../App';
import { HistoryIcon, SettingsIcon, TrashIcon, PatchcatLogo, PatchcatLogoIconOnly, CloseIcon, CheckCircleIcon, XCircleIcon, SearchIcon } from './icons';
import Tooltip from './Tooltip';
import { ApiRequest, HttpMethod, Protocol } from '../types';
import { getProtocolDisplayDetails } from '../constants';

interface LeftSidebarProps {
  onOpenSettings: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ onOpenSettings, isOpen, setIsOpen }) => {
  const { state, dispatch } = useContext(WorkspaceContext)!;
  const { history } = state;
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectHistory = (request: ApiRequest) => {
    dispatch({ type: 'ADD_TAB', payload: { request } });
    if (window.innerWidth < 768) {
        setIsOpen(false); // Close sidebar on mobile after selection
    }
  };
  
  const handleDeleteHistory = (e: React.MouseEvent, requestId: string) => {
      e.stopPropagation();
      dispatch({ type: 'REMOVE_HISTORY', payload: requestId });
  };
  
  const handleClearHistory = () => {
      if(window.confirm('Are you sure you want to clear all history?')) {
          dispatch({ type: 'CLEAR_HISTORY' });
          setSearchTerm('');
      }
  }
  
  const filteredHistory = history.filter(req => {
    const term = searchTerm.toLowerCase();
    return (
        req.name.toLowerCase().includes(term) ||
        req.url.toLowerCase().includes(term) ||
        req.method.toLowerCase().includes(term) ||
        req.protocol.toLowerCase().includes(term)
    );
  });


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
        {isOpen ? (
            <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Tooltip text="Request History" position="right">
                        <HistoryIcon />
                      </Tooltip>
                      History
                    </h2>
                    {history.length > 0 && (
                        <Tooltip text="Clear all history" position="right">
                            <button onClick={handleClearHistory} className="text-text-muted hover:text-danger p-1">
                                <TrashIcon />
                            </button>
                        </Tooltip>
                    )}
                </div>
                {history.length > 0 && (
                  <div className="relative mb-2">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-default border border-border-default rounded-md pl-8 pr-2 py-1 text-sm focus:ring-1 focus:ring-brand focus:outline-none"
                    />
                  </div>
                )}
                {history.length === 0 ? (
                    <p className="text-xs text-text-muted p-2 text-center">Your request history will appear here.</p>
                ) : filteredHistory.length === 0 ? (
                    <p className="text-xs text-text-muted p-2 text-center">No results found for "{searchTerm}".</p>
                ) : (
                    <ul className="space-y-1">
                    {filteredHistory.map(req => {
                        const protocolDetails = getProtocolDisplayDetails(req.protocol, req.method);
                        return (
                            <li
                                key={req.id}
                                onClick={() => handleSelectHistory(req)}
                                className="group flex justify-between items-center p-2 rounded-md cursor-pointer hover:bg-bg-muted"
                            >
                                <div className="flex-grow truncate flex items-start gap-2">
                                    <span className={`font-bold text-xs w-10 text-center flex-shrink-0 pt-0.5 ${protocolDetails.className}`}>
                                        {protocolDetails.text}
                                    </span>
                                    <div className="flex-grow truncate">
                                        <p className="text-xs text-text-default truncate">{req.name}</p>
                                        {req.protocol === Protocol.GraphQL && req.operationName && (
                                            <p className="text-[11px] text-text-subtle truncate">{req.operationName}</p>
                                        )}
                                    </div>
                                </div>
                                <button onClick={(e) => handleDeleteHistory(e, req.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger p-1 flex-shrink-0">
                                    <TrashIcon />
                                </button>
                            </li>
                        )
                    })}
                    </ul>
                )}
            </div>
        ) : (
             <div className="flex flex-col items-center py-3">
                {history.length > 0 && (
                     <Tooltip text="History" position="right">
                         <HistoryIcon className="mb-2" />
                     </Tooltip>
                )}
                <ul className="space-y-1">
                    {history.map(req => {
                        const protocolDetails = getProtocolDisplayDetails(req.protocol, req.method);
                        return (
                            <li key={req.id} onClick={() => handleSelectHistory(req)} className="rounded-md cursor-pointer hover:bg-bg-muted">
                                <Tooltip text={`${req.name} (${req.status ?? 'N/A'})`} position="right">
                                    <div className="flex items-center justify-center gap-2 p-2 w-full">
                                        <span className={`font-bold text-xs w-10 text-center ${protocolDetails.className}`}>{protocolDetails.text}</span>
                                        {typeof req.status === 'number' ? (
                                            (req.status >= 200 && req.status < 400)
                                                ? <CheckCircleIcon className="w-4 h-4 text-success" />
                                                : <XCircleIcon className="w-4 h-4 text-danger" />
                                        ) : <div className="w-4 h-4"></div>}
                                    </div>
                                </Tooltip>
                            </li>
                        )
                    })}
                </ul>
            </div>
        )}
      </div>
      <div className="p-3 border-t border-border-default">
        <Tooltip text="Settings" position="right">
          <button onClick={onOpenSettings} className={`w-full flex items-center gap-2 p-2 rounded-md hover:bg-bg-muted ${!isOpen && 'justify-center'}`}>
            <SettingsIcon /> {isOpen && 'Settings'}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default LeftSidebar;