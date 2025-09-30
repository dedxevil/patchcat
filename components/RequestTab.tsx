import React, { useContext, useState, useEffect, useRef } from 'react';
import { WorkspaceContext } from '../App';
import { TabData, Header, QueryParam, HttpMethod, Body, ApiRequest, ApiResponse, AiMessage, Protocol, FormDataField, Auth } from '../types';
import { SendIcon, SparklesIcon, PlusIcon, TrashIcon } from './icons';
import ResponsePanel from './ResponsePanel';
import WebSocketPanel from './WebSocketPanel';
import { getMethodSelectClasses, getMethodColorClass } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { analyzeApiCall } from '../services/geminiService';

type RequestConfigTab = 'params' | 'headers' | 'body' | 'auth';

const KeyValueEditor: React.FC<{
    items: (Header | QueryParam)[];
    onChange: (items: (Header | QueryParam)[]) => void;
    addLabel: string;
}> = ({ items, onChange, addLabel }) => {
    
    const handleItemChange = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        onChange(newItems);
    };

    const addItem = () => {
        onChange([...items, { id: uuidv4(), key: '', value: '', enabled: true }]);
    };

    const removeItem = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <div className="p-4 space-y-2 text-sm">
            {items.map((item, index) => (
                <div key={item.id} className="flex flex-wrap items-center gap-2 border-b border-border-default pb-2">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-brand bg-bg-muted border-border-default rounded focus:ring-brand"
                        checked={item.enabled}
                        onChange={(e) => handleItemChange(index, 'enabled', e.target.checked)}
                    />
                    <input
                        type="text"
                        placeholder="Key"
                        className="flex-grow min-w-[150px] bg-bg-subtle border border-border-default rounded-md px-2 py-1 focus:ring-1 focus:ring-brand focus:outline-none"
                        value={item.key}
                        onChange={(e) => handleItemChange(index, 'key', e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Value"
                        className="flex-grow min-w-[150px] bg-bg-subtle border border-border-default rounded-md px-2 py-1 focus:ring-1 focus:ring-brand focus:outline-none"
                        value={item.value}
                        onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                    />
                    <button onClick={() => removeItem(index)} className="text-text-muted hover:text-danger p-1">
                        <TrashIcon />
                    </button>
                </div>
            ))}
            <button
                onClick={addItem}
                className="flex items-center gap-2 text-sm text-brand font-semibold hover:text-brand-hover pt-1"
            >
                <PlusIcon /> {addLabel}
            </button>
        </div>
    );
};

