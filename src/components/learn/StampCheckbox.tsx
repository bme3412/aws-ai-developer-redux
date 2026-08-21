'use client';

import { Check } from 'lucide-react';
import { formatSkillCompletedAt } from '@/lib/progress';

interface StampCheckboxProps {
  completedAt?: string;
  bursting?: boolean;
  onToggle: () => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  showTimestamp?: boolean;
}

export default function StampCheckbox({
  completedAt,
  bursting = false,
  onToggle,
  ariaLabel,
  size = 'md',
  showTimestamp = false,
}: StampCheckboxProps) {
  const box = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const icon = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span className="inline-flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className={`relative ${box} rounded-full flex items-center justify-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 ${
          completedAt
            ? 'bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.18)]'
            : 'border-2 border-gray-300 bg-white text-transparent hover:border-emerald-400 hover:bg-emerald-50'
        } ${bursting ? 'skill-check-pop' : 'transition-colors duration-200'}`}
        aria-pressed={Boolean(completedAt)}
        aria-label={ariaLabel}
      >
        <Check className={`${icon} ${completedAt ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
        {bursting && (
          <span className="skill-burst" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="skill-spark" style={{ '--i': i } as React.CSSProperties} />
            ))}
          </span>
        )}
      </button>
      {showTimestamp && completedAt && (
        <span className="text-[11px] text-emerald-700 font-medium tabular-nums skill-time-in">
          {formatSkillCompletedAt(completedAt)}
        </span>
      )}
    </span>
  );
}

export function StampToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="skill-stamp-toast" role="status" aria-live="polite">
      <span className="skill-stamp-toast-mark" aria-hidden>
        ✓
      </span>
      <span>{message}</span>
    </div>
  );
}
