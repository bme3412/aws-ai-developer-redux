'use client';

import React, { Suspense, lazy } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Highlight, themes } from 'prism-react-renderer';

const MermaidDiagram = lazy(() => import('@/components/learn/MermaidDiagram'));

interface MarkdownArticleProps {
  content: string;
}

function CodeBlock({ className, children }: { className?: string; children: string }) {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const code = String(children).replace(/\n$/, '');

  // Handle mermaid diagrams
  if (language === 'mermaid') {
    return (
      <Suspense fallback={<div className="p-4 bg-gray-100 rounded-lg animate-pulse h-32" />}>
        <MermaidDiagram chart={code} />
      </Suspense>
    );
  }

  // Map common language names
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'sh': 'bash',
    'shell': 'bash',
    '': 'javascript',
  };

  const normalizedLang = langMap[language] || language || 'javascript';

  return (
    <Highlight theme={themes.nightOwl} code={code} language={normalizedLang as any}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className="text-sm rounded-lg overflow-x-auto my-4 font-mono leading-relaxed"
          style={{ ...style, padding: '1rem', margin: '1rem 0' }}
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

export default function MarkdownArticle({ content }: MarkdownArticleProps) {
  return (
    <article className="prose prose-gray max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headers
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{children}</h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-3 mb-6 text-gray-700">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-2">{children}</li>
          ),

          // Code
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return <CodeBlock className={className}>{String(children)}</CodeBlock>;
            }
            return (
              <code className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-sm rounded font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-200">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-gray-700">{children}</td>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-400 pl-4 py-2 my-4 bg-blue-50 rounded-r-lg italic text-gray-700">
              {children}
            </blockquote>
          ),

          // Horizontal rules
          hr: () => <hr className="my-8 border-gray-200" />,

          // Strong/Em
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),

          // Links
          a: ({ href, children }) => (
            <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
