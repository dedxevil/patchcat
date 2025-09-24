import React, { useContext, useRef, useState } from 'react';
import { WorkspaceContext } from '../App';
import { Theme, AppFont, Auth, Header, QueryParam } from '../types';
import { THEME_CLASSES, APP_FONTS } from '../constants';
import { exportWorkspace, importWorkspace } from '../utils/exportImport';
import { CloseIcon, PlusIcon, TrashIcon, EyeIcon, EyeOffIcon } from './icons';
import { v4 as uuidv4 } from 'uuid';

interface SettingsModalProps {
  onClose: () => void;
}

type GlobalTab = 'headers' | 'params' | 'auth';

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { state, dispatch } = useContext(WorkspaceContext)!;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeGlobalTab, setActiveGlobalTab] = useState<GlobalTab>('headers');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSettingsChange = (key: keyof typeof state.settings, value: any) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    importWorkspace(event, (imported) => {
      dispatch({ type: 'LOAD_WORKSPACE', payload: imported });
      onClose();
    });
  };

  // --- Global Config Handlers ---
  const handleGlobalKeyValuePairChange = (
    type: 'globalHeaders' | 'globalQueryParams',
    index: number,
    field: 'key' | 'value' | 'enabled',
    value: string | boolean
  ) => {
    const items = [...state.settings[type]];
    (items[index] as any)[field] = value;
    handleSettingsChange(type, items);
  };

  const addGlobalKeyValuePair = (type: 'globalHeaders' | 'globalQueryParams') => {
    const newItem = { id: uuidv4(), key: '', value: '', enabled: true };
    handleSettingsChange(type, [...state.settings[type], newItem]);
  };

  const removeGlobalKeyValuePair = (type: 'globalHeaders' | 'globalQueryParams', index: number) => {
    const items = state.settings[type].filter((_, i) => i !== index);
    handleSettingsChange(type, items);
  };
  
  const handleGlobalAuthChange = (change: Partial<Auth>) => {
    const newAuth = { ...state.settings.globalAuth, ...change };
    handleSettingsChange('globalAuth', newAuth);
  }

  // --- Render Functions for Global Config ---
  const renderGlobalKeyValueEditor = (type: 'globalHeaders' | 'globalQueryParams') => {
    const items = state.settings[type];
    const singular = type === 'globalHeaders' ? 'Header' : 'Parameter';
    return (
        <div className="space-y-2 p-3 bg-bg-subtle rounded-b-md max-h-60 overflow-y-auto">
            {items.map((item, index) => (
                <div key={item.id} className="flex flex-wrap items-center gap-2 border-b border-border-default pb-2">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-brand bg-bg-muted border-border-default rounded focus:ring-brand"
                        checked={item.enabled}
                        onChange={(e) => handleGlobalKeyValuePairChange(type, index, 'enabled', e.target.checked)}
                    />
                    <input
                        type="text"
                        placeholder="Key"
                        className="flex-grow min-w-[150px] bg-bg-muted border border-border-default rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-brand focus:outline-none"
                        value={item.key}
                        onChange={(e) => handleGlobalKeyValuePairChange(type, index, 'key', e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Value"
                        className="flex-grow min-w-[150px] bg-bg-muted border border-border-default rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-brand focus:outline-none"
                        value={item.value}
                        onChange={(e) => handleGlobalKeyValuePairChange(type, index, 'value', e.target.value)}
                    />
                    <button onClick={() => removeGlobalKeyValuePair(type, index)} className="text-text-muted hover:text-danger p-1">
                        <TrashIcon />
                    </button>
                </div>
            ))}
            <button
                onClick={() => addGlobalKeyValuePair(type)}
                className="flex items-center gap-2 text-sm text-brand font-semibold hover:text-brand-hover pt-1"
            >
                <PlusIcon /> Add {singular}
            </button>
        </div>
    );
  };

  const renderGlobalAuthEditor = () => {
    return (
        <div className="p-4 bg-bg-subtle rounded-b-md space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Auth Type</label>
                <select 
                    value={state.settings.globalAuth?.type || 'none'}
                    onChange={(e) => handleGlobalAuthChange({ type: e.target.value as 'none' | 'bearer' })}
                    className="w-full max-w-xs p-2 rounded-md bg-bg-muted border border-border-default focus:outline-none focus:ring-2 focus:ring-brand"
                >
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token</option>
                </select>
            </div>
            {state.settings.globalAuth?.type === 'bearer' && (
                <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Token</label>
                    <input 
                        type="text" 
                        placeholder="Your API token"
                        value={state.settings.globalAuth.token || ''}
                        onChange={(e) => handleGlobalAuthChange({ token: e.target.value })}
                        className="w-full p-2 rounded-md bg-bg-muted border border-border-default focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                </div>
            )}
        </div>
    )
  }
  
  const isAiKeyPresent = state.settings.geminiApiKey && state.settings.geminiApiKey.trim() !== '';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-bg-default rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-border-default flex justify-between items-center">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-bg-muted">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Theme Setting */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Theme</label>
            <select
              value={state.settings.theme}
              onChange={(e) => handleSettingsChange('theme', e.target.value as Theme)}
              className="w-full p-2 rounded-md bg-bg-subtle border border-border-default focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {Object.keys(THEME_CLASSES).map(theme => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
          </div>

          {/* Font Setting */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Font</label>
            <select
              value={state.settings.font}
              onChange={(e) => handleSettingsChange('font', e.target.value as AppFont)}
              className="w-full p-2 rounded-md bg-bg-subtle border border-border-default focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {Object.values(APP_FONTS).map(font => (
                <option key={font.name} value={font.name}>{font.name}</option>
              ))}
            </select>
          </div>

          {/* AI Settings */}
          <div className="space-y-4 border-t border-border-default pt-4">
              <h3 className="text-sm font-medium text-text-muted mb-2">AI Assistant</h3>
              <div>
                  <label className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isAiKeyPresent ? 'text-text-default' : 'text-text-subtle'}`}>Enable AI Assistant</span>
                      <div className="relative">
                          <input
                          type="checkbox"
                          checked={isAiKeyPresent && state.settings.aiEnabled}
                          disabled={!isAiKeyPresent}
                          onChange={(e) => handleSettingsChange('aiEnabled', e.target.checked)}
                          className="sr-only peer"
                          id="ai-toggle"
                          />
                          <div className={`w-10 h-6 rounded-full ${isAiKeyPresent ? 'bg-bg-muted peer-checked:bg-brand' : 'bg-bg-muted cursor-not-allowed'}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAiKeyPresent ? 'peer-checked:translate-x-full' : 'opacity-50'}`}></div>
                      </div>
                  </label>
                  <p className="text-xs text-text-muted mt-1">
                      {!isAiKeyPresent ? 'Please add your Gemini API key below to enable the AI assistant.' : 'Get suggestions and analysis for your API calls.'}
                  </p>
              </div>
              
              <div>
                  <label htmlFor="gemini-key" className="block text-sm font-medium text-text-muted mb-2">Gemini API Key</label>
                  <div className="relative">
                      <input
                          id="gemini-key"
                          type={showApiKey ? 'text' : 'password'}
                          value={state.settings.geminiApiKey || ''}
                          onChange={(e) => handleSettingsChange('geminiApiKey', e.target.value)}
                          placeholder="Enter your Google Gemini API key"
                          className="w-full p-2 pr-10 rounded-md bg-bg-subtle border border-border-default focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                      <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute inset-y-0 right-0 px-3 flex items-center text-text-muted hover:text-text-default"
                          aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                      >
                          {showApiKey ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                      Your key is stored only in your browser's local storage.
                  </p>
              </div>
          </div>
            
          {/* Global Request Configuration */}
          <div className="border-t border-border-default pt-4">
            <h3 className="text-sm font-medium text-text-muted mb-2">Global Request Configuration</h3>
            <p className="text-xs text-text-muted mb-3">Define settings that apply to all requests. Tab-specific settings will override these.</p>
            <div className="flex-shrink-0 flex border-b border-border-default">
              {(['headers', 'params', 'auth'] as const).map(tabName => (
                  <button key={tabName} onClick={() => setActiveGlobalTab(tabName)} className={`px-4 py-2 text-sm capitalize rounded-t-md ${activeGlobalTab === tabName ? 'text-brand border border-border-default border-b-0 bg-bg-subtle -mb-px' : 'text-text-muted hover:bg-bg-muted'}`}>
                      {tabName}
                  </button>
              ))}
            </div>
            <div>
              {activeGlobalTab === 'headers' && renderGlobalKeyValueEditor('globalHeaders')}
              {activeGlobalTab === 'params' && renderGlobalKeyValueEditor('globalQueryParams')}
              {activeGlobalTab === 'auth' && renderGlobalAuthEditor()}
            </div>
          </div>


          {/* Workspace Management */}
          <div className="border-t border-border-default pt-4 space-y-2">
            <h3 className="text-sm font-medium text-text-muted mb-2">Workspace Data</h3>
            <div className="flex flex-col sm:flex-row gap-2">
                <button
                    onClick={() => exportWorkspace(state)}
                    className="w-full text-center px-4 py-2 border border-border-default rounded-md text-sm font-medium hover:bg-bg-muted"
                >
                    Export Workspace
                </button>
                <button
                    onClick={handleImportClick}
                    className="w-full text-center px-4 py-2 border border-border-default rounded-md text-sm font-medium hover:bg-bg-muted"
                >
                    Import Workspace
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;