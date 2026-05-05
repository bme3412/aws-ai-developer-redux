'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection = React.memo(function CollapsibleSection({
  id,
  title,
  isExpanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 group text-left py-3 border-b border-gray-200 hover:border-gray-300 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`section-content-${id}`}
      >
        <ChevronDown
          className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 flex-shrink-0 ${
            isExpanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
        <h2 className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
          {title}
        </h2>
      </button>

      <div
        id={`section-content-${id}`}
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="pt-4">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
});

export default CollapsibleSection;
