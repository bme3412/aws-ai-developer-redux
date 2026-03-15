'use client';

import React, { Suspense, lazy } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

// Lazy load MermaidDiagram to avoid SSR issues
const MermaidDiagram = lazy(() => import('@/components/learn/MermaidDiagram'));

/**
 * Syntax-highlighted code block component
 */
function SyntaxHighlightedCode({ code, language }: { code: string; language: string }) {
  // Map common language names
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'sh': 'bash',
    'shell': 'bash',
    'json': 'json',
    '': 'javascript', // default
  };

  const normalizedLang = langMap[language] || language || 'javascript';

  return (
    <Highlight theme={themes.nightOwl} code={code} language={normalizedLang as any}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className="text-sm rounded-lg overflow-x-auto my-4 font-mono leading-relaxed"
          style={{
            ...style,
            padding: '1rem',
            margin: '1rem 0',
          }}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

/**
 * Parse basic markdown syntax and return React elements
 * Supports: **bold**, *italic*, `code`, code blocks ```, and mermaid diagrams
 */
export function parseMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split by code blocks first (```...```)
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;

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

      // Handle mermaid diagrams
      if (lang === 'mermaid') {
        return (
          <Suspense key={index} fallback={<div className="p-4 bg-gray-100 rounded-lg animate-pulse h-32" />}>
            <MermaidDiagram chart={code} />
          </Suspense>
        );
      }

      return <SyntaxHighlightedCode key={index} code={code} language={lang} />;
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
  // Using [^*]+ instead of .+? to prevent asterisks inside from breaking parsing
  // Order matters: ** before * to handle bold first
  const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;

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
        <code key={`${keyPrefix}-c-${matchIndex}`} className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-sm rounded font-mono">
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
 * Parse text into flowing paragraphs (no bullet lists)
 * Handles numbered lists by converting them to flowing prose
 */
function parseTextAsProse(text: string, keyPrefix: string | number): React.ReactNode[] {
  const elements: React.ReactNode[] = [];

  // First, split by double newlines into paragraphs (preserve structure!)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  paragraphs.forEach((para, pIndex) => {
    // Join single newlines with spaces for flow, clean up extra spaces
    const flowingText = para
      .split(/\n/)
      .map(s => s.trim())
      .join(' ')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    if (flowingText) {
      elements.push(
        <p key={`${keyPrefix}-p-${pIndex}`} className="mb-4 text-gray-700 leading-relaxed">
          {parseInlineMarkdown(flowingText, `${keyPrefix}-${pIndex}`)}
        </p>
      );
    }
  });

  return elements;
}

/**
 * Component for paragraph content with full markdown support
 * Handles code blocks, mermaid diagrams as block-level elements
 * Renders text as flowing prose (no bullet lists)
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
          const colonIndex = segment.indexOf(':', 10);
          const lang = segment.substring(10, colonIndex);
          const code = segment.substring(colonIndex + 1);

          // Handle mermaid diagrams
          if (lang === 'mermaid') {
            return (
              <Suspense key={index} fallback={<div className="p-4 bg-gray-100 rounded-lg animate-pulse h-32" />}>
                <MermaidDiagram chart={code} />
              </Suspense>
            );
          }

          // Syntax-highlighted code block
          return <SyntaxHighlightedCode key={index} code={code} language={lang} />;
        }

        // Parse text content as flowing prose
        return (
          <React.Fragment key={index}>
            {parseTextAsProse(segment, index)}
          </React.Fragment>
        );
      })}
    </div>
  );
}
