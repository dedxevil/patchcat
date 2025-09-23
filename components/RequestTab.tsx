

import React, { useContext, useState } from 'react';
import { WorkspaceContext } from '../App';
import { TabData, HttpMethod, Header, QueryParam, Body, FormDataField, ApiResponse, ApiRequest } from '../types';
import ResponsePanel from './ResponsePanel';
import { SendIcon, SparklesIcon, TrashIcon, PlusIcon } from './icons';
import { v4 as uuidv4 } from 'uuid';
import { analyzeApiCall } from '../services/geminiService';

// Helper to get content type for raw body
const getContentType = (content: string) => {
    try {
        JSON.parse(content);
        return 'application/json';
    } catch (e) {
        return 'text/plain';
    }
};

// Simple hashing function to create a key for caching
const createAnalysisCacheKey = (request: ApiRequest, response: ApiResponse): string => {
    const requestKey = `${request.method}-${request.url}-${JSON.stringify(request.body)}`;
    const responseKey = `${response.status}-${JSON.stringify(response.data)}`;
    return requestKey + responseKey;
};


interface RequestTabProps {
  tab: TabData;
}

const RequestTab: React.FC<RequestTabProps> = ({ tab }) => {
  const { state, dispatch } = useContext(WorkspaceContext)!;
  const { request, response, isLoading } = tab;
  
  // Local state for file inputs in form-data, since File objects can't be stored in global state.
  const [fileInputs, setFileInputs] = useState<Record<string, File | null>>({});

  const [activeRequestTab, setActiveRequestTab] = useState<'params' | 'auth' | 'headers' | 'body'>('params');

  const updateRequest = (change: Partial<typeof request>) => {
    dispatch({ type: 'UPDATE_REQUEST', payload: { tabId: tab.id, request: change } });
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'UPDATE_TAB_NAME', payload: { tabId: tab.id, name: e.target.value } });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateRequest({ url: e.target.value });
  };
  
  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateRequest({ method: e.target.value as HttpMethod });
  };
  
  // Generic handler for key-value pair arrays (headers, queryParams)
  const handleKeyValuePairChange = (
    type: 'headers' | 'queryParams',
    index: number,
    field: 'key' | 'value' | 'enabled',
    value: string | boolean
  ) => {
    const items = [...request[type]];
    (items[index] as any)[field] = value;
    updateRequest({ [type]: items });
  };
  
  const addKeyValuePair = (type: 'headers' | 'queryParams') => {
    const newItem = { id: uuidv4(), key: '', value: '', enabled: true };
    updateRequest({ [type]: [...request[type], newItem] });
  };
  
  const removeKeyValuePair = (type: 'headers' | 'queryParams', index: number) => {
    const items = request[type].filter((_, i) => i !== index);
    updateRequest({ [type]: items });
  };
  
  // Body handlers
  const handleBodyTypeChange = (type: Body['type']) => {
    if (type === 'raw') {
        updateRequest({ body: { type: 'raw', content: '' } });
    } else if (type === 'form-data') {
        updateRequest({ body: { type: 'form-data', fields: [] } });
    } else if (type === 'binary') {
        updateRequest({ body: { type: 'binary' } });
        setFileInputs({ ...fileInputs, binary_file: null });
    }
  };

  const handleRawBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (request.body.type === 'raw') {
        updateRequest({ body: { ...request.body, content: e.target.value } });
    }
  };

  const handleFormDataChange = (index: number, field: keyof FormDataField, value: string) => {
      if (request.body.type === 'form-data') {
          const newFields = [...request.body.fields];
          (newFields[index] as any)[field] = value;
          updateRequest({ body: { ...request.body, fields: newFields } });
      }
  };

  const handleFormDataFileChange = (id: string, file: File | null) => {
      setFileInputs(prev => ({ ...prev, [id]: file }));
  };

  const addFormDataField = () => {
      if (request.body.type === 'form-data') {
          const newField: FormDataField = { id: uuidv4(), key: '', value: '', type: 'text', enabled: true };
          updateRequest({ body: { ...request.body, fields: [...request.body.fields, newField] } });
      }
  };

  const removeFormDataField = (index: number) => {
    if (request.body.type === 'form-data') {
        const fieldId = request.body.fields[index].id;
        const newFields = request.body.fields.filter((_, i) => i !== index);
        updateRequest({ body: { ...request.body, fields: newFields } });
        const newFileInputs = { ...fileInputs };
        delete newFileInputs[fieldId];
        setFileInputs(newFileInputs);
    }
  };

  const handleBinaryFileChange = (file: File | null) => {
    setFileInputs({ ...fileInputs, binary_file: file });
  };

  const handleSendRequest = async () => {
    dispatch({ type: 'SET_LOADING', payload: { tabId: tab.id, isLoading: true } });
    
    const startTime = Date.now();
    
    // Construct headers
    const headers = new Headers();
    request.headers.forEach(h => {
        if (h.enabled && h.key) {
            headers.append(h.key, h.value);
        }
    });

    if (request.auth?.type === 'bearer' && request.auth.token) {
        headers.append('Authorization', `Bearer ${request.auth.token}`);
    }

    // Construct URL with query params
    const url = new URL(request.url);
    request.queryParams.forEach(p => {
        if (p.enabled && p.key) {
            url.searchParams.append(p.key, p.value);
        }
    });

    // Construct body
    let body: BodyInit | null = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        if (request.body.type === 'raw') {
            body = request.body.content;
            if (!headers.has('Content-Type') && request.body.content) {
                headers.append('Content-Type', getContentType(request.body.content));
            }
        } else if (request.body.type === 'form-data') {
            const formData = new FormData();
            request.body.fields.forEach(field => {
                if (field.enabled && field.key) {
                    if (field.type === 'text') {
                        formData.append(field.key, field.value);
                    } else if (field.type === 'file' && fileInputs[field.id]) {
                        formData.append(field.key, fileInputs[field.id]!);
                    }
                }
            });
            body = formData;
            // Browser will set Content-Type for FormData automatically
        } else if (request.body.type === 'binary') {
            body = fileInputs['binary_file'] || null;
        }
    }

    try {
        const response = await fetch(url.toString(), {
            method: request.method,
            headers,
            body,
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });
        
        const rawResponse = await response.text();
        const responseSize = new Blob([rawResponse]).size;
        
        let responseData: any;
        try {
            responseData = JSON.parse(rawResponse);
        } catch (e) {
            responseData = rawResponse;
        }

        const apiResponse: ApiResponse = {
            status: response.status,
            statusText: response.statusText,
            time: responseTime,
            size: responseSize,
            data: responseData,
            headers: responseHeaders,
        };
        
        dispatch({ type: 'SET_RESPONSE', payload: { tabId: tab.id, response: apiResponse } });
        dispatch({ type: 'ADD_HISTORY', payload: request });
        
        // Trigger AI analysis if enabled
        if (state.settings.aiEnabled) {
            const cacheKey = createAnalysisCacheKey(request, apiResponse);
            if (state.analyzedRequestsCache.includes(cacheKey)) {
                dispatch({
                    type: 'ADD_AI_MESSAGE',
                    payload: { id: uuidv4(), type: 'info', content: "This response has already been analyzed." }
                });
                return;
            }

            dispatch({ type: 'ADD_TO_ANALYSIS_CACHE', payload: cacheKey });
            dispatch({ type: 'ADD_AI_MESSAGE', payload: { id: uuidv4(), type: 'thinking', content: 'Analyzing response...' } });
            
            const suggestions = await analyzeApiCall(request, apiResponse, state.history);
            if (suggestions && suggestions.length > 0) {
                dispatch({
                    type: 'ADD_AI_MESSAGE',
                    payload: {
                        id: uuidv4(),
                        type: 'suggestion',
                        content: "Here are some suggestions for your next test:",
                        suggestions: suggestions,
                    }
                });
            } else if (suggestions) { // suggestions is not null, but empty
                dispatch({
                    type: 'ADD_AI_MESSAGE',
                    payload: {
                        id: uuidv4(),
                        type: 'info',
                        content: "Looks good! I don't have any specific suggestions right now.",
                    }
                });
            } else { // suggestions is null (error)
                 dispatch({
                    type: 'ADD_AI_MESSAGE',
                    payload: {
                        id: uuidv4(),
                        type: 'error',
                        content: "Sorry, I couldn't analyze the response.",
                    }
                });
            }
        }

    } catch (error: any) {
        const endTime = Date.now();
        const apiResponse: ApiResponse = {
            status: 0,
            statusText: 'Network Error',
            time: endTime - startTime,
            size: 0,
            data: { error: error.message },
            headers: {},
        };
        dispatch({ type: 'SET_RESPONSE', payload: { tabId: tab.id, response: apiResponse } });
        if (state.settings.aiEnabled) {
            dispatch({ type: 'ADD_AI_MESSAGE', payload: { id: uuidv4(), type: 'error', content: `Network request failed: ${error.message}` } });
        }
    }
  };

  const renderKeyValueEditor = (type: 'headers' | 'queryParams') => {
    const items = request[type];
    return (
        <div className="space-y-2 p-4">
            {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 flex items-center justify-center">
                        <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-brand bg-bg-subtle border-border-default rounded focus:ring-brand"
                            checked={item.enabled}
                            onChange={(e) => handleKeyValuePairChange(type, index, 'enabled', e.target.checked)}
                        />
                    </div>
                    <input
                        type="text"
                        placeholder="Key"
                        className="col-span-5 bg-bg-subtle border border-border-default rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-brand focus:outline-none"
                        value={item.key}
                        onChange={(e) => handleKeyValuePairChange(type, index, 'key', e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Value"
                        className="col-span-5 bg-bg-subtle border border-border-default rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-brand focus:outline-none"
                        value={item.value}
                        onChange={(e) => handleKeyValuePairChange(type, index, 'value', e.target.value)}
                    />
                    <button onClick={() => removeKeyValuePair(type, index)} className="col-span-1 text-text-muted hover:text-danger p-1">
                        <TrashIcon />
                    </button>
                </div>
            ))}
            <button
                onClick={() => addKeyValuePair(type)}
                className="flex items-center gap-2 text-sm text-brand font-semibold hover:text-brand-hover"
            >
                <PlusIcon /> Add {type === 'headers' ? 'Header' : 'Parameter'}
            </button>
        </div>
    );
  };

  const renderBodyEditor = () => {
      return (
          <div className="p-4">
              <div className="flex items-center gap-4 mb-4">
                  {(['raw', 'form-data', 'binary'] as const).map(type => (
                    <button key={type} onClick={() => handleBodyTypeChange(type)} className={`px-2 py-1 text-sm rounded-md ${request.body.type === type ? 'bg-brand text-white' : 'bg-bg-muted hover:bg-border-default'}`}>
                        {type}
                    </button>
                  ))}
              </div>
              {request.body.type === 'raw' && (
                  <textarea
                      className="w-full h-48 p-2 font-mono text-sm bg-bg-subtle border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
                      value={request.body.content}
                      onChange={handleRawBodyChange}
                      placeholder='Enter raw body content...'
                  />
              )}
              {request.body.type === 'form-data' && (
                  <div className="space-y-2">
                      {request.body.fields.map((field, index) => (
                          <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                               <div className="col-span-1 flex items-center justify-center">
                                    <input type="checkbox" checked={field.enabled} onChange={(e) => handleFormDataChange(index, 'enabled', e.target.checked as any)} className="form-checkbox h-4 w-4 text-brand bg-bg-subtle border-border-default rounded focus:ring-brand" />
                               </div>
                               <input type="text" placeholder="Key" value={field.key} onChange={(e) => handleFormDataChange(index, 'key', e.target.value)} className="col-span-4 bg-bg-subtle border border-border-default rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-brand focus:outline-none" />
                               {field.type === 'text' ? (
                                   <input type="text" placeholder="Value" value={field.value} onChange={(e) => handleFormDataChange(index, 'value', e.target.value)} className="col-span-4 bg-bg-subtle border border-border-default rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-brand focus:outline-none" />
                               ) : (
                                   <input type="file" onChange={(e) => handleFormDataFileChange(field.id, e.target.files ? e.target.files[0] : null)} className="col-span-4 text-sm file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand/20 file:text-brand hover:file:bg-brand/30"/>
                               )}
                               <select value={field.type} onChange={(e) => handleFormDataChange(index, 'type', e.target.value)} className="col-span-2 bg-bg-subtle border border-border-default rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-brand focus:outline-none">
                                   <option value="text">Text</option>
                                   <option value="file">File</option>
                               </select>
                               <button onClick={() => removeFormDataField(index)} className="col-span-1 text-text-muted hover:text-danger p-1">
                                   <TrashIcon />
                               </button>
                          </div>
                      ))}
                      <button onClick={addFormDataField} className="flex items-center gap-2 text-sm text-brand font-semibold hover:text-brand-hover">
                          <PlusIcon /> Add Field
                      </button>
                  </div>
              )}
              {request.body.type === 'binary' && (
                  <div>
                      <input type="file" onChange={(e) => handleBinaryFileChange(e.target.files ? e.target.files[0] : null)} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand/20 file:text-brand hover:file:bg-brand/30"/>
                      {fileInputs['binary_file'] && <p className="text-xs text-text-muted mt-2">Selected: {fileInputs['binary_file'].name}</p>}
                  </div>
              )}
          </div>
      )
  };

  const renderAuthEditor = () => {
    return (
        <div className="p-4 space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Auth Type</label>
                <select 
                    value={request.auth?.type || 'none'}
                    onChange={(e) => updateRequest({ auth: { ...request.auth, type: e.target.value as 'none' | 'bearer' }})}
                    className="w-full max-w-xs p-2 rounded-md bg-bg-subtle border border-border-default focus:outline-none focus:ring-2 focus:ring-brand"
                >
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token</option>
                </select>
            </div>
            {request.auth?.type === 'bearer' && (
                <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Token</label>
                    <input 
                        type="text" 
                        placeholder="Your API token"
                        value={request.auth.token || ''}
                        onChange={(e) => updateRequest({ auth: { ...request.auth, token: e.target.value }})}
                        className="w-full p-2 rounded-md bg-bg-subtle border border-border-default focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                </div>
            )}
        </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
       {/* Tab Name and URL Bar */}
      <div className="p-4 flex flex-col gap-2 border-b border-border-default">
         <input
          type="text"
          className="w-full bg-transparent text-lg font-semibold focus:outline-none focus:bg-bg-subtle p-1 rounded-md"
          placeholder="Request Name"
          value={tab.name}
          onChange={handleNameChange}
        />
        <div className="flex items-center gap-2">
            <select value={request.method} onChange={handleMethodChange} className="p-2 rounded-md bg-bg-subtle border border-border-default font-semibold focus:outline-none focus:ring-2 focus:ring-brand">
            {Object.values(HttpMethod).map(method => (
                <option key={method} value={method}>{method}</option>
            ))}
            </select>
            <input
            type="text"
            className="flex-grow p-2 rounded-md bg-bg-subtle border border-border-default focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="https://api.example.com/data"
            value={request.url}
            onChange={handleUrlChange}
            />
            <button 
            onClick={handleSendRequest} 
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-brand text-white font-semibold hover:bg-brand-hover disabled:bg-bg-muted disabled:text-text-muted disabled:cursor-not-allowed"
            >
            {isLoading ? (
                <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
                </>
            ) : (
                <>
                <SendIcon />
                <span>Send</span>
                </>
            )}
            </button>
        </div>
      </div>
      
      {/* Request Config Tabs */}
      <div className="flex-shrink-0 flex border-b border-border-default bg-bg-subtle">
        {(['params', 'auth', 'headers', 'body'] as const).map(tabName => (
            <button key={tabName} onClick={() => setActiveRequestTab(tabName)} className={`px-4 py-2 text-sm capitalize ${activeRequestTab === tabName ? 'text-brand border-b-2 border-brand bg-bg-default -mb-px' : 'text-text-muted hover:bg-bg-muted'}`}>
                {tabName}
            </button>
        ))}
      </div>

      <div className="flex-grow grid grid-rows-2 min-h-0">
        
        {/* Top Pane: Request Config Editors */}
        <div className="overflow-y-auto min-h-0 bg-bg-default">
            {activeRequestTab === 'params' && renderKeyValueEditor('queryParams')}
            {activeRequestTab === 'auth' && renderAuthEditor()}
            {activeRequestTab === 'headers' && renderKeyValueEditor('headers')}
            {activeRequestTab === 'body' && renderBodyEditor()}
        </div>

        {/* Bottom Pane: Response Area */}
        <div className="border-t border-border-default flex flex-col min-h-0 bg-bg-default">
            {isLoading && !response && (
                <div className="flex items-center justify-center h-full text-text-muted">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand"></div>
                    <p className="ml-4">Sending your request...</p>
                </div>
            )}
            {response && <ResponsePanel response={response} />}
            {!response && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-muted p-4">
                    <SparklesIcon className="w-10 h-10 mb-2" />
                    <p className="font-semibold">Send a request to see the response here</p>
                    <p className="text-sm">The AI assistant will also provide suggestions based on the response.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default RequestTab;