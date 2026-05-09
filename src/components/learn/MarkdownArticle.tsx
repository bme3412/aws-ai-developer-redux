'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlockEnhanced from '@/components/learn/CodeBlockEnhanced';
import ExamTipCallout, { detectCalloutType } from '@/components/learn/ExamTipCallout';
import RecallCard from '@/components/learn/RecallCard';
import FillInTheBlank from '@/components/learn/FillInTheBlank';
import QuickCheck from '@/components/learn/QuickCheck';
import { generateSlug } from '@/lib/markdown-utils';
import { parseRecallCard, parseFillIn, parseQuickCheck } from '@/lib/active-learning-parsers';

interface MarkdownArticleProps {
  content: string;
}

function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join('');
  if (React.isValidElement(children)) {
    const props = children.props as Record<string, unknown>;
    if (props.children) {
      return extractTextFromChildren(props.children as React.ReactNode);
    }
  }
  return '';
}

function extractTextFromBlockquote(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromBlockquote).join(' ');
  if (React.isValidElement(node)) {
    const props = node.props as Record<string, unknown>;
    if (props.children) {
      return extractTextFromBlockquote(props.children as React.ReactNode);
    }
  }
  return '';
}

export default React.memo(function MarkdownArticle({ content }: MarkdownArticleProps) {
  return (
    <article className="prose prose-gray max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => {
            const text = extractTextFromChildren(children);
            const id = generateSlug(text);
            return (
              <h2 id={id} className="scroll-mt-24 text-2xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = extractTextFromChildren(children);
            const id = generateSlug(text);
            return (
              <h3 id={id} className="scroll-mt-24 text-xl font-semibold text-gray-800 mt-6 mb-3">
                {children}
              </h3>
            );
          },
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{children}</h4>
          ),

          p: ({ children }) => (
            <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
          ),

          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-3 mb-6 text-gray-700">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-2">{children}</li>
          ),

          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            if (match) {
              const language = match[1];
              const code = String(children).replace(/\n$/, '');

              if (language === 'recall') {
                return <RecallCard {...parseRecallCard(code)} />;
              }
              if (language === 'fillin') {
                return <FillInTheBlank {...parseFillIn(code)} />;
              }
              if (language === 'quickcheck') {
                return <QuickCheck {...parseQuickCheck(code)} />;
              }

              return <CodeBlockEnhanced language={language} code={code} />;
            }
            return (
              <code className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-sm rounded font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,

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

          blockquote: ({ children }) => {
            const textContent = extractTextFromBlockquote(children);
            const calloutType = detectCalloutType(textContent);
            return (
              <ExamTipCallout type={calloutType}>
                {children}
              </ExamTipCallout>
            );
          },

          hr: () => <hr className="my-8 border-gray-200" />,

          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),

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
});
