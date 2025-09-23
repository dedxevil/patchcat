
import React, { useContext } from 'react';
import { WorkspaceContext } from '../App';
import RequestTab from './RequestTab';
import { CloseIcon, PlusIcon, SparklesIcon, CopyIcon } from './icons';

const MainPanel: React.FC = () => {
  const { state, dispatch } = useContext(WorkspaceContext)!;
  const { tabs, activeTabId } = state;

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const handleSelectTab = (tabId: string) => {
    if (tabId !== activeTabId) {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
    }
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    dispatch({ type: 'CLOSE_TAB', payload: tabId });
  };

  const handleAddTab = () => {
    dispatch({ type: 'ADD_TAB', payload: { makeActive: true } });
  };
  
  const handleDuplicateTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    dispatch({ type: 'DUPLICATE_TAB', payload: tabId });
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-bg-default min-w-0">
      {/* Tab Bar */}
      <div className="flex-shrink-0 flex items-center border-b border-border-default bg-bg-subtle">
        <div className="flex-grow flex items-center overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`relative flex items-center gap-2 pl-4 pr-14 py-2 text-sm border-r border-border-default group whitespace-nowrap ${
                activeTabId === tab.id
                  ? 'bg-bg-default text-text-default'
                  : 'text-text-muted hover:bg-bg-muted'
              }`}
            >
              <span className={`font-bold text-xs w-12 text-left ${tab.request.method === 'GET' ? 'text-success' : 'text-warning'}`}>
                  {tab.request.method}
              </span>
              <input
                type="text"
                value={tab.name}
                onChange={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'UPDATE_TAB_NAME', payload: { tabId: tab.id, name: e.target.value } });
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent focus:bg-bg-muted outline-none focus:ring-1 focus:ring-brand rounded-sm px-1 py-0.5 max-w-[150px] text-left"
                aria-label={`Edit tab name for ${tab.name}`}
              />
              {tab.request.isAiGenerated && <SparklesIcon className="w-3 h-3 text-brand flex-shrink-0" />}
              
              <div className={`absolute top-1/2 right-1.5 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 rounded-md ${activeTabId === tab.id ? 'bg-bg-default' : 'bg-bg-muted'}`}>
                <button
                    onClick={(e) => handleDuplicateTab(e, tab.id)}
                    className="p-1 rounded-full hover:bg-border-default"
                    aria-label={`Duplicate tab ${tab.name}`}
                >
                    <CopyIcon className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className="p-1 rounded-full hover:bg-border-default"
                    aria-label={`Close tab ${tab.name}`}
                >
                    <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={handleAddTab}
          className="p-3 border-l border-border-default text-text-muted hover:bg-bg-muted"
          aria-label="Add new tab"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-grow min-h-0">
        {activeTab ? (
          <RequestTab key={activeTab.id} tab={activeTab} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-text-muted p-4">
              <SparklesIcon className="w-12 h-12 mb-4" />
              <h2 className="text-lg font-semibold">Welcome to Patchcat</h2>
              <p>Create a new tab with the '+' button to start making API requests.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainPanel;
