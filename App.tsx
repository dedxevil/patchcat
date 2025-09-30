import React, { createContext, useReducer, useEffect } from 'react';
import { Workspace, TabData, ApiRequest, ApiResponse, Settings, AiMessage, Theme, AppFont, Protocol, HttpMethod, WebSocketMessage, WsStatus, GraphQLSchema } from './types';
import { getInitialWorkspace, THEME_CLASSES, APP_FONTS } from './constants';
import Layout from './components/Layout';
import { v4 as uuidv4 } from 'uuid';

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
  | { type: 'ADD_WS_MESSAGE'; payload: { tabId: string; message: WebSocketMessage } }
  | { type: 'SET_GQL_SCHEMA_STATE'; payload: { tabId: string; schema?: GraphQLSchema; isLoading?: boolean; error?: string } }
  | { type: 'UPDATE_GQL_VARIABLES'; payload: { tabId: string; variables: string } };

// --- Reducer ---
const workspaceReducer = (state: Workspace, action: Action): Workspace => {
  const newState = ((): Workspace => {
    switch (action.type) {
      case 'LOAD_WORKSPACE':
          return action.payload;
          
      case 'ADD_TAB': {
        const newTabId = uuidv4();
        
        const providedRequest = action.payload.request;
        // Determine protocol: from provided request, or from payload (for '+' button), or default to REST
        const protocolForNewTab = providedRequest?.protocol || action.payload.protocol || Protocol.REST;
        
        const tabName = providedRequest?.name || `${protocolForNewTab} Request ${state.tabs.length + 1}`;

        const newTab: TabData = {
          id: newTabId,
          name: tabName, // Use consistent name
          isLoading: false,
          request: {
            // Start with sensible defaults
            id: uuidv4(),
            protocol: protocolForNewTab,
            url: 'https://jsonplaceholder.typicode.com/todos/1',
            method: HttpMethod.GET,
            headers: [],
            queryParams: [],
            body: { type: 'raw', content: '' },
            auth: { type: 'inherit' },
            // Overwrite with any provided request data
            ...providedRequest,
            name: tabName, // Overwrite name to match tab name
          },
        };
        
        // Add protocol-specific properties
        if (newTab.request.protocol === Protocol.WebSocket) {
          newTab.wsStatus = 'disconnected';
          newTab.wsMessages = [];
          newTab.request.url = 'wss://socketsbay.com/wss/v2/1/demo/';
        }
        
        if (newTab.request.protocol === Protocol.GraphQL) {
          newTab.gqlVariables = '{\n  "id": 1\n}';
          newTab.request.method = HttpMethod.POST;
          newTab.request.body = { type: 'raw', content: 'query GetTodo($id: ID!) {\n  todo(id: $id) {\n    id\n    title\n    completed\n  }\n}' };
        }
        
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
            newTabs.push({
                id: firstTabId,
                name: 'My First Request',
                isLoading: false,
                request: {
                    id: uuidv4(),
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

        return {
          ...state,
          tabs: newTabs,
          activeTabId: newActiveTabId,
        };
      }
      
      case 'DUPLICATE_TAB': {
          const tabToDuplicate = state.tabs.find(tab => tab.id === action.payload);
          if (!tabToDuplicate) return state;

          const newTabId = uuidv4();
          const newTab: TabData = {
              ...tabToDuplicate,
              id: newTabId,
              name: `${tabToDuplicate.name} Copy`,
              request: {
                  ...tabToDuplicate.request,
                  id: uuidv4(),
              }
          };

          const tabIndex = state.tabs.findIndex(tab => tab.id === action.payload);
          const newTabs = [...state.tabs];
          newTabs.splice(tabIndex + 1, 0, newTab);

          return {
              ...state,
              tabs: newTabs,
              activeTabId: newTabId,
          };
      }
      
      case 'SET_ACTIVE_TAB':
          return { ...state, activeTabId: action.payload };
      
      case 'UPDATE_TAB_NAME': {
          const { tabId, name } = action.payload;
          return {
              ...state,
              tabs: state.tabs.map(tab =>
                  tab.id === tabId ? { ...tab, name, request: { ...tab.request, name } } : tab
              ),
          };
      }
      
      case 'UPDATE_REQUEST': {
          const { tabId, request } = action.payload;
          return {
              ...state,
              tabs: state.tabs.map(tab => {
                  if (tab.id === tabId) {
                      const originalProtocol = tab.request.protocol;
                      const updatedRequest = { ...tab.request, ...request };

                      if (request.protocol && request.protocol !== originalProtocol) {
                          if (request.protocol === Protocol.GraphQL) {
                              updatedRequest.method = HttpMethod.POST;
                              updatedRequest.body = { type: 'raw', content: 'query GetTodo($id: ID!) {\n  todo(id: $id) {\n    id\n    title\n    completed\n  }\n}' };
                              tab.gqlVariables = '{\n  "id": 1\n}';
                              tab.gqlSchema = undefined;
                              tab.gqlSchemaError = undefined;
                              tab.gqlSchemaLoading = false;
                          } else if (request.protocol === Protocol.WebSocket) {
                              updatedRequest.url = 'wss://socketsbay.com/wss/v2/1/demo/';
                              tab.wsStatus = 'disconnected';
                              tab.wsMessages = [];
                          } else if (request.protocol === Protocol.REST) {
                              updatedRequest.url = 'https://jsonplaceholder.typicode.com/todos/1';
                          }
                      }
                      return { ...tab, request: updatedRequest };
                  }
                  return tab;
              }),
          };
      }
      
      case 'SET_RESPONSE': {
          const { tabId, response } = action.payload;
          return {
              ...state,
              tabs: state.tabs.map(tab =>
                  tab.id === tabId ? { ...tab, response, isLoading: false } : tab
              ),
          };
      }
      
      case 'SET_LOADING': {
          const { tabId, isLoading } = action.payload;
          return {
              ...state,
              tabs: state.tabs.map(tab =>
                  tab.id === tabId ? { ...tab, isLoading } : tab
              ),
          };
      }
      
      case 'UPDATE_SETTINGS':
          return { ...state, settings: { ...state.settings, ...action.payload } };
      
      case 'ADD_HISTORY': {
          const newHistory = [
              action.payload,
              ...state.history.filter(h => h.id !== action.payload.id)
          ].slice(0, 50); // Keep history to 50 items
          return { ...state, history: newHistory };
      }
      
      case 'REMOVE_HISTORY':
          return { ...state, history: state.history.filter(h => h.id !== action.payload) };
      
      case 'CLEAR_HISTORY':
          return { ...state, history: [] };
      
      case 'ADD_AI_MESSAGE': {
          const filteredMessages = state.aiMessages.filter(m => m.type !== 'thinking');
          return {
              ...state,
              aiMessages: [...filteredMessages, action.payload],
          };
      }
      
      case 'ADD_TO_ANALYSIS_CACHE':
          return {
              ...state,
              analyzedRequestsCache: [...state.analyzedRequestsCache, action.payload],
          };
      
      case 'SET_WS_STATUS': {
          const { tabId, status } = action.payload;
          return {
              ...state,
              tabs: state.tabs.map(tab =>
                  tab.id === tabId ? { ...tab, wsStatus: status } : tab
              ),
          };
      }
      
      case 'ADD_WS_MESSAGE': {
          const { tabId, message } = action.payload;
          return {
              ...state,
              tabs: state.tabs.map(tab => {
                  if (tab.id === tabId) {
                      const newMessages = [...(tab.wsMessages || []), message];
                      return { ...tab, wsMessages: newMessages };
                  }
                  return tab;
              }),
          };
      }

      case 'SET_GQL_SCHEMA_STATE': {
          const { tabId, schema, isLoading, error } = action.payload;
          return {
              ...state,
              tabs: state.tabs.map(tab => {
                  if (tab.id === tabId) {
                      return {
                          ...tab,
                          gqlSchema: schema !== undefined ? schema : tab.gqlSchema,
                          gqlSchemaLoading: isLoading !== undefined ? isLoading : tab.gqlSchemaLoading,
                          gqlSchemaError: error !== undefined ? error : tab.gqlSchemaError,
                      };
                  }
                  return tab;
              }),
          };
      }

      case 'UPDATE_GQL_VARIABLES': {
          const { tabId, variables } = action.payload;
          return {
              ...state,
              tabs: state.tabs.map(tab =>
                  tab.id === tabId ? { ...tab, gqlVariables: variables } : tab
              ),
          };
      }

      default:
          return state;
    }
  })();

  // Persist state to localStorage on every update, except for the initial load.
  if (action.type !== 'LOAD_WORKSPACE') {
    try {
      // Create a copy of the state and reset isLoading flags to prevent
      // persisted loading state on page refresh.
      const stateToPersist = {
        ...newState,
        tabs: newState.tabs.map(tab => ({ ...tab, isLoading: false })),
      };
      window.localStorage.setItem('patchcat-workspace', JSON.stringify(stateToPersist));
    } catch (error) {
      console.error("Failed to save workspace to localStorage", error);
    }
  }
  
  return newState;
};

// --- Context ---
export const WorkspaceContext = createContext<{
  state: Workspace;
  dispatch: React.Dispatch<Action>;
} | null>(null);


const initializer = (initialArg: () => Workspace): Workspace => {
  try {
    const item = window.localStorage.getItem('patchcat-workspace');
    if (item) {
        const parsed = JSON.parse(item);
        if (parsed.tabs && parsed.settings) {
            return parsed;
        }
    }
  } catch (error) {
    console.error("Failed to load workspace, starting fresh.", error);
  }
  return initialArg();
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(workspaceReducer, getInitialWorkspace, initializer);

  useEffect(() => {
    document.body.className = '';
    const themeClass = THEME_CLASSES[state.settings.theme];
    const fontClass = APP_FONTS[state.settings.font].className;
    document.body.classList.add(themeClass, fontClass, 'font-inter');
  }, [state.settings.theme, state.settings.font]);
  
  return (
    <WorkspaceContext.Provider value={{ state, dispatch }}>
      <Layout />
    </WorkspaceContext.Provider>
  );
};

export default App;