const FormDataEditor: React.FC<{
    fields: FormDataField[];
    onChange: (fields: FormDataField[]) => void;
    fileObjects: Record<string, File | null>;
    setFileObjects: React.Dispatch<React.SetStateAction<Record<string, File | null>>>;
}> = ({ fields, onChange, fileObjects, setFileObjects }) => {
    
    const handleFieldChange = (index: number, field: 'key' | 'value' | 'enabled' | 'type', value: string | boolean) => {
        const newFields = [...fields];
        (newFields[index] as any)[field] = value;

        if (field === 'type' && value === 'file') {
            newFields[index].value = ''; // Clear text value when switching to file
        } else if (field === 'type' && value === 'text') {
            const fieldId = newFields[index].id;
            setFileObjects(prev => {
                const newFiles = { ...prev };
                delete newFiles[fieldId];
                return newFiles;
            });
        }
        onChange(newFields);
    };

    const handleFileChange = (id: string, file: File | null) => {
        setFileObjects(prev => ({ ...prev, [id]: file }));
        const fieldIndex = fields.findIndex(f => f.id === id);
        if (fieldIndex > -1) {
            const newFields = [...fields];
            newFields[fieldIndex].value = file ? file.name : '';
            onChange(newFields);
        }
    };
    
    const addField = () => {
        onChange([...fields, { id: uuidv4(), key: '', value: '', type: 'text', enabled: true }]);
    };

    const removeField = (index: number) => {
        const fieldToRemove = fields[index];
        setFileObjects(prev => {
            const newFiles = { ...prev };
            delete newFiles[fieldToRemove.id];
            return newFiles;
        });
        onChange(fields.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2 text-sm">
            {fields.map((field, index) => (
                <div key={field.id} className="flex flex-wrap items-center gap-2 border-b border-border-default pb-2">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-brand bg-bg-muted border-border-default rounded focus:ring-brand"
                        checked={field.enabled}
                        onChange={(e) => handleFieldChange(index, 'enabled', e.target.checked)}
                    />
                    <input
                        type="text"
                        placeholder="Key"
                        className="flex-grow min-w-[120px] bg-bg-subtle border border-border-default rounded-md px-2 py-1 focus:ring-1 focus:ring-brand focus:outline-none"
                        value={field.key}
                        onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                    />
                    <div className="flex-grow min-w-[200px] flex gap-2">
                        {field.type === 'text' ? (
                            <input
                                type="text"
                                placeholder="Value"
                                className="flex-grow bg-bg-subtle border border-border-default rounded-md px-2 py-1 focus:ring-1 focus:ring-brand focus:outline-none"
                                value={field.value}
                                onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                            />
                        ) : (
                             <div className="flex-grow">
                                <label className="flex items-center w-full bg-bg-subtle border border-border-default rounded-md px-2 py-1 text-text-muted cursor-pointer hover:bg-bg-muted">
                                    <span className="truncate flex-grow">{fileObjects[field.id]?.name || 'Choose File'}</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(field.id, e.target.files ? e.target.files[0] : null)}
                                    />
                                </label>
                            </div>
                        )}
                        <select 
                            value={field.type} 
                            onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                            className="bg-bg-subtle border border-border-default rounded-md px-2 py-1 focus:ring-1 focus:ring-brand focus:outline-none"
                        >
                            <option value="text">Text</option>
                            <option value="file">File</option>
                        </select>
                    </div>

                    <button onClick={() => removeField(index)} className="text-text-muted hover:text-danger p-1">
                        <TrashIcon />
                    </button>
                </div>
            ))}
            <button
                onClick={addField}
                className="flex items-center gap-2 text-sm text-brand font-semibold hover:text-brand-hover pt-1"
            >
                <PlusIcon /> Add Field
            </button>
        </div>
    );
};

const BinaryFileEditor: React.FC<{
    file: File | null;
    onChange: (file: File | null) => void;
}> = ({ file, onChange }) => {
    return (
        <div>
            <label className="w-full flex items-center justify-center bg-bg-subtle border-2 border-dashed border-border-default rounded-md p-6 text-center cursor-pointer hover:bg-bg-muted hover:border-brand">
                <div className="text-text-muted">
                    {file ? (
                        <>
                            <p className="font-semibold text-text-default">{file.name}</p>
                            <p className="text-xs">({(file.size / 1024).toFixed(2)} KB)</p>
                        </>
                    ) : (
                        <p>Click to select a file</p>
                    )}
                </div>
                <input
                    type="file"
                    className="hidden"
                    onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                />
            </label>
        </div>
    );
};

const BodyEditor: React.FC<{
    body: Body;
    onChange: (body: Body) => void;
    fileObjects: Record<string, File | null>;
    setFileObjects: React.Dispatch<React.SetStateAction<Record<string, File | null>>>;
    binaryFile: File | null;
    setBinaryFile: React.Dispatch<React.SetStateAction<File | null>>;
    method: HttpMethod;
}> = ({ body, onChange, fileObjects, setFileObjects, binaryFile, setBinaryFile, method }) => {
    
    const canHaveBody = ![HttpMethod.GET, HttpMethod.HEAD, HttpMethod.OPTIONS].includes(method);

    if (!canHaveBody) {
        return (
            <div className="p-4 text-sm text-text-muted">
                Requests with the {method} method cannot have a body.
            </div>
        );
    }
    
    const handleTypeChange = (newType: Body['type']) => {
        if (newType !== 'form-data') {
            setFileObjects({});
        }
        if (newType !== 'binary') {
            setBinaryFile(null);
        }
        
        if (newType === 'raw') {
            onChange({ type: 'raw', content: '' });
        } else if (newType === 'form-data') {
            onChange({ type: 'form-data', fields: [] });
        } else if (newType === 'binary') {
            onChange({ type: 'binary' });
        }
    }

    const handleRawChange = (content: string) => {
        onChange({ type: 'raw', content });
    }

    return (
        <div className="p-4 space-y-4">
             <div className="flex items-center gap-4 text-sm">
                <label>
                    <input type="radio" value="raw" checked={body.type === 'raw'} onChange={() => handleTypeChange('raw')} className="mr-1 form-radio text-brand focus:ring-brand" />
                    Raw (JSON)
                </label>
                <label>
                    <input type="radio" value="form-data" checked={body.type === 'form-data'} onChange={() => handleTypeChange('form-data')} className="mr-1 form-radio text-brand focus:ring-brand" />
                    Form-data
                </label>
                 <label>
                    <input type="radio" value="binary" checked={body.type === 'binary'} onChange={() => handleTypeChange('binary')} className="mr-1 form-radio text-brand focus:ring-brand" />
                    Binary
                </label>
            </div>
            {body.type === 'raw' && (
                <textarea
                    value={body.content}
                    onChange={(e) => handleRawChange(e.target.value)}
                    placeholder='Enter JSON body here...'
                    className="w-full h-48 font-mono text-sm bg-bg-subtle border border-border-default rounded-md p-2 focus:ring-1 focus:ring-brand focus:outline-none"
                />
            )}
             {body.type === 'form-data' && (
                 <FormDataEditor 
                    fields={body.fields || []}
                    onChange={(fields) => onChange({ type: 'form-data', fields })}
                    fileObjects={fileObjects}
                    setFileObjects={setFileObjects}
                 />
             )}
             {body.type === 'binary' && (
                 <BinaryFileEditor file={binaryFile} onChange={setBinaryFile} />
             )}
        </div>
    )
}

