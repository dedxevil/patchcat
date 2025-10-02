import React, { useContext, useState, useEffect, useRef } from 'react';
import { WorkspaceContext } from '../App';
import { TabData, Header, QueryParam, HttpMethod, Body, ApiRequest, ApiResponse, AiMessage, Protocol, FormDataField, Auth } from '../types';
import { SendIcon, SparklesIcon } from './icons';
import ResponsePanel from './ResponsePanel';
import WebSocketPanel from './WebSocketPanel';
import GraphQLPanel from './GraphQLPanel';
import Tooltip from './Tooltip';
import { getMethodSelectClasses, getMethodColorClass } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { analyzeApiCall } from '../services/geminiService';
import { resolveVariables } from '../utils/variables';
import { KeyValueEditor } from './KeyValueEditor';
import { AuthEditor } from './AuthEditor';
import { BodyEditor } from './BodyEditor';

type RequestConfigTab = 'params' | 'headers' | 'body' | 'auth';

const getGqlOperationName = (query: string): string | null => {
  if (!query) return null;
  const match = query.match(/(?:query|mutation)\s+([_A-Za-z][_0-9A-Za-z]*)(?:\s*\(.*?\))?\s*\{/);
  return match ? match[1] : null;
};

const RequestTab: React.FC<{ tab: TabData }> = ({ tab }) => {
    const { state, dispatch } = useContext(WorkspaceContext)!;
    const { request, response, isLoading } = tab;
    const [activeConfigTab, setActiveConfigTab] = useState<RequestConfigTab>('params');
    const [fileObjects, setFileObjects] = useState<Record<string, File | null>>({});
    const [binaryFile, setBinaryFile] = useState<File | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // State for resizable panel
    const [requestPanelHeight, setRequestPanelHeight] = useState(250);
    const isResizingRef = useRef(false);
    const hasBeenResizedByUser = useRef(false);
    const restContainerRef = useRef<HTMLDivElement>(null);

    // Adjust default panel height based on content, but respect manual resize
    useEffect(() => {
        if (hasBeenResizedByUser.current) {
            return; // Don't override user's manual resize
        }
        const hasNoParamsOrHeaders = request.queryParams.length === 0 && request.headers.length === 0;
        // If there are no params or headers, make the request panel smaller by default.
        const defaultHeight = hasNoParamsOrHeaders ? 150 : 250;
        setRequestPanelHeight(defaultHeight);
    }, [request.queryParams.length, request.headers.length]);

    const handleMouseDown = (e: React.MouseEvent) => {
        isResizingRef.current = true;
        hasBeenResizedByUser.current = true;
        document.body.style.userSelect = 'none'; // Prevent text selection
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current || !restContainerRef.current) return;
            const containerRect = restContainerRef.current.getBoundingClientRect();
            const newHeight = e.clientY - containerRect.top;

            const minHeight = 150; // Min height for request panel
            const maxHeight = containerRect.height - 200; // Min height for response panel

            if (newHeight >= minHeight && newHeight <= maxHeight) {
                setRequestPanelHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            isResizingRef.current = false;
            document.body.style.userSelect = '';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);
    
    useEffect(() => {
        // Clear local file state when tab ID changes to prevent cross-tab contamination
        setFileObjects({});
        setBinaryFile(null);
    }, [tab.id]);

    const handleRequestChange = (change: Partial<ApiRequest>) => {
        dispatch({ type: 'UPDATE_REQUEST', payload: { tabId: tab.id, request: change } });
    };
    
    const handleProtocolChange = (protocol: Protocol) => {
        handleRequestChange({ protocol });
    };

    const handleCancelRequest = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const activeEnvironment = (state.settings.environments || []).find(e => e.id === state.settings.activeEnvironmentId);
    const { resolvedText: resolvedUrl, usedVariables } = resolveVariables(request.url, activeEnvironment);
    const hasVariables = Object.keys(usedVariables).length > 0;

    const handleSendRequest = async () => {
        dispatch({ type: 'SET_LOADING', payload: { tabId: tab.id, isLoading: true } });
        
        if (request.protocol === Protocol.REST || request.protocol === Protocol.GraphQL) {
            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            const resolveAuth = (): Auth => {
                const tabAuth = request.auth;
                if (!tabAuth || tabAuth.type === 'inherit') {
                    return state.settings.globalAuth;
                }
                return tabAuth; // Returns 'none' or 'bearer' with its own token
            };

            const finalAuth = resolveAuth();
            const finalHeaders = [...state.settings.globalHeaders.filter(h => h.enabled), ...request.headers.filter(h => h.enabled)];
            const finalQueryParams = [...state.settings.globalQueryParams.filter(p => p.enabled), ...request.queryParams.filter(p => p.enabled)];

            const url = new URL(resolvedUrl);
            finalQueryParams.forEach(param => {
                const { resolvedText } = resolveVariables(param.value, activeEnvironment);
                url.searchParams.append(param.key, resolvedText);
            });

            const headers = new Headers();
            finalHeaders.forEach(header => {
                const { resolvedText } = resolveVariables(header.value, activeEnvironment);
                headers.append(header.key, resolvedText);
            });
            
            if (finalAuth?.type === 'bearer' && finalAuth.token) {
                const { resolvedText } = resolveVariables(finalAuth.token, activeEnvironment);
                headers.append('Authorization', `Bearer ${resolvedText}`);
            }

            let body: BodyInit | null = null;
            if (![HttpMethod.GET, HttpMethod.HEAD].includes(request.method as HttpMethod)) {
                if (request.protocol === Protocol.GraphQL) {
                    try {
                        const { resolvedText: resolvedVariables } = resolveVariables(tab.gqlVariables || '{}', activeEnvironment);
                        const variables = JSON.parse(resolvedVariables);
                        
                        const { resolvedText: resolvedQuery } = resolveVariables(
                            request.body.type === 'raw' ? request.body.content : '', activeEnvironment
                        );

                        body = JSON.stringify({
                            query: resolvedQuery,
                            variables,
                        });
                        if (!headers.has('Content-Type')) {
                            headers.append('Content-Type', 'application/json');
                        }
                    } catch (e) {
                         const errorResponse: ApiResponse = {
                            status: 0, statusText: 'Client Error', time: 0, size: 0,
                            data: { error: "Invalid JSON in variables. Check syntax and environment variables." }, headers: {},
                        };
                        dispatch({ type: 'SET_RESPONSE', payload: { tabId: tab.id, response: errorResponse } });
                        dispatch({ type: 'SET_LOADING', payload: { tabId: tab.id, isLoading: false } });
                        return;
                    }
                } else { // REST protocol body logic
                    if (request.body.type === 'raw' && request.body.content) {
                        const { resolvedText } = resolveVariables(request.body.content, activeEnvironment);
                        body = resolvedText;
                        if (!headers.has('Content-Type')) {
                            headers.append('Content-Type', 'application/json');
                        }
                    } else if (request.body.type === 'form-data') {
                        const formData = new FormData();
                        request.body.fields.forEach(field => {
                            if (field.enabled && field.key) {
                                if (field.type === 'text') {
                                    const { resolvedText } = resolveVariables(field.value, activeEnvironment);
                                    formData.append(field.key, resolvedText);
                                } else {
                                    const file = fileObjects[field.id];
                                    if (file) {
                                        formData.append(field.key, file, file.name);
                                    }
                                }
                            }
                        });
                        body = formData;
                        headers.delete('Content-Type');
                    } else if (request.body.type === 'binary') {
                        if (binaryFile) {
                            body = binaryFile;
                            if (!headers.has('Content-Type')) {
                                headers.append('Content-Type', binaryFile.type || 'application/octet-stream');
                            }
                        }
                    }
                }
            }

            const startTime = Date.now();
            try {
                const res = await fetch(url.toString(), {
                    method: request.method,
                    headers,
                    body,
                    signal,
                });

                const endTime = Date.now();
                const responseTime = endTime - startTime;
                const responseText = await res.text();
                const responseSize = new Blob([responseText]).size;

                let responseData: any;
                try {
                    responseData = JSON.parse(responseText);
                } catch (e) {
                    responseData = responseText;
                }

                const responseHeaders: Record<string, string> = {};
                res.headers.forEach((value, key) => {
                    responseHeaders[key] = value;
                });

                const apiResponse: ApiResponse = {
                    status: res.status,
                    statusText: res.statusText,
                    time: responseTime,
                    size: responseSize,
                    data: responseData,
                    headers: responseHeaders,
                };

                dispatch({ type: 'SET_RESPONSE', payload: { tabId: tab.id, response: apiResponse } });
                const requestWithStatus: ApiRequest = { ...request, id: uuidv4(), status: apiResponse.status };

                if (request.protocol === Protocol.GraphQL && request.body.type === 'raw') {
                    const operationName = getGqlOperationName(request.body.content);
                    if (operationName) {
                        requestWithStatus.operationName = operationName;
                    }
                }

                dispatch({ type: 'ADD_HISTORY', payload: requestWithStatus });
                
                if (state.settings.aiEnabled && state.settings.geminiApiKey && !state.analyzedRequestsCache.includes(request.id)) {
                    dispatch({ type: 'ADD_TO_ANALYSIS_CACHE', payload: request.id });
                    
                    const thinkingMessage: AiMessage = { id: uuidv4(), type: 'thinking', content: 'Analyzing response...' };
                    dispatch({ type: 'ADD_AI_MESSAGE', payload: thinkingMessage });
                    
                    // The request passed to the AI should have the resolved URL for context,
                    // but the AI will be instructed to use placeholders for generating new tests.
                    const requestForAnalysis = { ...request, url: resolvedUrl };

                    const analysisResult = await analyzeApiCall(
                        requestForAnalysis,
                        apiResponse,
                        state.history,
                        state.settings.geminiApiKey,
                        tab.gqlVariables,
                        usedVariables // Pass the used variables for context
                    );

                    if (analysisResult === 'SKIPPED_LARGE') {
                        const skippedMessage: AiMessage = {
                            id: uuidv4(),
                            type: 'info',
                            content: "This response is purr-etty big! I'm skipping analysis to save time. No point staring at a giant ball of yarn, right?",
                        };
                        dispatch({ type: 'ADD_AI_MESSAGE', payload: skippedMessage });
                    } else if (analysisResult && analysisResult.length > 0) {
                        const suggestions = analysisResult;
                        const successMessage: AiMessage = {
                            id: uuidv4(),
                            type: 'suggestion',
                            content: `I've sniffed around this response and found ${suggestions.length} interesting scent trails for you to follow!`,
                            suggestions: suggestions,
                        };
                        dispatch({ type: 'ADD_AI_MESSAGE', payload: successMessage });
                    } else {
                         const infoMessage: AiMessage = {
                            id: uuidv4(),
                            type: 'info',
                            content: "I've checked out the response. Everything seems to be in order, just a quiet nap spot here. Let me know if you want me to pounce on anything specific!",
                        };
                        dispatch({ type: 'ADD_AI_MESSAGE', payload: infoMessage });
                    }
                }

            } catch (error: any) {
                const endTime = Date.now();
                if (error.name === 'AbortError') {
                    const apiResponse: ApiResponse = {
                        status: 0,
                        statusText: 'Request Cancelled',
                        time: endTime - startTime,
                        size: 0,
                        data: { error: 'Request was cancelled by the user.' },
                        headers: {},
                    };
                    dispatch({ type: 'SET_RESPONSE', payload: { tabId: tab.id, response: apiResponse } });
                } else {
                    const apiResponse: ApiResponse = {
                        status: 0,
                        statusText: 'Network Error',
                        time: endTime - startTime,
                        size: 0,
                        data: { error: 'Could not connect', message: error.message },
                        headers: {},
                    };
                    dispatch({ type: 'SET_RESPONSE', payload: { tabId: tab.id, response: apiResponse } });
                    const requestWithStatus = { ...request, id: uuidv4(), status: apiResponse.status };
                    dispatch({ type: 'ADD_HISTORY', payload: requestWithStatus });
                }
            }
        }
    };

    const renderConfigPanel = () => {
        switch (activeConfigTab) {
            case 'params':
                return <div className="p-4"><KeyValueEditor items={request.queryParams} onChange={(items) => handleRequestChange({ queryParams: items as QueryParam[] })} addLabel="Add Param" /></div>;
            case 'headers':
                return <div className="p-4"><KeyValueEditor items={request.headers} onChange={(items) => handleRequestChange({ headers: items as Header[] })} addLabel="Add Header" /></div>;
            case 'body':
                return <BodyEditor 
                            body={request.body} 
                            onChange={(body) => handleRequestChange({ body })} 
                            fileObjects={fileObjects}
                            setFileObjects={setFileObjects}
                            binaryFile={binaryFile}
                            setBinaryFile={setBinaryFile}
                            method={request.method as HttpMethod}
                        />;
            case 'auth':
                return <div className="p-4"><AuthEditor 
                            auth={request.auth || { type: 'inherit' }} 
                            onChange={(auth) => handleRequestChange({ auth })}
                            globalAuth={state.settings.globalAuth}
                       /></div>;
            default:
                return null;
        }
    };

    const renderContent = () => {
        switch (request.protocol) {
            case Protocol.REST:
                return (
                    <div className="flex flex-col h-full" ref={restContainerRef}>
                        {/* Top: Request Configuration (Resizable) */}
                        <div style={{ height: `${requestPanelHeight}px` }} className="flex flex-col flex-shrink-0">
                            {/* Config Tabs (Params, Headers, etc.) */}
                            <div className="flex-shrink-0 flex border-b border-border-default">
                                {(['params', 'headers', 'body', 'auth'] as const).map(tabName => (
                                    <button key={tabName} onClick={() => setActiveConfigTab(tabName)} className={`px-4 py-2 text-sm capitalize ${activeConfigTab === tabName ? 'text-brand border-b-2 border-brand -mb-px' : 'text-text-muted'}`}>
                                        {tabName}
                                    </button>
                                ))}
                            </div>
                            {/* Config Panel Content (scrollable) */}
                            <div className="flex-grow overflow-y-auto">
                                {renderConfigPanel()}
                            </div>
                        </div>

                         {/* Draggable Splitter */}
                        <div
                            onMouseDown={handleMouseDown}
                            className="h-1.5 w-full cursor-row-resize bg-bg-subtle hover:bg-border-strong transition-colors flex-shrink-0"
                            aria-label="Resize request panel"
                            role="separator"
                        ></div>

                        {/* Bottom: Response Panel (Fills remaining space) */}
                        <div className="flex flex-col flex-grow min-h-0">
                            {isLoading ? (
                                <div className="flex flex-grow items-center justify-center h-full text-text-muted">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand"></div>
                                    <span className="ml-4">Loading...</span>
                                </div>
                            ) : response ? (
                                <ResponsePanel response={response} />
                            ) : (
                                <div className="flex flex-col flex-grow items-center justify-center h-full text-center text-text-muted p-4">
                                    <SparklesIcon className="w-12 h-12 mb-4" />
                                    <h2 className="text-lg font-semibold">Ready to make a request?</h2>
                                    <p>Click the 'Send' button to see the response here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case Protocol.GraphQL:
                return <GraphQLPanel tab={tab} />;
            case Protocol.WebSocket:
                return <WebSocketPanel tab={tab} />;
            default:
                return null;
        }
    };

    const isHttpProtocol = request.protocol === Protocol.REST || request.protocol === Protocol.GraphQL;

    return (
        <div className="flex flex-col h-full bg-bg-default text-text-default">
            {/* Request URL Bar */}
            <div className="flex-shrink-0 flex flex-wrap md:flex-nowrap items-center p-2 gap-2 border-b border-border-default">
                <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
                    <select
                        value={request.protocol}
                        onChange={(e) => handleProtocolChange(e.target.value as Protocol)}
                        className="font-mono font-bold text-sm bg-transparent border rounded-md focus:outline-none focus:ring-1 focus:ring-brand pl-3 pr-8 py-2 border-border-default"
                    >
                        {Object.values(Protocol).map(p => <option key={p} value={p} className="bg-bg-subtle font-bold">{p}</option>)}
                    </select>
                    
                    {request.protocol === Protocol.REST && (
                        <select
                            value={request.method}
                            onChange={(e) => handleRequestChange({ method: e.target.value as HttpMethod })}
                            className={`font-mono font-bold text-sm bg-transparent border rounded-md focus:outline-none focus:ring-1 focus:ring-brand pl-3 pr-10 py-2 ${getMethodSelectClasses(request.method as HttpMethod)}`}
                        >
                            {Object.values(HttpMethod).map(method => (
                                <option
                                    key={method}
                                    value={method}
                                    className={`bg-bg-subtle font-bold ${getMethodColorClass(method)}`}
                                >
                                    {method}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                
                <div className="flex-grow w-full md:w-auto min-w-0">
                    <Tooltip text={`Resolved: ${resolvedUrl}`} position="bottom" disabled={!hasVariables}>
                        <input
                            type="text"
                            value={request.url}
                            onChange={(e) => handleRequestChange({ url: e.target.value })}
                            placeholder={isHttpProtocol ? "[host]/resource" : "wss://socket.example.com"}
                            className="w-full p-2 bg-bg-subtle border border-border-default rounded-md text-sm focus:ring-1 focus:ring-brand focus:outline-none"
                        />
                    </Tooltip>
                </div>

                {isHttpProtocol && (
                    <div className="flex items-stretch gap-2 w-full sm:w-auto flex-shrink-0">
                        <button
                            onClick={handleSendRequest}
                            disabled={isLoading}
                            className="flex-grow flex items-center justify-center gap-2 px-4 py-2 bg-brand text-white rounded-md font-semibold text-sm hover:bg-brand-hover disabled:bg-brand/50 disabled:cursor-not-allowed"
                        >
                            <SendIcon className="w-4 h-4" />
                            {isLoading ? 'Sending...' : 'Send'}
                        </button>
                        {isLoading && (
                            <button
                                onClick={handleCancelRequest}
                                className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-danger text-white rounded-md font-semibold text-sm hover:bg-danger-hover"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                )}
            </div>
            <div className="flex-grow min-h-0">
                {renderContent()}
            </div>
        </div>
    );
};

export default RequestTab;