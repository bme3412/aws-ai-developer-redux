'use client';

import React, { useState } from 'react';
import { Check, List } from 'lucide-react';
import { extractSkillId, TocHeading } from '@/lib/markdown-utils';
import { useSkillProgress } from './SkillProgressContext';

interface TableOfContentsProps {
  headings: TocHeading[];
  activeId: string | null;
  accentColor: string;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

const TableOfContents = React.memo(function TableOfContents({
  headings,
  activeId,
  accentColor,
  onExpandAll,
  onCollapseAll,
}: TableOfContentsProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const progress = useSkillProgress();

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileOpen(false);
  };

  const tocContent = (
    <nav aria-label="Table of contents">
      <ul className="space-y-1">
        {headings.map((heading) => {
          const skillId = extractSkillId(heading.text);
          const isDone = Boolean(skillId && progress?.completed[skillId]);
          return (
            <li key={heading.id}>
              <button
                onClick={() => handleClick(heading.id)}
                className={`flex items-start gap-1.5 w-full text-left text-sm py-1.5 px-3 rounded transition-colors duration-200 ${
                  heading.level === 3 ? 'pl-6' : ''
                } ${
                  activeId === heading.id
                    ? `${accentColor} font-medium border-l-2 border-current`
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {skillId && (
                  <Check
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                      isDone ? 'text-emerald-500' : 'text-gray-300'
                    }`}
                    strokeWidth={3}
                  />
                )}
                <span className={`line-clamp-2 ${isDone ? 'text-gray-400' : ''}`}>{heading.text}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Expand/Collapse controls */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <button
            onClick={onExpandAll}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
          >
            Expand all
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={onCollapseAll}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
          >
            Collapse all
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop TOC - sticky sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 py-4 will-change-[transform]">
          {tocContent}
        </div>
      </aside>

      {/* Mobile TOC - floating button + slide-up panel */}
      <div className="lg:hidden">
        {/* Floating TOC button */}
        {!mobileOpen && (
          <button
            onClick={() => setMobileOpen(true)}
            className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Open table of contents"
          >
            <List className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Contents</span>
          </button>
        )}

        {/* Mobile panel */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto p-6 animate-slide-up">
              {tocContent}
            </div>
          </>
        )}
      </div>
    </>
  );
});

export default TableOfContents;
