import { Environment } from '../types';

export const resolveVariables = (
  text: string,
  activeEnvironment?: Environment | null
): { resolvedText: string; usedVariables: Record<string, string> } => {
  if (!text || !activeEnvironment) {
    return { resolvedText: text, usedVariables: {} };
  }

  const variableMap = new Map<string, string>();
  activeEnvironment.variables.forEach(v => {
    if (v.enabled && v.key) {
      variableMap.set(v.key, v.value);
    }
  });

  const usedVariables: Record<string, string> = {};
  
  const resolvedText = text.replace(/\[([^\]]+)\]/g, (match, key) => {
    if (variableMap.has(key)) {
      const value = variableMap.get(key)!;
      usedVariables[key] = value;
      return value;
    }
    return match; // Return the original placeholder if not found
  });

  return { resolvedText, usedVariables };
};
