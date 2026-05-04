'use client';

import React from 'react';
import { Lightbulb, AlertTriangle, BookmarkCheck, Info } from 'lucide-react';

export type CalloutType = 'exam-tip' | 'warning' | 'key-concept' | 'info';

interface ExamTipCalloutProps {
  type: CalloutType;
  children: React.ReactNode;
}

const calloutConfig: Record<CalloutType, {
  icon: React.ElementType;
  label: string;
  borderColor: string;
  bgColor: string;
  iconColor: string;
  labelColor: string;
}> = {
  'exam-tip': {
    icon: Lightbulb,
    label: 'Exam Tip',
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
    labelColor: 'text-amber-800',
  },
  'warning': {
    icon: AlertTriangle,
    label: 'Important',
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-500',
    labelColor: 'text-red-800',
  },
  'key-concept': {
    icon: BookmarkCheck,
    label: 'Key Concept',
    borderColor: 'border-l-green-500',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    labelColor: 'text-green-800',
  },
  'info': {
    icon: Info,
    label: 'Note',
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500',
    labelColor: 'text-blue-800',
  },
};

export function detectCalloutType(textContent: string): CalloutType {
  const lower = textContent.toLowerCase();
  if (lower.includes('exam tip') || lower.includes('💡')) return 'exam-tip';
  if (lower.includes('warning') || lower.includes('important') || lower.includes('⚠')) return 'warning';
  if (/^\*?\*?\d+\./.test(textContent.trim())) return 'key-concept';
  return 'info';
}

export default function ExamTipCallout({ type, children }: ExamTipCalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div className={`border-l-4 ${config.borderColor} ${config.bgColor} rounded-r-lg p-4 my-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
        <span className={`text-sm font-semibold ${config.labelColor}`}>{config.label}</span>
      </div>
      <div className="text-gray-700 text-sm leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
        {children}
      </div>
    </div>
  );
}
