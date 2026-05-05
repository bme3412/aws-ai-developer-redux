'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { extractHeadings, estimateReadingTime, splitIntoSections } from '@/lib/markdown-utils';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import TableOfContents from '@/components/learn/TableOfContents';
import { ReadingProgressBarContainer } from '@/components/learn/ReadingProgressBar';
import CollapsibleSection from '@/components/learn/CollapsibleSection';
import MarkdownArticle from '@/components/learn/MarkdownArticle';

interface ArticleLayoutProps {
  markdown: string;
  accentColor: string;
  textColor: string;
}

export default function ArticleLayout({ markdown, accentColor, textColor }: ArticleLayoutProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const headings = useMemo(() => extractHeadings(markdown), [markdown]);
  const readingTime = useMemo(() => estimateReadingTime(markdown), [markdown]);
  const sections = useMemo(() => splitIntoSections(markdown), [markdown]);

  const activeId = useScrollSpy(headings);

  // All sections expanded by default
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    return new Set(sections.filter(s => s.id !== '__intro').map(s => s.id));
  });

  const toggleSection = useCallback((id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedSections(new Set(sections.filter(s => s.id !== '__intro').map(s => s.id)));
  }, [sections]);

  const collapseAll = useCallback(() => {
    setExpandedSections(new Set());
  }, []);

  return (
    <>
      <ReadingProgressBarContainer
        contentRef={contentRef}
        readingTime={readingTime}
        accentColor={accentColor}
      />

      <div className="flex gap-8 relative">
        {/* Main article column */}
        <div className="flex-1 min-w-0 max-w-4xl animate-fade-in" ref={contentRef}>
          {sections.map((section) => {
            if (section.id === '__intro') {
              return (
                <div key={section.id} className="mb-6">
                  <MarkdownArticle content={section.content} />
                </div>
              );
            }

            return (
              <CollapsibleSection
                key={section.id}
                id={section.id}
                title={section.title}
                isExpanded={expandedSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
              >
                <MarkdownArticle content={section.content} />
              </CollapsibleSection>
            );
          })}
        </div>

        {/* TOC sidebar */}
        {headings.length > 0 && (
          <TableOfContents
            headings={headings}
            activeId={activeId}
            accentColor={textColor}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
          />
        )}
      </div>
    </>
  );
}
