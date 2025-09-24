export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

export enum Protocol {
  REST = 'REST',
  GraphQL = 'GraphQL',
  WebSocket = 'WebSocket',
}

export enum Theme {
  Supabase = 'Supabase',
  Microsoft = 'Microsoft',
  Google = 'Google',
}

export enum AppFont {
  Inter = 'Inter',
  RobotoMono = 'Roboto Mono',
  SourceCodePro = 'Source Code Pro',
}

export interface Header {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface QueryParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Auth {
  type: 'none' | 'bearer' | 'inherit';
  token?: string;
}

// New types for request body
export interface FormDataField {
  id: string;
  key: string;
  value: string; // For text type. For file type, the file object is held in component state.
  type: 'text' | 'file';
  enabled: boolean;
}

export type Body =
  | { type: 'raw'; content: string }
  | { type: 'form-data'; fields: FormDataField[] }
  | { type: 'binary' };

export interface ApiRequest {
  id: string;
  name: string;
  protocol: Protocol;
  url: string;
  method: HttpMethod;
  headers: Header[];
  queryParams: QueryParam[];
  body: Body;
  auth: Auth;
  isAiGenerated?: boolean;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  time: number;
  size: number;
  data: any;
  headers: Record<string, string>;
}

export interface WebSocketMessage {
  id: string;
  direction: 'sent' | 'received' | 'system';
  content: string;
  timestamp: number;
}

export type WsStatus = 'disconnected' | 'connecting' | 'connected';

export interface TabData {
  id: string;
  name: string;
  isLoading: boolean;
  request: ApiRequest;
  response?: ApiResponse;
  // WebSocket specific state
  wsStatus?: WsStatus;
  wsMessages?: WebSocketMessage[];
}

export type AiMessageType = 'info' | 'thinking' | 'suggestion' | 'error' | 'user';

export interface AiSuggestion {
  suggestionText: string;
  apiRequest: Partial<ApiRequest>;
}

export interface AiMessage {
  id: string;
  type: AiMessageType;
  content: string;
  suggestions?: AiSuggestion[];
}

export interface Settings {
  theme: Theme;
  font: AppFont;
  aiEnabled: boolean;
  geminiApiKey: string;
  globalHeaders: Header[];
  globalQueryParams: QueryParam[];
  globalAuth: Auth;
}

export interface Workspace {
  tabs: TabData[];
  activeTabId: string | null;
  history: ApiRequest[];
  settings: Settings;
  aiMessages: AiMessage[];
  analyzedRequestsCache: string[];
}