const AuthEditor: React.FC<{
    auth: Auth;
    onChange: (auth: Auth) => void;
    globalAuth: Auth;
}> = ({ auth, onChange, globalAuth }) => {
    
    const handleAuthChange = (change: Partial<Auth>) => {
        onChange({ ...auth, ...change });
    }

    const getGlobalAuthDisplay = () => {
        if (globalAuth.type === 'none') return 'None';
        if (globalAuth.type === 'bearer') return 'Bearer Token';
        return 'Unknown';
    }

    return (
        <div className="p-4 space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Auth Type</label>
                <select 
                    value={auth?.type || 'inherit'}
                    onChange={(e) => handleAuthChange({ type: e.target.value as Auth['type'] })}
                    className="w-full max-w-xs p-2 rounded-md bg-bg-subtle border border-border-default focus:outline-none focus:ring-2 focus:ring-brand"
                >
                    <option value="inherit">Inherit from Global ({getGlobalAuthDisplay()})</option>
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token</option>
                </select>
            </div>
            {auth?.type === 'bearer' && (
                <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Token</label>
                    <input 
                        type="text" 
                        placeholder="Your API token"
                        value={auth.token || ''}
                        onChange={(e) => handleAuthChange({ token: e.target.value })}
                        className="w-full p-2 rounded-md bg-bg-subtle border border-border-default focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                </div>
            )}
             {auth?.type === 'inherit' && globalAuth.type !== 'none' && (
                <div className="text-xs text-text-muted p-2 bg-bg-subtle rounded-md">
                    Currently using global <strong>{getGlobalAuthDisplay()}</strong> authentication. You can change this in Settings.
                </div>
            )}
        </div>
    )
}


