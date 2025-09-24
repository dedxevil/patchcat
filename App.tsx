import React, { createContext, useReducer, useEffect, useState } from 'react';
import { Workspace, TabData, ApiRequest, ApiResponse, Settings, AiMessage, Theme, AppFont, Protocol, HttpMethod, WebSocketMessage, WsStatus } from './types';
import { getInitialWorkspace, THEME_CLASSES, APP_FONTS } from './constants';
import Layout from './components/Layout';
import { useLocalStorage } from './hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';
import StartupLoader from './components/StartupLoader';

// --- Reducer Actions ---
type Action =
  | { type: 'ADD_TAB'; payload: { protocol?: Protocol, request?: Partial<ApiRequest>; makeActive?: boolean } }
  | { type: 'CLOSE_TAB'; payload: string }
  | { type: 'DUPLICATE_TAB'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'UPDATE_TAB_NAME'; payload: { tabId: string; name: string } }
  | { type: 'UPDATE_REQUEST'; payload: { tabId: string; request: Partial<ApiRequest> } }
  | { type: 'SET_RESPONSE'; payload: { tabId: string; response: ApiResponse } }
  | { type: 'SET_LOADING'; payload: { tabId: string; isLoading: boolean } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'ADD_HISTORY'; payload: ApiRequest }
  | { type: 'REMOVE_HISTORY'; payload: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'ADD_AI_MESSAGE'; payload: AiMessage }
  | { type: 'LOAD_WORKSPACE'; payload: Workspace }
  | { type: 'ADD_TO_ANALYSIS_CACHE'; payload: string }
  | { type: 'SET_WS_STATUS'; payload: { tabId: string; status: WsStatus } }
  | { type: 'ADD_WS_MESSAGE'; payload: { tabId: string; message: WebSocketMessage } };

