'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

// Initialize mermaid with a clean theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#e0e7ff',
    primaryTextColor: '#1e1b4b',
    primaryBorderColor: '#6366f1',
    lineColor: '#6366f1',
    secondaryColor: '#fef3c7',
    tertiaryColor: '#f0fdf4',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 15,
  },
  securityLevel: 'loose',
});

export default function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('Failed to render diagram');
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`my-4 p-4 bg-white border border-gray-200 rounded-lg overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
