import React from 'react';
import { Auth } from '../types';

export const AuthEditor: React.FC<{
    auth: Auth;
    onChange: (auth: Auth) => void;
    globalAuth?: Auth;
    isGlobal?: boolean;
}> = ({ auth, onChange, globalAuth, isGlobal = false }) => {
    
    const handleAuthChange = (change: Partial<Auth>) => {
        onChange({ ...auth, ...change });
    }

    const getGlobalAuthDisplay = () => {
        if (!globalAuth) return 'None';
        if (globalAuth.type === 'none') return 'None';
        if (globalAuth.type === 'bearer') return 'Bearer Token';
        return 'Unknown';
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Auth Type</label>
                <select 
                    value={auth?.type || (isGlobal ? 'none' : 'inherit')}
                    onChange={(e) => handleAuthChange({ type: e.target.value as Auth['type'] })}
                    className="w-full max-w-xs p-2 rounded-md bg-bg-subtle border border-border-default focus:outline-none focus:ring-2 focus:ring-brand"
                >
                    {!isGlobal && <option value="inherit">Inherit from Global ({getGlobalAuthDisplay()})</option>}
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
             {!isGlobal && auth?.type === 'inherit' && globalAuth && globalAuth.type !== 'none' && (
                <div className="text-xs text-text-muted p-2 bg-bg-subtle rounded-md">
                    Currently using global <strong>{getGlobalAuthDisplay()}</strong> authentication. You can change this in Settings.
                </div>
            )}
        </div>
    )
}
