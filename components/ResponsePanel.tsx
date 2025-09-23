
import React, { useState } from 'react';
import { ApiResponse } from '../types';
import SyntaxHighlighter from './SyntaxHighlighter';
import { CopyIcon, SearchIcon } from './icons';

interface ResponsePanelProps {
  response: ApiResponse;
}

type Tab = 'body' | 'headers';

const ResponsePanel: React.FC<ResponsePanelProps> = ({ response }) => {
  const [activeTab, setActiveTab] = useState<Tab>('body');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const getStatusClass = () => {
    if (response.status >= 200 && response.status < 300) return 'text-success';
    if (response.status >= 400) return 'text-danger';
    return 'text-warning';
  };
  
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  const handleCopy = () => {
    const contentToCopy = typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data);
    navigator.clipboard.writeText(contentToCopy).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => console.error("Failed to copy text: ", err));
  };


  return (
    <div className="p-4 flex-grow flex flex-col min-h-0">
      <div className="flex items-center gap-4 mb-4 text-sm flex-shrink-0">
        <span className="font-semibold">Status: <span className={getStatusClass()}>{response.status} {response.statusText}</span></span>
        <span className="font-semibold">Time: <span className="text-text-default font-normal">{response.time} ms</span></span>
        <span className="font-semibold">Size: <span className="text-text-default font-normal">{formatSize(response.size)}</span></span>
      </div>
      
      <div className="flex justify-between items-center border-b border-border-default flex-shrink-0">
        <div className="flex">
            <button 
            onClick={() => setActiveTab('body')} 
            className={`px-4 py-2 text-sm ${activeTab === 'body' ? 'text-brand border-b-2 border-brand -mb-px' : 'text-text-muted'}`}
            >
            Body
            </button>
            <button 
            onClick={() => setActiveTab('headers')} 
            className={`px-4 py-2 text-sm ${activeTab === 'headers' ? 'text-brand border-b-2 border-brand -mb-px' : 'text-text-muted'}`}
            >
            Headers ({Object.keys(response.headers).length})
            </button>
        </div>
        {activeTab === 'body' && (
            <div className="flex items-center gap-2 pr-2">
                <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-40 bg-bg-subtle border border-border-default rounded-md pl-8 pr-2 py-1 text-sm focus:ring-1 focus:ring-brand focus:outline-none"
                    />
                </div>
                <button 
                    onClick={handleCopy} 
                    className="flex items-center gap-1.5 text-sm p-1.5 rounded-md hover:bg-bg-muted text-text-muted hover:text-text-default transition-colors"
                >
                    <CopyIcon className="w-4 h-4" />
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
        )}
      </div>
      
      <div className="flex-grow pt-4 overflow-auto">
        {activeTab === 'body' && (
          <SyntaxHighlighter language="json" searchTerm={searchTerm}>
            {typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data)}
          </SyntaxHighlighter>
        )}
        {activeTab === 'headers' && (
          <div className="space-y-1 text-sm">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-text-muted truncate">{key}</span>
                <span className="col-span-2 text-text-default break-all">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsePanel;
