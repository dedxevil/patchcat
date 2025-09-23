import React, { useContext, useRef } from 'react';
import { WorkspaceContext } from '../App';
import { Theme, AppFont } from '../types';
import { THEME_CLASSES, APP_FONTS } from '../constants';
import { exportWorkspace, importWorkspace } from '../utils/exportImport';
import { CloseIcon } from './icons';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { state, dispatch } = useContext(WorkspaceContext)!;
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-bg-default rounded-lg shadow-xl w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-border-default flex justify-between items-center">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-bg-muted">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 space-y-6">
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

          {/* AI Setting */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-text-default">Enable AI Assistant</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={state.settings.aiEnabled}
                  onChange={(e) => handleSettingsChange('aiEnabled', e.target.checked)}
                  className="sr-only peer"
                  id="ai-toggle"
                />
                <div className="w-10 h-6 rounded-full bg-bg-muted peer-checked:bg-brand"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-full"></div>
              </div>
            </label>
             <p className="text-xs text-text-muted mt-1">Get suggestions and analysis for your API calls.</p>
          </div>

          {/* Workspace Management */}
          <div className="border-t border-border-default pt-4 space-y-2">
            <h3 className="text-sm font-medium text-text-muted mb-2">Workspace Data</h3>
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
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;