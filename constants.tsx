import { Workspace, Theme, AppFont, ApiRequest, Protocol, HttpMethod, TabData, Auth } from './types';
import { v4 as uuidv4 } from 'uuid';

export const THEME_CLASSES: Record<Theme, string> = {
  [Theme.Supabase]: 'theme-supabase',
  [Theme.Microsoft]: 'theme-microsoft',
  [Theme.Google]: 'theme-google',
};

export const APP_FONTS: Record<AppFont, { name: string; className: string }> = {
  [AppFont.Inter]: { name: 'Inter', className: 'font-inter' },
  [AppFont.RobotoMono]: { name: 'Roboto Mono', className: 'font-roboto-mono' },
  [AppFont.SourceCodePro]: { name: 'Source Code Pro', className: 'font-source-code-pro' },
};

export const getMethodColorClass = (method: HttpMethod): string => {
  switch (method) {
    case HttpMethod.GET:
      return 'text-success';
    case HttpMethod.POST:
      return 'text-yellow-400';
    case HttpMethod.PUT:
      return 'text-blue-400';
    case HttpMethod.PATCH:
      return 'text-purple-400';
    case HttpMethod.DELETE:
      return 'text-danger';
    case HttpMethod.HEAD:
    case HttpMethod.OPTIONS:
    default:
      return 'text-text-subtle';
  }
};

export const getMethodSelectClasses = (method: HttpMethod): string => {
    // Returns text and border color classes
    switch (method) {
      case HttpMethod.GET:
        return 'text-success border-success/50';
      case HttpMethod.POST:
        return 'text-yellow-400 border-yellow-400/50';
      case HttpMethod.PUT:
        return 'text-blue-400 border-blue-400/50';
      case HttpMethod.PATCH:
        return 'text-purple-400 border-purple-400/50';
      case HttpMethod.DELETE:
        return 'text-danger border-danger/50';
      case HttpMethod.HEAD:
      case HttpMethod.OPTIONS:
      default:
        return 'text-text-subtle border-border-default';
    }
}

export const getInitialWorkspace = (): Workspace => {
    const firstTabId = uuidv4();
    const firstRequestId = uuidv4();
    return {
        tabs: [{
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
        }],
        activeTabId: firstTabId,
        history: [],
        settings: {
            theme: Theme.Supabase,
            font: AppFont.Inter,
            aiEnabled: true,
            geminiApiKey: '',
            globalHeaders: [],
            globalQueryParams: [],
            globalAuth: { type: 'none' },
        },
        aiMessages: [{
            id: uuidv4(),
            type: 'info',
            content: "Welcome to Patchcat AI! I can help you test your APIs. Make a request, and I'll analyze the response."
        }],
        analyzedRequestsCache: [],
    }
};
