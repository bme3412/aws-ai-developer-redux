'use client';

import React, { Suspense, lazy, useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Copy, Check } from 'lucide-react';

const MermaidDiagram = lazy(() => import('@/components/learn/MermaidDiagram'));

interface CodeBlockEnhancedProps {
  language: string;
  code: string;
}

const langMap: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  '': 'javascript',
};

const langDisplayNames: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  bash: 'Bash',
  json: 'JSON',
  yaml: 'YAML',
  html: 'HTML',
  css: 'CSS',
  sql: 'SQL',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  hcl: 'HCL',
  terraform: 'Terraform',
};

export default function CodeBlockEnhanced({ language, code }: CodeBlockEnhancedProps) {
  const [copied, setCopied] = useState(false);

  if (language === 'mermaid') {
    return (
      <Suspense fallback={<div className="p-4 bg-gray-100 rounded-lg animate-pulse h-32" />}>
        <MermaidDiagram chart={code} />
      </Suspense>
    );
  }

  if (language === 'text' || language === 'ascii' || language === 'diagram') {
    return (
      <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 bg-slate-50">
        <pre className="m-0 px-4 py-3 text-[13px] sm:text-sm leading-relaxed font-mono text-slate-800 whitespace-pre">
          {code}
        </pre>
      </div>
    );
  }

  const normalizedLang = langMap[language] || language || 'javascript';
  const displayName = langDisplayNames[normalizedLang] || normalizedLang;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-4">
      {/* Language badge + Copy button bar */}
      <div className="absolute top-0 right-0 flex items-center gap-1 px-2 py-1.5 z-10">
        {language && (
          <span className="text-xs font-mono text-gray-400 bg-gray-800/60 px-2 py-0.5 rounded">
            {displayName}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-700/60 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      <Highlight theme={themes.nightOwl} code={code} language={normalizedLang as any}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className="text-sm rounded-lg overflow-x-auto font-mono leading-relaxed pt-10 pb-4 px-4"
            style={{ ...style, margin: 0 }}
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
    </div>
  );
}
