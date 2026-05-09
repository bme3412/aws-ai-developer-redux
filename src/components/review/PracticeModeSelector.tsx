'use client';

import Link from 'next/link';
import { Shuffle, Clock, Flame, Target, Brain } from 'lucide-react';

const modes = [
  {
    key: 'practice',
    label: 'Random',
    description: '20 random questions',
    icon: Shuffle,
    color: 'text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-300',
  },
  {
    key: 'quick',
    label: 'Quick Quiz',
    description: '10 questions, 15 min',
    icon: Clock,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:border-emerald-300',
  },
  {
    key: 'hard',
    label: 'Hard Mode',
    description: 'Medium + hard only',
    icon: Flame,
    color: 'text-red-600 bg-red-50 border-red-200 hover:border-red-300',
  },
  {
    key: 'weak-areas',
    label: 'Weak Areas',
    description: 'Focus on gaps',
    icon: Target,
    color: 'text-amber-600 bg-amber-50 border-amber-200 hover:border-amber-300',
  },
  {
    key: 'adaptive',
    label: 'Adaptive',
    description: 'Smart difficulty mix',
    icon: Brain,
    color: 'text-violet-600 bg-violet-50 border-violet-200 hover:border-violet-300',
  },
];

export default function PracticeModeSelector() {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Practice Modes</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 sm:overflow-visible">
        {modes.map(({ key, label, description, icon: Icon, color }) => (
          <Link
            key={key}
            href={`/review?mode=${key}`}
            className={`border rounded-xl p-4 text-center transition-colors flex-shrink-0 w-36 sm:w-auto ${color}`}
          >
            <Icon className="w-5 h-5 mx-auto mb-2" />
            <div className="text-sm font-semibold">{label}</div>
            <div className="text-xs opacity-75 mt-0.5">{description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
