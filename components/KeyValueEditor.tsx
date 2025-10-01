import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Header, QueryParam } from '../types';
import { PlusIcon, TrashIcon } from './icons';

export const KeyValueEditor: React.FC<{
    items: (Header | QueryParam)[];
    onChange: (items: (Header | QueryParam)[]) => void;
    addLabel: string;
}> = ({ items, onChange, addLabel }) => {
    
    const handleItemChange = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        onChange(newItems);
    };

    const addItem = () => {
        onChange([...items, { id: uuidv4(), key: '', value: '', enabled: true }]);
    };

    const removeItem = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2 text-sm">
            {items.map((item, index) => (
                <div key={item.id} className="flex flex-wrap items-center gap-2 border-b border-border-default pb-2">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-brand bg-bg-muted border-border-default rounded focus:ring-brand"
                        checked={item.enabled}
                        onChange={(e) => handleItemChange(index, 'enabled', e.target.checked)}
                    />
                    <input
                        type="text"
                        placeholder="Key"
                        className="flex-grow min-w-[150px] bg-bg-subtle border border-border-default rounded-md px-2 py-1 focus:ring-1 focus:ring-brand focus:outline-none"
                        value={item.key}
                        onChange={(e) => handleItemChange(index, 'key', e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Value"
                        className="flex-grow min-w-[150px] bg-bg-subtle border border-border-default rounded-md px-2 py-1 focus:ring-1 focus:ring-brand focus:outline-none"
                        value={item.value}
                        onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                    />
                    <button onClick={() => removeItem(index)} className="text-text-muted hover:text-danger p-1">
                        <TrashIcon />
                    </button>
                </div>
            ))}
            <button
                onClick={addItem}
                className="flex items-center gap-2 text-sm text-brand font-semibold hover:text-brand-hover pt-1"
            >
                <PlusIcon /> {addLabel}
            </button>
        </div>
    );
};
