// FIX: Import React to use React types like React.ChangeEvent.
import React from 'react';
import { Workspace } from '../types';

export const exportWorkspace = (workspace: Workspace) => {
  const jsonString = JSON.stringify(workspace, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `patchcat-workspace-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importWorkspace = (
  event: React.ChangeEvent<HTMLInputElement>,
  onLoad: (workspace: Workspace) => void
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result;
      if (typeof text === 'string') {
        const importedWorkspace = JSON.parse(text);
        // Basic validation
        if (importedWorkspace.tabs && importedWorkspace.settings) {
          onLoad(importedWorkspace);
        } else {
          alert('Invalid workspace file.');
        }
      }
    } catch (error) {
      console.error("Failed to import workspace:", error);
      alert('Failed to parse workspace file. Please ensure it is a valid JSON file.');
    }
  };
  reader.readAsText(file);
};
