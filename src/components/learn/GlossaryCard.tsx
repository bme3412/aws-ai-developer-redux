'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MarkdownText } from '@/lib/markdown';
import { generateSlug } from '@/lib/markdown-utils';
import type { GlossaryEntry } from '@/lib/active-learning-parsers';

const CATEGORY_STYLES: Record<string, { bar: string; chip: string; header: string }> = {
  'GenAI / AI': {
    bar: 'border-l-indigo-500',
    chip: 'bg-indigo-100 text-indigo-800',
    header: 'bg-indigo-50/70',
  },
  'Application / compute': {
    bar: 'border-l-emerald-500',
    chip: 'bg-emerald-100 text-emerald-800',
    header: 'bg-emerald-50/70',
  },
  'Integration / orchestration': {
    bar: 'border-l-sky-500',
    chip: 'bg-sky-100 text-sky-800',
    header: 'bg-sky-50/70',
  },
  Data: {
    bar: 'border-l-amber-500',
    chip: 'bg-amber-100 text-amber-900',
    header: 'bg-amber-50/70',
  },
  'Security / operations': {
    bar: 'border-l-rose-500',
    chip: 'bg-rose-100 text-rose-800',
    header: 'bg-rose-50/70',
  },
  'Architecture governance': {
    bar: 'border-l-slate-500',
    chip: 'bg-slate-200 text-slate-800',
    header: 'bg-slate-50',
  },
};

const SHORT_CATEGORY: Record<string, string> = {
  'GenAI / AI': 'AI',
  'Application / compute': 'Compute',
  'Integration / orchestration': 'Integration',
  Data: 'Data',
  'Security / operations': 'Security',
  'Architecture governance': 'Governance',
};

const FALLBACK = {
  bar: 'border-l-gray-400',
  chip: 'bg-gray-100 text-gray-700',
  header: 'bg-gray-50',
};

const FIELDS: { key: keyof GlossaryEntry; label: string }[] = [
  { key: 'what', label: 'What' },
  { key: 'problem', label: 'Solves' },
  { key: 'sits', label: 'Sits' },
  { key: 'use', label: 'Use' },
  { key: 'pricing', label: 'Pricing' },
];

export default function GlossaryCard({ entry }: { entry: GlossaryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const styles = CATEGORY_STYLES[entry.category] || FALLBACK;
  const shortCategory = SHORT_CATEGORY[entry.category] || entry.category;

  return (
    <article
      className={`glossary-card not-prose my-3 sm:my-5 rounded-xl border border-gray-200 border-l-4 ${styles.bar} bg-white shadow-sm overflow-hidden`}
    >
      <button
        type="button"
        className={`flex w-full items-start sm:items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 text-left ${styles.header} cursor-pointer sm:cursor-default sm:pointer-events-none border-b-0 sm:border-b sm:border-gray-200 ${
          expanded ? 'border-b border-gray-200' : ''
        }`}
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
      >
        <ChevronDown
          className={`w-4 h-4 mt-0.5 sm:hidden text-gray-400 shrink-0 transition-transform duration-200 ${
            expanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
        <h4 className="flex-1 min-w-0 text-[15px] sm:text-base font-semibold text-gray-900 leading-snug m-0 break-words">
          {entry.name}
        </h4>
        {entry.category ? (
          <span
            className={`shrink-0 max-w-[42%] sm:max-w-none text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-center leading-tight ${styles.chip}`}
          >
            <span className="sm:hidden">{shortCategory}</span>
            <span className="hidden sm:inline">{entry.category}</span>
          </span>
        ) : null}
      </button>

      <div className={expanded ? 'block' : 'hidden sm:block'}>
        <dl className="px-3 py-3 sm:px-4 space-y-2.5">
          {FIELDS.map(({ key, label }) => {
            const value = entry[key];
            if (!value) return null;
            return (
              <div
                key={key}
                className="grid grid-cols-1 sm:grid-cols-[5.5rem_1fr] gap-0.5 sm:gap-3 items-start"
              >
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 pt-0.5">
                  {label}
                </dt>
                <dd className="text-[13px] sm:text-sm text-gray-800 leading-relaxed m-0 break-words">
                  <MarkdownText>{value}</MarkdownText>
                </dd>
              </div>
            );
          })}
        </dl>

        {entry.cue ? (
          <div className="px-3 py-2.5 sm:px-4 bg-amber-50 border-t border-amber-100">
            <p className="text-[13px] sm:text-sm text-amber-950 leading-relaxed m-0 break-words">
              <span className="font-semibold text-amber-800">Exam cue. </span>
              <MarkdownText>{entry.cue}</MarkdownText>
            </p>
          </div>
        ) : null}

        {entry.confuse ? (
          <div className="px-3 py-2.5 sm:px-4 bg-rose-50/80 border-t border-rose-100">
            <p className="text-[13px] sm:text-sm text-rose-950 leading-relaxed m-0 break-words">
              <span className="font-semibold text-rose-800">Not. </span>
              <MarkdownText>{entry.confuse}</MarkdownText>
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function GlossaryGroup({ title }: { title: string }) {
  const styles = CATEGORY_STYLES[title] || FALLBACK;

  return (
    <div id={generateSlug(title)} className="not-prose mt-8 mb-3 sm:mt-10 sm:mb-4 first:mt-2 scroll-mt-24">
      <div className={`flex items-center gap-2 sm:gap-3 border-l-4 ${styles.bar} pl-2.5 sm:pl-3`}>
        <h3 className="min-w-0 text-xs sm:text-sm font-semibold uppercase tracking-wide sm:tracking-[0.14em] text-gray-700 m-0 break-words">
          {title}
        </h3>
        <div className="hidden sm:block flex-1 h-px bg-gray-200" />
      </div>
    </div>
  );
}
