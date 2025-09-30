import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { WorkspaceContext } from '../App';
import { TabData } from '../types';
import { fetchGqlSchema } from '../utils/gql';
import SchemaExplorer from './SchemaExplorer';
import ResponsePanel from './ResponsePanel';

interface GraphQLPanelProps {
    tab: TabData;
}

const GraphQLPanel: React.FC<GraphQLPanelProps> = ({ tab }) => {
    const { dispatch } = useContext(WorkspaceContext)!;
    const { request, response, isLoading, gqlSchema, gqlSchemaError, gqlSchemaLoading, gqlVariables } = tab;
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const isResizing = useRef(false);

    useEffect(() => {
        const fetchSchema = async () => {
            if (!request.url) return;
            dispatch({ type: 'SET_GQL_SCHEMA_STATE', payload: { tabId: tab.id, isLoading: true, error: undefined } });
            try {
                const schema = await fetchGqlSchema(request.url);
                dispatch({ type: 'SET_GQL_SCHEMA_STATE', payload: { tabId: tab.id, schema, isLoading: false } });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                dispatch({ type: 'SET_GQL_SCHEMA_STATE', payload: { tabId: tab.id, error: errorMessage, isLoading: false } });
            }
        };
        fetchSchema();
    }, [request.url, tab.id, dispatch]);

    const handleSelectField = (operation: string) => {
        dispatch({ type: 'UPDATE_REQUEST', payload: { tabId: tab.id, request: { ...request, body: { type: 'raw', content: operation } } } });
    };

    const handleBodyChange = (content: string) => {
        dispatch({ type: 'UPDATE_REQUEST', payload: { tabId: tab.id, request: { ...request, body: { type: 'raw', content } } } });
    };

    const handleVariablesChange = (variables: string) => {
        dispatch({ type: 'UPDATE_GQL_VARIABLES', payload: { tabId: tab.id, variables } });
    };

    // --- Resizer Logic ---
    const startResizing = useCallback((e: React.MouseEvent) => {
        isResizing.current = true;
    }, []);

    const stopResizing = useCallback(() => {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing.current) {
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            setSidebarWidth(prev => {
                const newWidth = e.clientX;
                if (newWidth > 200 && newWidth < 500) { // Min/max width
                    return newWidth;
                }
                return prev;
            });
        }
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    return (
        <div className="flex h-full">
            {/* Schema Sidebar */}
            <div className="flex-shrink-0 h-full bg-bg-subtle flex flex-col" style={{ width: sidebarWidth }}>
                <div className="p-2 border-b border-border-default font-semibold text-sm flex-shrink-0">Schema</div>
                <div className="flex-grow overflow-y-auto min-h-0">
                    {gqlSchemaLoading && <div className="p-4 text-xs text-text-muted">Loading schema...</div>}
                    {gqlSchemaError && <div className="p-4 text-xs text-danger">{gqlSchemaError}</div>}
                    {gqlSchema && <SchemaExplorer schema={gqlSchema} onSelectField={handleSelectField} />}
                </div>
            </div>

            {/* Resizer */}
            <div
                className="w-1.5 cursor-col-resize hover:bg-brand/50 flex-shrink-0 transition-colors"
                onMouseDown={startResizing}
            />

            {/* Main Content */}
            <div className="flex-grow flex flex-col min-w-0">
                {/* Editors Panel */}
                <div className="flex flex-col h-1/2 min-h-[200px]">
                    <div className="flex h-full">
                        <div className="w-1/2 flex flex-col border-r border-border-default">
                            <div className="p-2 border-b border-border-default font-semibold text-sm">Operation</div>
                            <textarea
                                value={request.body.type === 'raw' ? request.body.content : ''}
                                onChange={e => handleBodyChange(e.target.value)}
                                placeholder="query MyQuery { ... }"
                                className="w-full h-full font-mono text-sm bg-bg-default p-2 focus:outline-none resize-none"
                            />
                        </div>
                        <div className="w-1/2 flex flex-col">
                            <div className="p-2 border-b border-border-default font-semibold text-sm">Variables</div>
                             <textarea
                                value={gqlVariables || ''}
                                onChange={e => handleVariablesChange(e.target.value)}
                                placeholder='{ "id": "1" }'
                                className="w-full h-full font-mono text-sm bg-bg-default p-2 focus:outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Response Panel */}
                <div className="flex flex-col flex-shrink-0 border-t border-border-strong h-1/2 min-h-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-text-muted">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand"></div>
                            <span className="ml-4">Loading...</span>
                        </div>
                    ) : response ? (
                        <ResponsePanel response={response} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-text-muted">
                            Click 'Send' to see the response.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GraphQLPanel;