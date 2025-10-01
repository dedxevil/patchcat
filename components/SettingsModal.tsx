import React, { useContext, useRef, useState } from 'react';
import { WorkspaceContext } from '../App';
import { Theme, AppFont, Auth, Environment, EnvironmentVariable } from '../types';
import { THEME_CLASSES, APP_FONTS } from '../constants';
import { exportWorkspace, importWorkspace } from '../utils/exportImport';
import { CloseIcon, PlusIcon, TrashIcon, EyeIcon, EyeOffIcon } from './icons';
import { v4 as uuidv4 } from 'uuid';
import { KeyValueEditor } from './KeyValueEditor';
import { AuthEditor } from './AuthEditor';

interface SettingsModalProps {
  onClose: () => void;
}

type MainTab = 'general' | 'environments' | 'globals' | 'data';

const GlobalConfigPanel: React.FC = () => {
    const { state, dispatch } = useContext(WorkspaceContext)!;
    const [activeGlobalTab, setActiveGlobalTab] = useState<'headers' | 'params' | 'auth'>('headers');

    const handleSettingsChange = (key: keyof typeof state.settings, value: any) => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
    };

    return (
        <div className="space-y-4">
            <div className="border-b border-border-default flex">
                <button onClick={() => setActiveGlobalTab('headers')} className={`px-4 py-2 text-sm ${activeGlobalTab === 'headers' ? 'text-brand border-b-2 border-brand -mb-px' : 'text-text-muted'}`}>Headers</button>
                <button onClick={() => setActiveGlobalTab('params')} className={`px-4 py-2 text-sm ${activeGlobalTab === 'params' ? 'text-brand border-b-2 border-brand -mb-px' : 'text-text-muted'}`}>Query Params</button>
                <button onClick={() => setActiveGlobalTab('auth')} className={`px-4 py-2 text-sm ${activeGlobalTab === 'auth' ? 'text-brand border-b-2 border-brand -mb-px' : 'text-text-muted'}`}>Auth</button>
            </div>
            <div className="pt-2">
                {activeGlobalTab === 'headers' && (
                    <div>
                        <p className="text-sm text-text-muted mb-4">These headers will be sent with every REST and GraphQL request.</p>
                        <KeyValueEditor
                            items={state.settings.globalHeaders}
                            onChange={(items) => handleSettingsChange('globalHeaders', items)}
                            addLabel="Add Global Header"
                        />
                    </div>
                )}
                {activeGlobalTab === 'params' && (
                     <div>
                        <p className="text-sm text-text-muted mb-4">These query parameters will be added to every REST and GraphQL request URL.</p>
                        <KeyValueEditor
                            items={state.settings.globalQueryParams}
                            onChange={(items) => handleSettingsChange('globalQueryParams', items)}
                            addLabel="Add Global Query Param"
                        />
                    </div>
                )}
                {activeGlobalTab === 'auth' && (
                     <div>
                        <p className="text-sm text-text-muted mb-4">This authentication method will be used for all requests unless overridden in a specific tab.</p>
                        <AuthEditor
                            auth={state.settings.globalAuth}
                            onChange={(auth) => handleSettingsChange('globalAuth', auth)}
                            isGlobal={true}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { state, dispatch } = useContext(WorkspaceContext)!;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('general');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Environment state
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(state.settings.activeEnvironmentId);

  const handleSettingsChange = (key: keyof typeof state.settings, value: any) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
  };
  
  const selectedEnv = state.settings.environments.find(e => e.id === selectedEnvId);
  
  // --- Environment Handlers ---
  const addEnvironment = () => {
      const newEnv: Environment = {
          id: uuidv4(),
          name: `New Environment ${state.settings.environments.length + 1}`,
          variables: [],
      };
      handleSettingsChange('environments', [...state.settings.environments, newEnv]);
      setSelectedEnvId(newEnv.id);
  }
  
  const deleteEnvironment = (envId: string) => {
      if (state.settings.environments.length <= 1) {
          alert("Cannot delete the last environment.");
          return;
      }
      if (window.confirm("Are you sure you want to delete this environment?")) {
          const newEnvs = state.settings.environments.filter(e => e.id !== envId);
          handleSettingsChange('environments', newEnvs);
          if (selectedEnvId === envId) {
              setSelectedEnvId(newEnvs[0]?.id || null);
          }
          if (state.settings.activeEnvironmentId === envId) {
              handleSettingsChange('activeEnvironmentId', newEnvs[0]?.id || null);
          }
      }
  }
  
  const updateEnvironmentName = (envId: string, name: string) => {
      const newEnvs = state.settings.environments.map(e => e.id === envId ? { ...e, name } : e);
      handleSettingsChange('environments', newEnvs);
  }

  const handleEnvVarChange = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
      if (!selectedEnv) return;
      const newVars = [...selectedEnv.variables];
      (newVars[index] as any)[field] = value;
      const newEnvs = state.settings.environments.map(e => e.id === selectedEnv.id ? { ...e, variables: newVars } : e);
      handleSettingsChange('environments', newEnvs);
  }

  const addEnvVar = () => {
      if (!selectedEnv) return;
      const newVar: EnvironmentVariable = { id: uuidv4(), key: '', value: '', enabled: true };
      const newVars = [...selectedEnv.variables, newVar];
      const newEnvs = state.settings.environments.map(e => e.id === selectedEnv.id ? { ...e, variables: newVars } : e);
      handleSettingsChange('environments', newEnvs);
  }

  const removeEnvVar = (index: number) => {
      if (!selectedEnv) return;
      const newVars = selectedEnv.variables.filter((_, i) => i !== index);
      const newEnvs = state.settings.environments.map(e => e.id === selectedEnv.id ? { ...e, variables: newVars } : e);
      handleSettingsChange('environments', newEnvs);
  }
  
  // --- Import/Export Handlers ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    importWorkspace(event, (imported) => {
      dispatch({ type: 'LOAD_WORKSPACE', payload: imported });
      onClose();
    });
  };
  
  const isAiKeyPresent = state.settings.geminiApiKey && state.settings.geminiApiKey.trim() !== '';
  const isAiEnabled = isAiKeyPresent && state.settings.aiEnabled;

  const renderGeneralSettings = () => (
      <div className="space-y-6">
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
                  <label htmlFor="ai-toggle" className="flex items-center justify-between cursor-pointer">
                      <span className={`text-sm font-medium ${isAiKeyPresent ? 'text-text-default' : 'text-text-subtle'}`}>Enable AI Assistant</span>
                      <div className="relative">
                          <input
                          type="checkbox"
                          checked={isAiEnabled}
                          disabled={!isAiKeyPresent}
                          onChange={(e) => handleSettingsChange('aiEnabled', e.target.checked)}
                          className="sr-only peer"
                          id="ai-toggle"
                          />
                          <div className={`w-10 h-6 rounded-full transition-colors ${isAiEnabled ? 'bg-success' : 'bg-bg-muted'} ${!isAiKeyPresent ? 'cursor-not-allowed opacity-50' : ''}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAiEnabled ? 'translate-x-full' : ''}`}></div>
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
      </div>
  );

  const renderEnvironments = () => (
      <div className="space-y-4">
          <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Active Environment</label>
              <select
                  value={state.settings.activeEnvironmentId || ''}
                  onChange={(e) => handleSettingsChange('activeEnvironmentId', e.target.value)}
                  className="w-full p-2 rounded-md bg-bg-subtle border border-border-default focus:outline-none focus:ring-2 focus:ring-brand"
              >
                  {state.settings.environments.map(env => (
                      <option key={env.id} value={env.id}>{env.name}</option>
                  ))}
              </select>
          </div>
          <div className="border-t border-border-default pt-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-text-muted">Manage Environments</h3>
                <button onClick={addEnvironment} className="flex items-center gap-1 text-sm text-brand font-semibold hover:text-brand-hover">
                    <PlusIcon /> New
                </button>
            </div>
            <div className="flex gap-4">
                <ul className="w-1/3 border border-border-default rounded-md p-1 space-y-1">
                    {state.settings.environments.map(env => (
                        <li key={env.id}>
                            <button
                                onClick={() => setSelectedEnvId(env.id)}
                                className={`w-full text-left text-sm p-2 rounded-md flex justify-between items-center ${selectedEnvId === env.id ? 'bg-bg-muted' : 'hover:bg-bg-subtle'}`}
                            >
                                <span className="truncate">{env.name}</span>
                                {env.id === state.settings.activeEnvironmentId && <div className="w-2 h-2 bg-success rounded-full flex-shrink-0 ml-2" title="Active"></div>}
                            </button>
                        </li>
                    ))}
                </ul>
                <div className="w-2/3">
                    {selectedEnv ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={selectedEnv.name}
                                    onChange={e => updateEnvironmentName(selectedEnv.id, e.target.value)}
                                    className="w-full p-2 rounded-md bg-bg-subtle border border-border-default focus:outline-none focus:ring-2 focus:ring-brand font-semibold"
                                />
                                <button onClick={() => deleteEnvironment(selectedEnv.id)} className="p-2 text-text-muted hover:text-danger rounded-md">
                                    <TrashIcon />
                                </button>
                            </div>
                            <div className="space-y-2 p-3 bg-bg-subtle rounded-md max-h-60 overflow-y-auto">
                                {selectedEnv.variables.map((v, index) => (
                                    <div key={v.id} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-1 flex items-center justify-center">
                                            <input type="checkbox" checked={v.enabled} onChange={e => handleEnvVarChange(index, 'enabled', e.target.checked)} className="form-checkbox h-4 w-4 text-brand bg-bg-muted border-border-default rounded focus:ring-brand" />
                                        </div>
                                        <input type="text" placeholder="Key" value={v.key} onChange={e => handleEnvVarChange(index, 'key', e.target.value)} className="col-span-5 bg-bg-muted border border-border-default rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-brand focus:outline-none" />
                                        <input type="text" placeholder="Value" value={v.value} onChange={e => handleEnvVarChange(index, 'value', e.target.value)} className="col-span-5 bg-bg-muted border border-border-default rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-brand focus:outline-none" />
                                        <button onClick={() => removeEnvVar(index)} className="col-span-1 text-text-muted hover:text-danger p-1"><TrashIcon /></button>
                                    </div>
                                ))}
                                <button onClick={addEnvVar} className="flex items-center gap-2 text-sm text-brand font-semibold hover:text-brand-hover pt-1">
                                    <PlusIcon /> Add Variable
                                </button>
                            </div>
                        </div>
                    ) : <p className="text-text-muted">Select an environment to edit.</p>}
                </div>
            </div>
          </div>
      </div>
  );

  const renderDataManagement = () => (
      <div className="space-y-2">
        <p className="text-sm text-text-muted">Export your entire workspace, including tabs, history, and settings, into a single JSON file. You can import this file later to restore your state.</p>
        <div className="flex gap-2">
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
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-bg-default rounded-lg shadow-xl w-full max-w-3xl m-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-border-default flex justify-between items-center">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-bg-muted">
            <CloseIcon />
          </button>
        </div>
        <div className="flex">
            <div className="w-48 border-r border-border-default p-4">
                <nav className="space-y-1">
                    <button onClick={() => setActiveMainTab('general')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeMainTab === 'general' ? 'bg-bg-muted' : 'hover:bg-bg-subtle'}`}>General</button>
                    <button onClick={() => setActiveMainTab('environments')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeMainTab === 'environments' ? 'bg-bg-muted' : 'hover:bg-bg-subtle'}`}>Environments</button>
                    <button onClick={() => setActiveMainTab('globals')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeMainTab === 'globals' ? 'bg-bg-muted' : 'hover:bg-bg-subtle'}`}>Globals</button>
                    <button onClick={() => setActiveMainTab('data')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeMainTab === 'data' ? 'bg-bg-muted' : 'hover:bg-bg-subtle'}`}>Data</button>
                </nav>
            </div>
            <div className="flex-grow p-6 h-[60vh] overflow-y-auto">
                {activeMainTab === 'general' && renderGeneralSettings()}
                {activeMainTab === 'environments' && renderEnvironments()}
                {activeMainTab === 'globals' && <GlobalConfigPanel />}
                {activeMainTab === 'data' && renderDataManagement()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;