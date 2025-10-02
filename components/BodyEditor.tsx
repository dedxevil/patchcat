import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Body, FormDataField, HttpMethod } from '../types';
import { PlusIcon, TrashIcon } from './icons';

const FormDataEditor: React.FC<{
    fields: FormDataField[];
    onChange: (fields: FormDataField[]) => void;
    fileObjects: Record<string, File | null>;
    setFileObjects: React.Dispatch<React.SetStateAction<Record<string, File | null>>>;
}> = ({ fields, onChange, fileObjects, setFileObjects }) => {
    
    const handleFieldChange = (index: number, field: 'key' | 'value' | 'enabled' | 'type', value: string | boolean) => {
        const newFields = [...fields];
        (newFields[index] as any)[field] = value;

        if (field === 'type' && value === 'file') {
            newFields[index].value = ''; // Clear text value when switching to file
        } else if (field === 'type' && value === 'text') {
            const fieldId = newFields[index].id;
            setFileObjects(prev => {
                const newFiles = { ...prev };
                delete newFiles[fieldId];
                return newFiles;
            });
        }
        onChange(newFields);
    };

    const handleFileChange = (id: string, file: File | null) => {
        setFileObjects(prev => ({ ...prev, [id]: file }));
        const fieldIndex = fields.findIndex(f => f.id === id);
        if (fieldIndex > -1) {
            const newFields = [...fields];
            newFields[fieldIndex].value = file ? file.name : '';
            onChange(newFields);
        }
    };
    
    const addField = () => {
        onChange([...fields, { id: uuidv4(), key: '', value: '', type: 'text', enabled: true }]);
    };

    const removeField = (index: number) => {
        const fieldToRemove = fields[index];
        setFileObjects(prev => {
            const newFiles = { ...prev };
            delete newFiles[fieldToRemove.id];
            return newFiles;
        });
        onChange(fields.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2 text-sm">
            {fields.map((field, index) => (
                <div key={field.id} className="flex flex-wrap items-center gap-2 border-b border-border-default pb-2">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-brand bg-bg-muted border-border-default rounded focus:ring-brand"
                        checked={field.enabled}
                        onChange={(e) => handleFieldChange(index, 'enabled', e.target.checked)}
                    />
                    <input
                        type="text"
                        placeholder="Key"
                        className="flex-grow min-w-[120px] bg-bg-subtle border border-border-default rounded-md px-2 py-1 focus:ring-1 focus:ring-brand focus:outline-none"
                        value={field.key}
                        onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                    />
                    <div className="flex-grow min-w-[200px] flex gap-2">
                        {field.type === 'text' ? (
                            <input
                                type="text"
                                placeholder="Value"
                                className="flex-grow bg-bg-subtle border border-border-default rounded-md px-2 py-1 focus:ring-1 focus:ring-brand focus:outline-none"
                                value={field.value}
                                onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                            />
                        ) : (
                             <div className="flex-grow">
                                <label className="flex items-center w-full bg-bg-subtle border border-border-default rounded-md px-2 py-1 text-text-muted cursor-pointer hover:bg-bg-muted">
                                    <span className="truncate flex-grow">{fileObjects[field.id]?.name || 'Choose File'}</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(field.id, e.target.files ? e.target.files[0] : null)}
                                    />
                                </label>
                            </div>
                        )}
                        <select 
                            value={field.type} 
                            onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                            className="bg-bg-subtle border border-border-default rounded-md px-2 py-1 focus:ring-1 focus:ring-brand focus:outline-none"
                        >
                            <option value="text">Text</option>
                            <option value="file">File</option>
                        </select>
                    </div>

                    <button onClick={() => removeField(index)} className="text-text-muted hover:text-danger p-1">
                        <TrashIcon />
                    </button>
                </div>
            ))}
            <button
                onClick={addField}
                className="flex items-center gap-2 text-sm text-brand font-semibold hover:text-brand-hover pt-1"
            >
                <PlusIcon /> Add Field
            </button>
        </div>
    );
};

