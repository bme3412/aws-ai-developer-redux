'use client';

import React from 'react';
import { Lightbulb, AlertTriangle, BookmarkCheck, Info } from 'lucide-react';

export type CalloutType = 'exam-tip' | 'exam-trap' | 'warning' | 'key-concept' | 'info';

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
  'exam-trap': {
    icon: AlertTriangle,
    label: 'Exam Trap',
    borderColor: 'border-l-orange-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    labelColor: 'text-orange-800',
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

export function detectCalloutType(textContent: string): CalloutType | null {
  const start = textContent.trim().replace(/^\*+/, '').toLowerCase();
  if (start.startsWith('exam tip') || start.startsWith('💡')) return 'exam-tip';
  if (start.startsWith('exam trap')) return 'exam-trap';
  if (start.startsWith('warning') || start.startsWith('important') || start.startsWith('⚠')) return 'warning';
  if (start.startsWith('key concept') || start.startsWith('mental shortcut')) return 'key-concept';
  if (start.startsWith('note:') || start.startsWith('note ') || start.startsWith('ℹ️')) return 'info';
  return null;
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
