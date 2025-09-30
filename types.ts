

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
  Slack = 'Slack',
  GitHub = 'GitHub',
  Discord = 'Discord',
  Notion = 'Notion',
  Spotify = 'Spotify',
  Twitter = 'Twitter',
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
  method: HttpMethod | string; // Allow string for MCP commands
  headers: Header[];
  queryParams: QueryParam[];
  body: Body;
  auth: Auth;
  isAiGenerated?: boolean;
  status?: number;
  operationName?: string;
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

// GraphQL Schema Types
export interface GraphQLSchema {
  queryType: { name: string };
  mutationType?: { name: string };
  subscriptionType?: { name: string };
  types: GraphQLType[];
}

export interface GraphQLType {
  kind: 'SCALAR' | 'OBJECT' | 'INTERFACE' | 'UNION' | 'ENUM' | 'INPUT_OBJECT' | 'LIST' | 'NON_NULL';
  name: string;
  description?: string;
  fields?: GraphQLField[];
  inputFields?: GraphQLInputField[];
  interfaces?: GraphQLTypeRef[];
  enumValues?: GraphQLEnumValue[];
  possibleTypes?: GraphQLTypeRef[];
  ofType?: GraphQLTypeRef;
}

export interface GraphQLField {
  name: string;
  description?: string;
  args: GraphQLInputField[];
  type: GraphQLTypeRef;
  isDeprecated: boolean;
  deprecationReason?: string;
}

export interface GraphQLInputField {
  name: string;
  description?: string;
  type: GraphQLTypeRef;
  defaultValue?: string;
}

export interface GraphQLEnumValue {
  name: string;
  description?: string;
  isDeprecated: boolean;
  deprecationReason?: string;
}

export interface GraphQLTypeRef {
  kind: string;
  name?: string;
  ofType?: GraphQLTypeRef;
}

export interface TabData {
  id: string;
  name: string;
  isLoading: boolean;
  request: ApiRequest;
  response?: ApiResponse;
  // WebSocket specific state
  wsStatus?: WsStatus;
  wsMessages?: WebSocketMessage[];
  // GraphQL specific state
  gqlSchema?: GraphQLSchema;
  gqlSchemaLoading?: boolean;
  gqlSchemaError?: string;
  gqlVariables?: string;
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