const BinaryFileEditor: React.FC<{
    file: File | null;
    onChange: (file: File | null) => void;
}> = ({ file, onChange }) => {
    return (
        <div>
            <label className="w-full flex items-center justify-center bg-bg-subtle border-2 border-dashed border-border-default rounded-md p-6 text-center cursor-pointer hover:bg-bg-muted hover:border-brand">
                <div className="text-text-muted">
                    {file ? (
                        <>
                            <p className="font-semibold text-text-default">{file.name}</p>
                            <p className="text-xs">({(file.size / 1024).toFixed(2)} KB)</p>
                        </>
                    ) : (
                        <p>Click to select a file</p>
                    )}
                </div>
                <input
                    type="file"
                    className="hidden"
                    onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                />
            </label>
        </div>
    );
};

export const BodyEditor: React.FC<{
    body: Body;
    onChange: (body: Body) => void;
    fileObjects: Record<string, File | null>;
    setFileObjects: React.Dispatch<React.SetStateAction<Record<string, File | null>>>;
    binaryFile: File | null;
    setBinaryFile: React.Dispatch<React.SetStateAction<File | null>>;
    method: HttpMethod;
}> = ({ body, onChange, fileObjects, setFileObjects, binaryFile, setBinaryFile, method }) => {
    
    const canHaveBody = ![HttpMethod.GET, HttpMethod.HEAD, HttpMethod.OPTIONS].includes(method);

    if (!canHaveBody) {
        return (
            <div className="p-4 text-sm text-text-muted">
                Requests with the {method} method cannot have a body.
            </div>
        );
    }
    
    const handleTypeChange = (newType: Body['type']) => {
        if (newType !== 'form-data') {
            setFileObjects({});
        }
        if (newType !== 'binary') {
            setBinaryFile(null);
        }
        
        if (newType === 'raw') {
            onChange({ type: 'raw', content: '' });
        } else if (newType === 'form-data') {
            onChange({ type: 'form-data', fields: [] });
        } else if (newType === 'binary') {
            onChange({ type: 'binary' });
        }
    }

    const handleRawChange = (content: string) => {
        onChange({ type: 'raw', content });
    }

    return (
        <div className="p-4 space-y-4">
             <div className="flex items-center gap-4 text-sm">
                <label>
                    <input type="radio" value="raw" checked={body.type === 'raw'} onChange={() => handleTypeChange('raw')} className="mr-1 form-radio text-brand focus:ring-brand" />
                    Raw (JSON)
                </label>
                <label>
                    <input type="radio" value="form-data" checked={body.type === 'form-data'} onChange={() => handleTypeChange('form-data')} className="mr-1 form-radio text-brand focus:ring-brand" />
                    Form-data
                </label>
                 <label>
                    <input type="radio" value="binary" checked={body.type === 'binary'} onChange={() => handleTypeChange('binary')} className="mr-1 form-radio text-brand focus:ring-brand" />
                    Binary
                </label>
            </div>
            {body.type === 'raw' && (
                <textarea
                    value={body.content}
                    onChange={(e) => handleRawChange(e.target.value)}
                    placeholder='Enter JSON body here...'
                    className="w-full h-48 font-mono text-sm bg-bg-subtle border border-border-default rounded-md p-2 focus:ring-1 focus:ring-brand focus:outline-none"
                />
            )}
             {body.type === 'form-data' && (
                 <FormDataEditor 
                    fields={body.fields || []}
                    onChange={(fields) => onChange({ type: 'form-data', fields })}
                    fileObjects={fileObjects}
                    setFileObjects={setFileObjects}
                 />
             )}
             {body.type === 'binary' && (
                 <BinaryFileEditor file={binaryFile} onChange={setBinaryFile} />
             )}
        </div>
    )
}