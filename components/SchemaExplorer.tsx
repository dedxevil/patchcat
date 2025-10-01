import React, { useState } from 'react';
import { GraphQLSchema, GraphQLField, GraphQLTypeRef } from '../types';
import { ChevronRightIcon } from './icons';

interface SchemaExplorerProps {
    schema?: GraphQLSchema;
    onSelectField: (operation: string) => void;
    searchTerm?: string;
}

const getTypeName = (type: GraphQLTypeRef): string => {
    if (type.kind === 'LIST') return `[${getTypeName(type.ofType!)}]`;
    if (type.kind === 'NON_NULL') return `${getTypeName(type.ofType!)}!`;
    return type.name || '';
};

const getFieldSignature = (field: GraphQLField): string => {
    const args = field.args.map(arg => `${arg.name}: ${getTypeName(arg.type)}`).join(', ');
    return `${field.name}${args.length > 0 ? `(${args})` : ''}: ${getTypeName(field.type)}`;
};

const generateSampleOperation = (field: GraphQLField, type: 'query' | 'mutation'): string => {
    const argsDef = field.args.map(arg => `$${arg.name}: ${getTypeName(arg.type)}`).join(', ');
    const argsUsage = field.args.map(arg => `${arg.name}: $${arg.name}`).join(', ');

    const operationName = `${type.charAt(0).toUpperCase() + type.slice(1)}${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`;

    return `${type} ${operationName}${argsDef ? `(${argsDef})` : ''} {\n  ${field.name}${argsUsage ? `(${argsUsage})` : ''} {\n    # Add fields here\n  }\n}`;
};

const SchemaExplorer: React.FC<SchemaExplorerProps> = ({ schema, onSelectField, searchTerm }) => {
    const [openSections, setOpenSections] = useState({ queries: true, mutations: true });

    if (!schema) {
        return <div className="p-4 text-xs text-text-muted">No schema loaded.</div>;
    }

    const toggleSection = (section: 'queries' | 'mutations') => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const rootQueryType = schema.types.find(t => t.name === schema.queryType.name);
    const rootMutationType = schema.mutationType ? schema.types.find(t => t.name === schema.mutationType.name) : undefined;
    
    const filterFields = (fields: GraphQLField[] | undefined): GraphQLField[] | undefined => {
        if (!searchTerm) return fields;
        const lowercasedTerm = searchTerm.toLowerCase();
        return fields?.filter(field => 
            field.name.toLowerCase().includes(lowercasedTerm) || 
            getFieldSignature(field).toLowerCase().includes(lowercasedTerm)
        );
    };

    const filteredQueries = filterFields(rootQueryType?.fields);
    const filteredMutations = filterFields(rootMutationType?.fields);

    return (
        <div className="p-2 font-mono text-xs">
            {rootQueryType && (
                <div>
                    <button onClick={() => toggleSection('queries')} className="flex items-center w-full font-bold text-text-default py-1">
                        <ChevronRightIcon className={`w-4 h-4 mr-1 transition-transform ${openSections.queries ? 'rotate-90' : ''}`} />
                        Queries
                    </button>
                    {openSections.queries && (
                        <ul className="pl-4 border-l border-border-default ml-2">
                            {filteredQueries?.map(field => (
                                <li key={field.name} className="py-1 text-text-muted hover:text-text-default">
                                    <button onClick={() => onSelectField(generateSampleOperation(field, 'query'))} className="text-left">
                                        {getFieldSignature(field)}
                                    </button>
                                </li>
                            ))}
                             {searchTerm && filteredQueries?.length === 0 && (
                                <li className="py-1 text-text-subtle italic">No matching queries found.</li>
                            )}
                        </ul>
                    )}
                </div>
            )}
            {rootMutationType && (
                 <div>
                    <button onClick={() => toggleSection('mutations')} className="flex items-center w-full font-bold text-text-default py-1 mt-2">
                         <ChevronRightIcon className={`w-4 h-4 mr-1 transition-transform ${openSections.mutations ? 'rotate-90' : ''}`} />
                        Mutations
                    </button>
                    {openSections.mutations && (
                        <ul className="pl-4 border-l border-border-default ml-2">
                            {filteredMutations?.map(field => (
                                <li key={field.name} className="py-1 text-text-muted hover:text-text-default">
                                    <button onClick={() => onSelectField(generateSampleOperation(field, 'mutation'))} className="text-left">
                                         {getFieldSignature(field)}
                                    </button>
                                </li>
                            ))}
                             {searchTerm && filteredMutations?.length === 0 && (
                                <li className="py-1 text-text-subtle italic">No matching mutations found.</li>
                            )}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default SchemaExplorer;