'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { useReadingProgress } from '@/hooks/useReadingProgress';

interface ReadingProgressBarProps {
  progress: number;
  readingTime: number;
  accentColor: string;
}

function ReadingProgressBar({
  progress,
  readingTime,
  accentColor,
}: ReadingProgressBarProps) {
  return (
    <>
      {/* Fixed progress bar below TopBar */}
      <div className="fixed top-[53px] left-0 right-0 z-40 h-[3px] bg-gray-100">
        <div
          className={`h-full w-full ${accentColor} transition-transform duration-200 ease-out origin-left`}
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      </div>

      {/* Reading time + progress info */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{readingTime} min read</span>
        </div>
        <span className={progress >= 100 ? 'text-green-600 font-medium' : 'text-gray-400'}>
          {progress <= 0 ? '\u00A0' : progress >= 100 ? 'Complete' : `${progress}% read`}
        </span>
      </div>
    </>
  );
}

/** Self-contained wrapper that owns the reading progress state */
export function ReadingProgressBarContainer({
  contentRef,
  readingTime,
  accentColor,
}: {
  contentRef: React.RefObject<HTMLElement | null>;
  readingTime: number;
  accentColor: string;
}) {
  const progress = useReadingProgress(contentRef);
  return (
    <ReadingProgressBar
      progress={progress}
      readingTime={readingTime}
      accentColor={accentColor}
    />
  );
}

export default ReadingProgressBar;
