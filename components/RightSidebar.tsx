// FIX: Create RightSidebar component to display AI messages and suggestions.
import React, { useContext, useEffect, useRef, useState } from 'react';
import { WorkspaceContext } from '../App';
import { CloseIcon, SendIcon, SparklesIcon } from './icons';
import { AiMessage, AiSuggestion, ApiRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Tooltip from './Tooltip';
import { getAiChatResponse } from '../services/geminiService';

interface RightSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ isOpen, setIsOpen }) => {
  const { state, dispatch } = useContext(WorkspaceContext)!;
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isThinking = state.aiMessages.some(m => m.type === 'thinking');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.aiMessages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto'; // Reset height
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.min(scrollHeight, 128)}px`; // Set height with a max
    }
  }, [userInput]);

  const handleSuggestionClick = (suggestion: AiSuggestion) => {
    const { body, ...restOfApiRequest } = suggestion.apiRequest;
    const newRequest: Partial<ApiRequest> = {
      ...restOfApiRequest,
      id: uuidv4(),
      isAiGenerated: true,
      body: { type: 'raw', content: (body as any)?.content || (body as any) || '' },
    };
    dispatch({ type: 'ADD_TAB', payload: { request: newRequest } });
    if (window.innerWidth < 768) setIsOpen(false);
  };

  const handleBulkTest = (suggestions: AiSuggestion[]) => {
      suggestions.forEach((suggestion, index) => {
          const { body, ...restOfApiRequest } = suggestion.apiRequest;
          const newRequest: Partial<ApiRequest> = {
              ...restOfApiRequest,
              id: uuidv4(),
              isAiGenerated: true,
              body: { type: 'raw', content: (body as any)?.content || (body as any) || '' },
          };
          // only make the first tab active
          dispatch({ type: 'ADD_TAB', payload: { request: newRequest, makeActive: index === 0 } });
      });
      if (window.innerWidth < 768) setIsOpen(false);
  }

  const handleSendMessage = async () => {
    if (!userInput.trim() || isThinking || !state.settings.geminiApiKey) return;

    const userMessage: AiMessage = { id: uuidv4(), type: 'user', content: userInput.trim() };
    dispatch({ type: 'ADD_AI_MESSAGE', payload: userMessage });
    setUserInput('');

    const thinkingMessage: AiMessage = { id: uuidv4(), type: 'thinking', content: 'Thinking...' };
    dispatch({ type: 'ADD_AI_MESSAGE', payload: thinkingMessage });

    try {
        const responseText = await getAiChatResponse(userMessage.content, state.settings.geminiApiKey);
        if (responseText) {
            const aiResponse: AiMessage = { id: uuidv4(), type: 'info', content: responseText };
            dispatch({ type: 'ADD_AI_MESSAGE', payload: aiResponse });
        } else {
            const errorMessage: AiMessage = { id: uuidv4(), type: 'error', content: "I received an empty response. Please try again." };
            dispatch({ type: 'ADD_AI_MESSAGE', payload: errorMessage });
        }
    } catch (error) {
        console.error("Error getting AI response:", error);
        const errorMessage: AiMessage = { id: uuidv4(), type: 'error', content: `Sorry, I encountered an error. ${error instanceof Error ? error.message : ''}` };
        dispatch({ type: 'ADD_AI_MESSAGE', payload: errorMessage });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };


  const activeTab = state.tabs.find(t => t.id === state.activeTabId);
  const isAiKeyMissing = state.settings.aiEnabled && !state.settings.geminiApiKey;

  return (
    <div className={`h-full flex flex-col bg-bg-subtle text-sm transition-all duration-300 ease-in-out ${isOpen ? '' : 'p-0 items-center justify-center'}`}>
      <div className={`flex items-center justify-between gap-2 h-[61px] flex-shrink-0 md:relative top-0 left-0 right-0 p-3 border-b border-border-default md:border-b-0 ${isOpen ? 'justify-between' : 'justify-center'}`}>
        <div className={`flex items-center gap-2 ${!isOpen && 'hidden'}`}>
          <SparklesIcon className="text-brand" />
          <h2 className="font-semibold text-lg">AI Assistant</h2>
        </div>
        <div className={`${isOpen ? 'hidden' : 'block'}`}>
            <Tooltip text="AI Assistant">
                <SparklesIcon className="text-brand w-8 h-8" />
            </Tooltip>
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-text-muted hover:text-text-default">
            <CloseIcon />
        </button>
      </div>
      
      {isOpen ? (
        <>
          <div className="flex-grow overflow-y-auto p-3 space-y-4 w-full">
            {isAiKeyMissing && (
                <div className="p-3 rounded-lg bg-warning/20 text-warning">
                    <p className="font-semibold">Gemini API Key Required</p>
                    <p>Please add your Google Gemini API key in the Settings panel to enable AI assistance.</p>
                </div>
            )}
            {state.aiMessages.map(message => (
              <div key={message.id} className={`flex flex-col gap-2 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-full p-3 rounded-lg ${
                    message.type === 'info' ? 'bg-bg-muted' :
                    message.type === 'user' ? 'bg-brand/20' :
                    message.type === 'suggestion' ? 'bg-bg-muted' :
                    message.type === 'thinking' ? 'bg-bg-muted animate-pulse' :
                    'bg-danger/20 text-danger'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
          <div className="p-3 border-t border-border-default flex-shrink-0">
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isAiKeyMissing ? "Add your API key in settings" : "Ask the assistant..."}
                    rows={1}
                    disabled={isAiKeyMissing || isThinking}
                    className="w-full bg-bg-default border border-border-default rounded-md p-2 pr-10 resize-none focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
                    aria-label="Chat with AI assistant"
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || isThinking || isAiKeyMissing}
                    className="absolute right-2 bottom-2 p-1.5 text-text-muted rounded-md hover:bg-bg-muted disabled:opacity-50 disabled:hover:bg-transparent"
                    aria-label="Send message"
                >
                    <SendIcon className="w-4 h-4" />
                </button>
            </div>
             {activeTab && activeTab.response && (
                 <div className="pt-2 text-xs text-text-muted flex-shrink-0 text-center">
                    AI has context of the response from '{activeTab.name}'.
                 </div>
              )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default RightSidebar;