// --- Reducer ---
const workspaceReducer = (state: Workspace, action: Action): Workspace => {
  switch (action.type) {
    case 'LOAD_WORKSPACE':
        return action.payload;
        
    case 'ADD_TAB': {
      const protocol = action.payload.protocol || Protocol.REST;
      const newRequestId = uuidv4();
      const newTabId = uuidv4();
      const newTab: TabData = {
        id: newTabId,
        name: action.payload.request?.name || `${protocol} Request ${state.tabs.length + 1}`,
        isLoading: false,
        request: {
          id: newRequestId,
          name: 'New Request',
          protocol,
          url: protocol === Protocol.WebSocket ? 'wss://socketsbay.com/wss/v2/1/demo/' : 'https://jsonplaceholder.typicode.com/todos/1',
          method: HttpMethod.GET,
          headers: [],
          queryParams: [],
          body: { type: 'raw', content: '' },
          auth: { type: 'inherit' },
          ...action.payload.request,
        },
        ...(protocol === Protocol.WebSocket && {
          wsStatus: 'disconnected',
          wsMessages: [],
        }),
      };
      return {
        ...state,
        tabs: [...state.tabs, newTab],
        activeTabId: action.payload.makeActive !== false ? newTab.id : state.activeTabId,
      };
    }
    
    case 'CLOSE_TAB': {
      const tabIdToClose = action.payload;
      const closingTabIndex = state.tabs.findIndex(tab => tab.id === tabIdToClose);
      const newTabs = state.tabs.filter(tab => tab.id !== tabIdToClose);
      let newActiveTabId = state.activeTabId;

      if (state.activeTabId === tabIdToClose) {
        if (newTabs.length > 0) {
          newActiveTabId = newTabs[Math.max(0, closingTabIndex - 1)].id;
        } else {
          newActiveTabId = null;
        }
      }
      
      if (newTabs.length === 0) {
          const firstTabId = uuidv4();
          const firstRequestId = uuidv4();
          newTabs.push({
              id: firstTabId,
              name: 'My First Request',
              isLoading: false,
              request: {
                  id: firstRequestId,
                  name: 'My First Request',
                  protocol: Protocol.REST,
                  url: 'https://jsonplaceholder.typicode.com/todos/1',
                  method: HttpMethod.GET,
                  headers: [],
                  queryParams: [],
                  body: { type: 'raw', content: '' },
                  auth: { type: 'inherit' },
              },
          });
          newActiveTabId = firstTabId;
      }

      return { ...state, tabs: newTabs, activeTabId: newActiveTabId };
    }

    case 'DUPLICATE_TAB': {
        const tabToDuplicate = state.tabs.find(tab => tab.id === action.payload);
        if (!tabToDuplicate) return state;

        const newTabId = uuidv4();
        // Deep copy the request to avoid reference issues
        const duplicatedRequest = JSON.parse(JSON.stringify(tabToDuplicate.request));
        duplicatedRequest.id = uuidv4();
        duplicatedRequest.name = `${tabToDuplicate.request.name} (Copy)`;
        
        const newTab: TabData = {
            ...JSON.parse(JSON.stringify(tabToDuplicate)), // Deep copy all tab properties
            id: newTabId,
            name: `${tabToDuplicate.name} (Copy)`,
            isLoading: false,
            request: duplicatedRequest,
        };
        
        const originalTabIndex = state.tabs.findIndex(tab => tab.id === action.payload);
        const newTabs = [...state.tabs];
        newTabs.splice(originalTabIndex + 1, 0, newTab); // Insert after original

        return {
            ...state,
            tabs: newTabs,
            activeTabId: newTabId,
        };
    }

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTabId: action.payload };
      
    case 'UPDATE_TAB_NAME':
        return {
            ...state,
            tabs: state.tabs.map(tab =>
                tab.id === action.payload.tabId ? { ...tab, name: action.payload.name, request: { ...tab.request, name: action.payload.name } } : tab
            )
        };

    case 'UPDATE_REQUEST': {
        return {
            ...state,
            tabs: state.tabs.map(tab => {
                if (tab.id !== action.payload.tabId) return tab;

                const newRequest = { ...tab.request, ...action.payload.request };
                const didProtocolChange = action.payload.request.protocol && action.payload.request.protocol !== tab.request.protocol;
                
                let resetState: Partial<TabData> = {};
                if (didProtocolChange) {
                    if (newRequest.protocol === Protocol.WebSocket) {
                        // FIX: Using a constant for the new name fixes a TypeScript error where 'name' was accessed on an object of type '{}'.
                        const newName = tab.name.includes('Request') ? 'WS Request' : tab.name;
                        resetState = {
                            response: undefined,
                            wsStatus: 'disconnected',
                            wsMessages: [],
                            name: newName,
                        };
                        newRequest.name = newName;
                    } else { // Switched back to REST/GraphQL
                        // FIX: Using a constant for the new name fixes a TypeScript error where 'name' was accessed on an object of type '{}'.
                        const newName = tab.name.includes('Request') ? (newRequest.protocol === Protocol.GraphQL ? 'GQL Request' : 'REST Request') : tab.name;
                        resetState = {
                            wsStatus: undefined,
                            wsMessages: undefined,
                            name: newName,
                        };
                        newRequest.name = newName;
                    }
                }

                return { ...tab, request: newRequest, ...resetState };
            }),
        };
    }

    case 'SET_RESPONSE':
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === action.payload.tabId
            ? { ...tab, response: action.payload.response, isLoading: false }
            : tab
        ),
      };

    case 'SET_LOADING':
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === action.payload.tabId ? { ...tab, isLoading: action.payload.isLoading, response: action.payload.isLoading ? undefined : tab.response } : tab
        ),
      };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'ADD_HISTORY': {
        const newHistoryEntry = { ...action.payload, id: uuidv4() };
        return { ...state, history: [newHistoryEntry, ...state.history].slice(0, 50) };
    }
    
    case 'REMOVE_HISTORY':
        return { ...state, history: state.history.filter(h => h.id !== action.payload) };

    case 'CLEAR_HISTORY':
        return { ...state, history: [] };
    
    case 'ADD_AI_MESSAGE': {
      const thinkingMessageIndex = state.aiMessages.findIndex(m => m.type === 'thinking');
      if (thinkingMessageIndex > -1) {
        // Replace thinking message with the new message
        const newMessages = [...state.aiMessages];
        newMessages.splice(thinkingMessageIndex, 1, action.payload);
        return { ...state, aiMessages: newMessages };
      }
      return { ...state, aiMessages: [...state.aiMessages, action.payload].slice(-20) };
    }
    
    case 'ADD_TO_ANALYSIS_CACHE':
        return { ...state, analyzedRequestsCache: [...state.analyzedRequestsCache, action.payload].slice(-50) };
    
    case 'SET_WS_STATUS':
        return {
            ...state,
            tabs: state.tabs.map(tab =>
                tab.id === action.payload.tabId ? { ...tab, wsStatus: action.payload.status } : tab
            ),
        };
    
    case 'ADD_WS_MESSAGE':
        return {
            ...state,
            tabs: state.tabs.map(tab =>
                tab.id === action.payload.tabId ? { ...tab, wsMessages: [...(tab.wsMessages || []), action.payload.message].slice(-100) } : tab
            ),
        };


    default:
      return state;
  }
};

