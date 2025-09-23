
import React from 'react';

interface SyntaxHighlighterProps {
  language: string;
  children: React.ReactNode;
  searchTerm?: string;
}

const applySyntaxHighlighting = (jsonString: string) => {
    if (!jsonString) return '';
    
    // Escape HTML characters from the input string to prevent injection.
    let processedString = jsonString
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // 1. Highlight strings, distinguishing between keys and values.
    // This is done first because it's the most complex and can interfere with other replacements.
    processedString = processedString.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, content, offset) => {
        // We look ahead in the original string (not the processed one) to determine if a string is a key.
        // A key is a string that is followed by a colon.
        const substringAfter = jsonString.substring(offset + match.length);
        if (/^\s*:/.test(substringAfter)) {
            return `"<span class='text-syntax-key'>${content}</span>"`;
        } else {
            return `"<span class='text-syntax-string'>${content}</span>"`;
        }
    });

    // 2. Highlight primitive values (booleans, nulls, numbers).
    // These replacements are safer because they match on word boundaries and don't involve quotes.
    processedString = processedString
        .replace(/\b(true|false)\b/g, "<span class='text-syntax-boolean'>$1</span>")
        .replace(/\b(null)\b/g, "<span class='text-syntax-null'>$1</span>")
        .replace(/(?<![a-zA-Z_])(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, "<span class='text-syntax-number'>$1</span>");

    return processedString;
};


const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({ children, language, searchTerm }) => {
  const textContent = String(children);

  const highlightMatches = (text: string, term: string) => {
    if (!term) {
        // No search term, just apply syntax highlighting to the whole text
        return <span dangerouslySetInnerHTML={{ __html: applySyntaxHighlighting(text) }} />;
    }
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === term.toLowerCase()) {
        return (
          <mark key={index} className="bg-brand/40 text-text-default rounded-sm px-0.5">
            {part}
          </mark>
        );
      }
      // For non-matching parts, apply syntax highlighting
      return <span key={index} dangerouslySetInnerHTML={{ __html: applySyntaxHighlighting(part) }} />;
    });
  };
  
  return (
    <pre className={`language-${language} bg-bg-subtle p-4 rounded-md overflow-x-auto text-sm`}>
      <code className="whitespace-pre">
        {highlightMatches(textContent, searchTerm || '')}
      </code>
    </pre>
  );
};

export default SyntaxHighlighter;