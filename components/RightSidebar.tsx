// FIX: Create RightSidebar component to display AI messages and suggestions.
import React, { useContext, useEffect, useRef } from 'react';
import { WorkspaceContext } from '../App';
import { SparklesIcon } from './icons';
import { AiSuggestion, ApiRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Tooltip from './Tooltip';

interface RightSidebarProps {
  isOpen: boolean;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ isOpen }) => {
  const { state, dispatch } = useContext(WorkspaceContext)!;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.aiMessages]);

  const handleSuggestionClick = (suggestion: AiSuggestion) => {
    const { body, ...restOfApiRequest } = suggestion.apiRequest;
    const newRequest: Partial<ApiRequest> = {
      ...restOfApiRequest,
      id: uuidv4(),
      isAiGenerated: true,
      body: { type: 'raw', content: (body as any)?.content || (body as any) || '' },
    };
    dispatch({ type: 'ADD_TAB', payload: { request: newRequest } });
  };

  const handleBulkTest = (suggestions: AiSuggestion[]) => {
      suggestions.forEach(suggestion => {
          const { body, ...restOfApiRequest } = suggestion.apiRequest;
          const newRequest: Partial<ApiRequest> = {
              ...restOfApiRequest,
              id: uuidv4(),
              isAiGenerated: true,
              body: { type: 'raw', content: (body as any)?.content || (body as any) || '' },
          };
          dispatch({ type: 'ADD_TAB', payload: { request: newRequest } });
      });
  }

  const activeTab = state.tabs.find(t => t.id === state.activeTabId);

  return (
    <div className={`h-full flex flex-col bg-bg-subtle text-sm transition-all duration-300 ease-in-out ${isOpen ? 'p-3' : 'p-0 items-center justify-center'}`}>
      <div className={`flex items-center gap-2 h-[52px] flex-shrink-0 ${isOpen ? 'justify-start' : 'justify-center'}`}>
        <SparklesIcon className="text-brand" />
        {isOpen && <h2 className="font-semibold text-lg">AI Assistant</h2>}
      </div>
      
      {isOpen ? (
        <>
          <div className="flex-grow overflow-y-auto pr-2 space-y-4 w-full">
            {state.aiMessages.map(message => (
              <div key={message.id} className="flex flex-col gap-2">
                <div className={`p-3 rounded-lg ${
                    message.type === 'info' ? 'bg-bg-muted' :
                    message.type === 'suggestion' ? 'bg-bg-muted' :
                    message.type === 'thinking' ? 'bg-bg-muted animate-pulse' :
                    'bg-danger/20 text-danger'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button 
                          key={index} 
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs bg-brand/20 text-brand font-semibold px-2 py-1 rounded-md hover:bg-brand/30"
                        >
                          {suggestion.suggestionText}
                        </button>
                      ))}
                    </div>
                    {message.suggestions.length > 1 && (
                        <button 
                          onClick={() => handleBulkTest(message.suggestions!)}
                          className="text-xs bg-brand/30 text-brand font-bold p-2 rounded-md hover:bg-brand/40 w-full"
                        >
                          Test All ({message.suggestions.length})
                        </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {activeTab && activeTab.response && (
             <div className="pt-2 text-xs text-text-muted flex-shrink-0">
                AI analysis is based on the last response from '{activeTab.name}'.
             </div>
          )}
        </>
      ) : (
        <Tooltip text="AI Assistant">
            <SparklesIcon className="text-brand w-8 h-8" />
        </Tooltip>
      )}
    </div>
  );
};

export default RightSidebar;