// --- Context ---
export const WorkspaceContext = createContext<{
  state: Workspace;
  dispatch: React.Dispatch<Action>;
} | null>(null);


// --- App Component ---
const App: React.FC = () => {
    const [storedWorkspace, setStoredWorkspace] = useLocalStorage<Workspace>('patchcat-workspace', getInitialWorkspace());
    const [state, dispatch] = useReducer(workspaceReducer, storedWorkspace);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const item = window.localStorage.getItem('patchcat-workspace');
            if (item) {
                const loadedWorkspace = JSON.parse(item);
                // Basic validation
                if (loadedWorkspace.tabs && loadedWorkspace.settings) {
                    const defaultWorkspace = getInitialWorkspace();
                    // Merge loaded workspace with defaults to ensure new fields exist
                    const migratedWorkspace: Workspace = {
                        ...defaultWorkspace,
                        ...loadedWorkspace,
                        settings: {
                            ...defaultWorkspace.settings,
                            ...loadedWorkspace.settings,
                        },
                        tabs: loadedWorkspace.tabs.map((tab: TabData) => ({
                            ...tab,
                            request: {
                                ...getInitialWorkspace().tabs[0].request,
                                ...tab.request,
                                auth: tab.request.auth || { type: 'inherit' }
                            }
                        }))
                    };
                    dispatch({ type: 'LOAD_WORKSPACE', payload: migratedWorkspace });
                } else {
                     dispatch({ type: 'LOAD_WORKSPACE', payload: getInitialWorkspace() });
                }
            } else {
                dispatch({ type: 'LOAD_WORKSPACE', payload: getInitialWorkspace() });
            }
        } catch (error) {
            console.error("Failed to load workspace from local storage", error);
            dispatch({ type: 'LOAD_WORKSPACE', payload: getInitialWorkspace() });
        }
        setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isLoading) {
            setStoredWorkspace(state);
        }
    }, [state, setStoredWorkspace, isLoading]);

    useEffect(() => {
        const body = document.body;
        // Remove old theme classes
        Object.values(THEME_CLASSES).forEach(className => body.classList.remove(className));
        // Add current theme class
        body.classList.add(THEME_CLASSES[state.settings.theme] || THEME_CLASSES[Theme.Supabase]);
        
        // Remove old font classes
        Object.values(APP_FONTS).forEach(font => body.classList.remove(font.className));
        // Add current font class
        body.classList.add(APP_FONTS[state.settings.font]?.className || APP_FONTS[AppFont.Inter].className);

    }, [state.settings.theme, state.settings.font]);

    if (isLoading) {
        return <StartupLoader />;
    }

    return (
        <WorkspaceContext.Provider value={{ state, dispatch }}>
            <Layout />
        </WorkspaceContext.Provider>
    );
};

export default App;