const RequestTab: React.FC<{ tab: TabData }> = ({ tab }) => {
    const { state, dispatch } = useContext(WorkspaceContext)!;
    const { request, response, isLoading } = tab;
    const [activeConfigTab, setActiveConfigTab] = useState<RequestConfigTab>('params');
    const [fileObjects, setFileObjects] = useState<Record<string, File | null>>({});
    const [binaryFile, setBinaryFile] = useState<File | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    
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

            const url = new URL(request.url);
            finalQueryParams.forEach(param => url.searchParams.append(param.key, param.value));

            const headers = new Headers();
            finalHeaders.forEach(header => headers.append(header.key, header.value));
            
            if (finalAuth?.type === 'bearer' && finalAuth.token) {
                headers.append('Authorization', `Bearer ${finalAuth.token}`);
            }

            let body: BodyInit | null = null;
            if (![HttpMethod.GET, HttpMethod.HEAD].includes(request.method as HttpMethod)) {
                if (request.body.type === 'raw' && request.body.content) {
                    body = request.body.content;
                    if (!headers.has('Content-Type')) {
                        headers.append('Content-Type', 'application/json');
                    }
                } else if (request.body.type === 'form-data') {
                    const formData = new FormData();
                    request.body.fields.forEach(field => {
                        if (field.enabled && field.key) {
                            if (field.type === 'text') {
                                formData.append(field.key, field.value);
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
                const requestWithStatus = { ...request, status: apiResponse.status };
                dispatch({ type: 'ADD_HISTORY', payload: requestWithStatus });
                
                if (state.settings.aiEnabled && state.settings.geminiApiKey && !state.analyzedRequestsCache.includes(request.id)) {
                    dispatch({ type: 'ADD_TO_ANALYSIS_CACHE', payload: request.id });
                    
                    const thinkingMessage: AiMessage = { id: uuidv4(), type: 'thinking', content: 'Analyzing response...' };
                    dispatch({ type: 'ADD_AI_MESSAGE', payload: thinkingMessage });
                    
                    const analysisResult = await analyzeApiCall(request, apiResponse, state.history, state.settings.geminiApiKey);

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
                    const requestWithStatus = { ...request, status: apiResponse.status };
                    dispatch({ type: 'ADD_HISTORY', payload: requestWithStatus });
                }
            }
        }
    };

    const renderConfigPanel = () => {
        switch (activeConfigTab) {
            case 'params':
                return <KeyValueEditor items={request.queryParams} onChange={(items) => handleRequestChange({ queryParams: items as QueryParam[] })} addLabel="Add Param" />;
            case 'headers':
                return <KeyValueEditor items={request.headers} onChange={(items) => handleRequestChange({ headers: items as Header[] })} addLabel="Add Header" />;
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
                return <AuthEditor 
                            auth={request.auth || { type: 'inherit' }} 
                            onChange={(auth) => handleRequestChange({ auth })}
                            globalAuth={state.settings.globalAuth}
                       />;
            default:
                return null;
        }
    };

    const isHttpProtocol = request.protocol === Protocol.REST || request.protocol === Protocol.GraphQL;

    return (
        <div className="flex flex-col h-full bg-bg-default text-text-default">
            {/* Request URL Bar */}
            <div className="flex-shrink-0 flex flex-wrap items-center p-2 gap-2 border-b border-border-default">
                <div className="flex items-center gap-2 flex-grow-[1] w-full md:w-auto">
                    <select
                        value={request.protocol}
                        onChange={(e) => handleProtocolChange(e.target.value as Protocol)}
                        className="font-mono font-bold text-sm bg-transparent border rounded-md focus:outline-none focus:ring-1 focus:ring-brand pl-3 pr-8 py-2 border-border-default"
                    >
                        {Object.values(Protocol).map(p => <option key={p} value={p} className="bg-bg-subtle font-bold">{p}</option>)}
                    </select>
                    
                    {isHttpProtocol && (
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
                
                <input
                    type="text"
                    value={request.url}
                    onChange={(e) => handleRequestChange({ url: e.target.value })}
                    placeholder={isHttpProtocol ? "https://api.example.com/resource" : "wss://socket.example.com"}
                    className="flex-grow-[999] min-w-[200px] w-full md:w-auto p-2 bg-bg-subtle border border-border-default rounded-md text-sm focus:ring-1 focus:ring-brand focus:outline-none"
                />
                {isHttpProtocol && (
                    <div className="flex items-stretch gap-2 flex-grow-[1] w-full sm:w-auto">
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

            {isHttpProtocol ? (
                <>
                    <div className="flex-shrink-0 flex border-b border-border-default">
                        {(['params', 'headers', 'body', 'auth'] as const).map(tabName => (
                            <button key={tabName} onClick={() => setActiveConfigTab(tabName)} className={`px-4 py-2 text-sm capitalize ${activeConfigTab === tabName ? 'text-brand border-b-2 border-brand -mb-px' : 'text-text-muted'}`}>
                                {tabName}
                            </button>
                        ))}
                    </div>
                    <div className="flex-grow flex flex-col min-h-0">
                        <div className="flex-shrink-0">
                            {renderConfigPanel()}
                        </div>
                        <div className="flex flex-col flex-grow border-t border-border-default min-h-0">
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
                </>
            ) : (
                <WebSocketPanel tab={tab} />
            )}
        </div>
    );
};

export default RequestTab;