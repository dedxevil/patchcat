import React, { useContext, useRef, useEffect, useState } from 'react';
import { WorkspaceContext } from '../App';
import { TabData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PlugIcon, SendIcon, TrashIcon } from './icons';
import Tooltip from './Tooltip';

interface WebSocketPanelProps {
    tab: TabData;
}

const WebSocketPanel: React.FC<WebSocketPanelProps> = ({ tab }) => {
    const { dispatch } = useContext(WorkspaceContext)!;
    const ws = useRef<WebSocket | null>(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'text' | 'binary'>('text');
    const [binaryFile, setBinaryFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { wsStatus, wsMessages, request: { url } } = tab;
    const isConnected = wsStatus === 'connected';

    useEffect(() => {
        // Cleanup on component unmount or tab change
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [tab.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [wsMessages]);

    const addSystemMessage = (content: string) => {
        dispatch({ type: 'ADD_WS_MESSAGE', payload: { tabId: tab.id, message: { id: uuidv4(), direction: 'system', content, timestamp: Date.now() } } });
    }

    const handleConnect = () => {
        if (!url || !url.startsWith('ws')) {
            addSystemMessage('Error: Invalid WebSocket URL. Must start with ws:// or wss://');
            return;
        }

        dispatch({ type: 'SET_WS_STATUS', payload: { tabId: tab.id, status: 'connecting' } });
        addSystemMessage(`Connecting to ${url}...`);

        ws.current = new WebSocket(url);
        ws.current.binaryType = 'blob'; // Receive binary data as a Blob

        ws.current.onopen = () => {
            dispatch({ type: 'SET_WS_STATUS', payload: { tabId: tab.id, status: 'connected' } });
            addSystemMessage('Connection established.');
        };

        ws.current.onmessage = (event) => {
            let content: string;
            // Check if data is Blob or ArrayBuffer for binary messages
            if (event.data instanceof Blob) {
                content = `[Binary data received (${event.data.size} bytes)]`;
            } else {
                // Assume text for anything else
                content = event.data.toString();
            }
            dispatch({ type: 'ADD_WS_MESSAGE', payload: { tabId: tab.id, message: { id: uuidv4(), direction: 'received', content, timestamp: Date.now() } } });
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket Error:', error);
            addSystemMessage('An error occurred with the connection.');
        };

        ws.current.onclose = (event) => {
            dispatch({ type: 'SET_WS_STATUS', payload: { tabId: tab.id, status: 'disconnected' } });
            addSystemMessage(`Connection closed. Code: ${event.code}. Reason: ${event.reason || 'No reason specified'}`);
            ws.current = null;
        };
    };

    const handleDisconnect = () => {
        if (ws.current) {
            ws.current.close();
        }
    };

    const handleSendMessage = () => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

        if (messageType === 'text' && message.trim()) {
            ws.current.send(message);
            dispatch({ type: 'ADD_WS_MESSAGE', payload: { tabId: tab.id, message: { id: uuidv4(), direction: 'sent', content: message, timestamp: Date.now() } } });
            setMessage('');
        } else if (messageType === 'binary' && binaryFile) {
            ws.current.send(binaryFile); // WebSocket.send can take a Blob/File directly
            const content = `[Binary data sent: ${binaryFile.name} (${binaryFile.size} bytes)]`;
            dispatch({ type: 'ADD_WS_MESSAGE', payload: { tabId: tab.id, message: { id: uuidv4(), direction: 'sent', content, timestamp: Date.now() } } });
            setBinaryFile(null);
        }
    };

    const handleMessageTypeChange = (type: 'text' | 'binary') => {
        setMessageType(type);
        if (type === 'text') {
            setBinaryFile(null);
        } else {
            setMessage('');
        }
    }
    
    const handleClearLog = () => {
        if (window.confirm('Are you sure you want to clear the message log?')) {
            dispatch({ type: 'CLEAR_WS_MESSAGES', payload: tab.id });
        }
    };

    const getStatusIndicator = () => {
        switch (wsStatus) {
            case 'connected': return { text: 'CONNECTED', className: 'bg-success/20 text-success' };
            case 'connecting': return { text: 'CONNECTING', className: 'bg-warning/20 text-warning animate-pulse' };
            case 'disconnected':
            default: return { text: 'DISCONNECTED', className: 'bg-danger/20 text-danger' };
        }
    };

    return (
        <div className="flex flex-col h-full bg-bg-default">
            {/* Top Bar with Connect button and Status */}
            <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-border-default">
                <div className="flex items-center gap-2">
                    <button
                        onClick={isConnected ? handleDisconnect : handleConnect}
                        className={`flex items-center gap-2 px-4 py-2 text-white rounded-md font-semibold text-sm ${isConnected ? 'bg-danger hover:bg-danger-hover' : 'bg-brand hover:bg-brand-hover'}`}
                    >
                        <PlugIcon className="w-4 h-4" />
                        {isConnected ? 'Disconnect' : 'Connect'}
                    </button>
                    <div className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusIndicator().className}`}>
                        {getStatusIndicator().text}
                    </div>
                </div>
                {wsMessages && wsMessages.length > 0 && (
                    <Tooltip text="Clear message log">
                        <button onClick={handleClearLog} className="p-2 text-text-muted hover:text-danger rounded-md">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </Tooltip>
                )}
            </div>

            {/* Message Log */}
            <div className="flex-grow min-h-0 p-4 overflow-y-auto space-y-3">
                {wsMessages?.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${
                        msg.direction === 'sent' ? 'items-end' : 
                        msg.direction === 'received' ? 'items-start' : 'items-center'
                    }`}>
                        <div className={`max-w-xl p-3 rounded-lg ${
                            msg.direction === 'sent' ? 'bg-brand/20' :
                            msg.direction === 'received' ? 'bg-bg-muted' :
                            'bg-transparent text-text-subtle text-xs'
                        }`}>
                            <p className="whitespace-pre-wrap break-all text-sm">{msg.content}</p>
                        </div>
                        <span className="text-xs text-text-subtle mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex-shrink-0 p-2 border-t border-border-default space-y-2">
                 <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            value="text"
                            checked={messageType === 'text'}
                            onChange={() => handleMessageTypeChange('text')}
                            className="mr-1.5 form-radio text-brand bg-bg-muted border-border-default focus:ring-brand"
                            disabled={!isConnected}
                        />
                        Text
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            value="binary"
                            checked={messageType === 'binary'}
                            onChange={() => handleMessageTypeChange('binary')}
                            className="mr-1.5 form-radio text-brand bg-bg-muted border-border-default focus:ring-brand"
                            disabled={!isConnected}
                        />
                        Binary (File)
                    </label>
                </div>
                <div className="flex items-center gap-2">
                     {messageType === 'text' ? (
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={isConnected ? 'Type your message...' : 'Connect to send messages'}
                            disabled={!isConnected}
                            className="flex-grow p-2 bg-bg-subtle border border-border-default rounded-md text-sm focus:ring-1 focus:ring-brand focus:outline-none disabled:opacity-50"
                        />
                     ) : (
                        <div className="flex-grow">
                            <label className={`flex items-center w-full bg-bg-subtle border border-border-default rounded-md px-3 py-2 text-text-muted  ${isConnected ? 'cursor-pointer hover:bg-bg-muted' : 'opacity-50'}`}>
                                <span className="truncate flex-grow">{binaryFile?.name || 'Choose a file to send'}</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => setBinaryFile(e.target.files ? e.target.files[0] : null)}
                                    disabled={!isConnected}
                                />
                            </label>
                        </div>
                     )}
                    <button
                        onClick={handleSendMessage}
                        disabled={!isConnected || (messageType === 'text' && !message.trim()) || (messageType === 'binary' && !binaryFile)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-md font-semibold text-sm hover:bg-brand-hover disabled:bg-brand/50 disabled:cursor-not-allowed"
                    >
                        <SendIcon className="w-4 h-4" />
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WebSocketPanel;
