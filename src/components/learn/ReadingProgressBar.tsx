'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface ReadingProgressBarProps {
  progress: number;
  readingTime: number;
  accentColor: string;
}

export default function ReadingProgressBar({
  progress,
  readingTime,
  accentColor,
}: ReadingProgressBarProps) {
  return (
    <>
      {/* Fixed progress bar below TopBar */}
      <div className="fixed top-[53px] left-0 right-0 z-40 h-[3px] bg-gray-100">
        <div
          className={`h-full ${accentColor} transition-all duration-150 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Reading time + progress info */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{readingTime} min read</span>
        </div>
        {progress > 0 && progress < 100 && (
          <span className="text-gray-400">{progress}% read</span>
        )}
        {progress >= 100 && (
          <span className="text-green-600 font-medium">Complete</span>
        )}
      </div>
    </>
  );
}
