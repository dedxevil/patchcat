import React, { useContext, useEffect, useRef, useState } from 'react';
import { WorkspaceContext } from '../App';
import { TabData } from '../types';
import ResponsePanel from './ResponsePanel';
import SchemaExplorer from './SchemaExplorer';
import { fetchGqlSchema } from '../utils/gql';
import { resolveVariables } from '../utils/variables';
import { SparklesIcon, SearchIcon } from './icons';

interface GraphQLPanelProps {
    tab: TabData;
}

const GraphQLPanel: React.FC<GraphQLPanelProps> = ({ tab }) => {
    const { state, dispatch } = useContext(WorkspaceContext)!;
    const { request, response, isLoading, gqlSchema, gqlSchemaLoading, gqlSchemaError, gqlVariables } = tab;
    const query = request.body.type === 'raw' ? request.body.content : '';
    const [schemaSearchTerm, setSchemaSearchTerm] = useState('');

    // State for resizable panel
    const [editorPanelHeight, setEditorPanelHeight] = useState(250);
    const isResizingRef = useRef(false);
    const graphQlContainerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        isResizingRef.current = true;
        document.body.style.userSelect = 'none'; // Prevent text selection
        e.preventDefault();
    };

     useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current || !graphQlContainerRef.current) return;
            const containerRect = graphQlContainerRef.current.getBoundingClientRect();
            const newHeight = e.clientY - containerRect.top;

            const minHeight = 150; // Min height for editor panel
            const maxHeight = containerRect.height - 200; // Min height for response panel

            if (newHeight >= minHeight && newHeight <= maxHeight) {
                setEditorPanelHeight(newHeight);
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

    const handleQueryChange = (newQuery: string) => {
        dispatch({
            type: 'UPDATE_REQUEST',
            payload: { tabId: tab.id, request: { ...request, body: { type: 'raw', content: newQuery } } },
        });
    };
    
    const handleVariablesChange = (newVariables: string) => {
        dispatch({ type: 'UPDATE_GQL_VARIABLES', payload: { tabId: tab.id, variables: newVariables } });
    };

    const handleFetchSchema = async () => {
        dispatch({ type: 'SET_GQL_SCHEMA_STATE', payload: { tabId: tab.id, isLoading: true, error: undefined, schema: undefined } });
        try {
            const activeEnvironment = state.settings.environments.find(e => e.id === state.settings.activeEnvironmentId);
            const { resolvedText: resolvedUrl } = resolveVariables(request.url, activeEnvironment);
            
            const schema = await fetchGqlSchema(resolvedUrl);
            dispatch({ type: 'SET_GQL_SCHEMA_STATE', payload: { tabId: tab.id, schema, isLoading: false } });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            dispatch({ type: 'SET_GQL_SCHEMA_STATE', payload: { tabId: tab.id, isLoading: false, error: errorMessage } });
        }
    };

    // Auto-fetch schema when URL changes and it's not the default placeholder
    useEffect(() => {
        if (request.url && request.url !== '[gql_host]') {
            handleFetchSchema();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [request.url, tab.id]);

    const handleSelectField = (operation: string) => {
        handleQueryChange(operation);
    };

    return (
        <div className="flex h-full">
            {/* Schema Explorer */}
            <div className="w-1/4 min-w-[250px] border-r border-border-default flex flex-col">
                <div className="p-2 border-b border-border-default flex-shrink-0">
                    <button onClick={handleFetchSchema} disabled={gqlSchemaLoading} className="w-full px-2 py-1 text-sm bg-bg-muted hover:bg-border-default rounded-md disabled:opacity-50">
                        {gqlSchemaLoading ? 'Loading Schema...' : 'Refresh Schema'}
                    </button>
                    <div className="relative mt-2">
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search schema..."
                            value={schemaSearchTerm}
                            onChange={(e) => setSchemaSearchTerm(e.target.value)}
                            className="w-full bg-bg-default border border-border-default rounded-md pl-8 pr-2 py-1 text-sm focus:ring-1 focus:ring-brand focus:outline-none"
                        />
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {gqlSchemaLoading && <p className="p-4 text-xs text-text-muted">Loading...</p>}
                    {gqlSchemaError && <p className="p-4 text-xs text-danger">Error: {gqlSchemaError}</p>}
                    {gqlSchema && <SchemaExplorer schema={gqlSchema} onSelectField={handleSelectField} searchTerm={schemaSearchTerm} />}
                    {!gqlSchema && !gqlSchemaLoading && !gqlSchemaError && <div className="p-4 text-xs text-text-muted">Enter a valid GraphQL endpoint URL and click 'Refresh Schema' to explore.</div>}
                </div>
            </div>

            {/* Main Editors and Response */}
            <div className="w-3/4 flex flex-col min-h-0" ref={graphQlContainerRef}>
                {/* Top: Editor panels (Resizable) */}
                <div style={{ height: `${editorPanelHeight}px` }} className="flex flex-shrink-0">
                    {/* Query Editor */}
                    <div className="w-2/3 p-2 flex flex-col border-r border-border-default">
                         <label className="text-xs font-semibold text-text-muted mb-1">QUERY</label>
                        <textarea
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            placeholder="query MyQuery { ... }"
                            className="flex-grow w-full font-mono text-sm bg-bg-subtle border border-border-default rounded-md p-2 focus:ring-1 focus:ring-brand focus:outline-none resize-none"
                        />
                    </div>
                    {/* Variables Editor */}
                    <div className="w-1/3 p-2 flex flex-col">
                        <label className="text-xs font-semibold text-text-muted mb-1">VARIABLES</label>
                        <textarea
                            value={gqlVariables || ''}
                            onChange={(e) => handleVariablesChange(e.target.value)}
                            placeholder='{ "id": 1 }'
                            className="flex-grow w-full font-mono text-sm bg-bg-subtle border border-border-default rounded-md p-2 focus:ring-1 focus:ring-brand focus:outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Draggable Splitter */}
                <div
                    onMouseDown={handleMouseDown}
                    className="h-1.5 w-full cursor-row-resize bg-bg-subtle hover:bg-border-strong transition-colors flex-shrink-0 border-t border-b border-border-default"
                    aria-label="Resize editor panel"
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
        </div>
    );
};

export default GraphQLPanel;