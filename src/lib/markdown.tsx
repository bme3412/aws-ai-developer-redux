import React from 'react';

/**
 * Parse basic markdown syntax and return React elements
 * Supports: **bold**, *italic*, `code`, and code blocks ```
 */
export function parseMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split by code blocks first (```...```)
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Handle code blocks
  const textWithCodeBlocks = text.replace(codeBlockRegex, (_, lang, code) => {
    return `\x00CODEBLOCK:${lang}:${code.trim()}\x00`;
  });

  // Split on code block markers
  const segments = textWithCodeBlocks.split('\x00');

  return segments.map((segment, index) => {
    if (segment.startsWith('CODEBLOCK:')) {
      const colonIndex = segment.indexOf(':', 10);
      const lang = segment.substring(10, colonIndex);
      const code = segment.substring(colonIndex + 1);
      return (
        <pre key={index} className="p-3 bg-gray-900 text-gray-100 text-sm rounded-lg overflow-x-auto my-3 whitespace-pre font-mono">
          <code className="whitespace-pre">{code}</code>
        </pre>
      );
    }
    return parseInlineMarkdown(segment, index);
  });
}

/**
 * Parse inline markdown (bold, italic, code) and return React elements
 */
export function parseInlineMarkdown(text: string, keyPrefix: number | string = 0): React.ReactNode {
  if (!text) return null;

  // Regex to match **bold**, *italic*, and `code`
  // Order matters: ** before * to handle bold first
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let matchIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[1]) {
      // **bold**
      parts.push(<strong key={`${keyPrefix}-b-${matchIndex}`} className="font-semibold">{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={`${keyPrefix}-i-${matchIndex}`}>{match[4]}</em>);
    } else if (match[5]) {
      // `code`
      parts.push(
        <code key={`${keyPrefix}-c-${matchIndex}`} className="px-1.5 py-0.5 bg-gray-100 text-gray-800 text-sm rounded font-mono">
          {match[6]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
    matchIndex++;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no matches found, return original text
  if (parts.length === 0) {
    return text;
  }

  return parts;
}

/**
 * Component wrapper for markdown content
 */
export function MarkdownText({ children, className = '' }: { children: string; className?: string }) {
  return <span className={className}>{parseInlineMarkdown(children)}</span>;
}

/**
 * Component for paragraph content with full markdown support
 * Handles code blocks as block-level elements (not wrapped in <p> tags)
 */
export function MarkdownParagraph({ children, className = '' }: { children: string; className?: string }) {
  // First, split by code blocks to handle them separately
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;

  // Replace code blocks with markers
  const textWithMarkers = children.replace(codeBlockRegex, (_, lang, code) => {
    return `\x00CODEBLOCK:${lang}:${code.trim()}\x00`;
  });

  // Split on code block markers
  const segments = textWithMarkers.split('\x00').filter(s => s.length > 0);

  return (
    <div className={className}>
      {segments.map((segment, index) => {
        if (segment.startsWith('CODEBLOCK:')) {
          // Render code block directly (not in a <p> tag)
          const colonIndex = segment.indexOf(':', 10);
          const code = segment.substring(colonIndex + 1);
          return (
            <pre key={index} className="p-3 bg-gray-900 text-gray-100 text-sm rounded-lg overflow-x-auto my-3 whitespace-pre font-mono">
              <code className="whitespace-pre">{code}</code>
            </pre>
          );
        }

        // For regular text, split by double newlines into paragraphs
        const paragraphs = segment.split(/\n\n+/).filter(p => p.trim().length > 0);

        return paragraphs.map((para, pIndex) => (
          <p key={`${index}-${pIndex}`} className="mb-3 last:mb-0">
            {parseInlineMarkdown(para, `${index}-${pIndex}`)}
          </p>
        ));
      })}
    </div>
  );
}
