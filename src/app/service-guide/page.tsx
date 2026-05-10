'use client';

import { useState, useMemo } from 'react';
import guideData from '@/data/service-decision-guide.json';
import Link from 'next/link';
import {
  Search,
  Map,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Tag,
  Hash,
  Database,
  Shield,
  Layers,
  DollarSign,
  Bot,
  Eye,
  Lock,
  Rocket,
  BarChart2,
  HeartHandshake,
  FileText,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Database,
  Shield,
  Layers,
  DollarSign,
  Bot,
  Eye,
  Lock,
  Rocket,
  BarChart2,
  HeartHandshake,
  FileText,
};

const colorMap: Record<string, { bg: string; border: string; text: string; light: string; pill: string }> = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    light: 'bg-blue-100',    pill: 'bg-blue-100 text-blue-700' },
  red:     { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     light: 'bg-red-100',     pill: 'bg-red-100 text-red-700' },
  purple:  { bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700',  light: 'bg-purple-100',  pill: 'bg-purple-100 text-purple-700' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', light: 'bg-emerald-100', pill: 'bg-emerald-100 text-emerald-700' },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  light: 'bg-violet-100',  pill: 'bg-violet-100 text-violet-700' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   light: 'bg-amber-100',   pill: 'bg-amber-100 text-amber-700' },
  rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    light: 'bg-rose-100',    pill: 'bg-rose-100 text-rose-700' },
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700',  light: 'bg-indigo-100',  pill: 'bg-indigo-100 text-indigo-700' },
  teal:    { bg: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-700',    light: 'bg-teal-100',    pill: 'bg-teal-100 text-teal-700' },
  pink:    { bg: 'bg-pink-50',    border: 'border-pink-200',    text: 'text-pink-700',    light: 'bg-pink-100',    pill: 'bg-pink-100 text-pink-700' },
  sky:     { bg: 'bg-sky-50',     border: 'border-sky-200',     text: 'text-sky-700',     light: 'bg-sky-100',     pill: 'bg-sky-100 text-sky-700' },
};

export default function ServiceGuidePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(guideData.categories.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return guideData.categories
      .filter(cat => {
        if (selectedCategory && cat.id !== selectedCategory) return false;
        if (!term) return true;

        // Search across category title/subtitle
        if (cat.title.toLowerCase().includes(term)) return true;
        if (cat.subtitle.toLowerCase().includes(term)) return true;

        // Search across decision patterns
        if (cat.decisionPatterns.some(p =>
          p.signal.toLowerCase().includes(term) ||
          p.answer.toLowerCase().includes(term) ||
          p.notAnswer.toLowerCase().includes(term)
        )) return true;

        // Search across services
        if (cat.services.some(s =>
          s.name.toLowerCase().includes(term) ||
          s.whatItDoes.toLowerCase().includes(term) ||
          s.examKeywords.some(k => k.toLowerCase().includes(term)) ||
          s.commonTraps.some(t => t.toLowerCase().includes(term))
        )) return true;

        return false;
      });
  }, [searchTerm, selectedCategory]);

  const totalPatterns = guideData.categories.reduce((sum, c) => sum + c.decisionPatterns.length, 0);
  const totalServices = guideData.categories.reduce((sum, c) => sum + c.services.length, 0);
  const totalQuestions = new Set(guideData.categories.flatMap(c => c.questionIds)).size;

  return (
    <div className="flex">
      <div className="flex-1 max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Service Decision Guide</h1>
              <p className="text-gray-500 text-sm">Exam-ready decision patterns derived from 60 official practice questions</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <div className="text-xl font-bold text-gray-900">{guideData.categories.length}</div>
            <div className="text-xs text-gray-500">Decision Categories</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <div className="text-xl font-bold text-gray-900">{totalPatterns}</div>
            <div className="text-xs text-gray-500">If/Then Patterns</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <div className="text-xl font-bold text-gray-900">{totalServices}</div>
            <div className="text-xs text-gray-500">Service Entries</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services, exam keywords, decision patterns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium whitespace-nowrap flex-shrink-0 ${
              selectedCategory === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {guideData.categories.map(cat => {
            const colors = colorMap[cat.color] || colorMap.blue;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? `${colors.light} ${colors.text}`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.title.length > 30 ? cat.title.slice(0, 27) + '...' : cat.title}
              </button>
            );
          })}
        </div>

        {/* Expand/Collapse All */}
        <div className="mb-6 flex gap-3 text-xs">
          <button onClick={expandAll} className="text-orange-600 hover:text-orange-700 font-medium">
            Expand all
          </button>
          <span className="text-gray-300">|</span>
          <button onClick={collapseAll} className="text-orange-600 hover:text-orange-700 font-medium">
            Collapse all
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {filteredCategories.map(cat => {
            const colors = colorMap[cat.color] || colorMap.blue;
            const Icon = iconMap[cat.icon] || Database;
            const isExpanded = expandedCategories.has(cat.id);

            return (
              <div key={cat.id} className={`rounded-lg border ${colors.border} overflow-hidden`}>
                {/* Category Header */}
                <button
                  onClick={() => handleToggle(cat.id)}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:opacity-90 ${colors.bg}`}
                  aria-expanded={isExpanded}
                >
                  <div className={`w-9 h-9 rounded-lg ${colors.light} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-gray-900 text-sm md:text-base">{cat.title}</h2>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${colors.pill} font-medium`}>
                        {cat.questionIds.length} Qs
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{cat.subtitle}</p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? '' : '-rotate-90'}`} />
                </button>

                {/* Expandable Content */}
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="px-3 md:px-4 pb-4 pt-2 space-y-4 bg-white">

                      {/* Decision Patterns */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5" />
                          Decision Patterns
                        </h3>
                        <div className="space-y-2">
                          {cat.decisionPatterns.map((pattern, i) => (
                            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                                <p className="text-xs text-gray-700">
                                  <span className="font-medium text-gray-500">If the question says:</span>{' '}
                                  <span className="font-semibold text-gray-900">{pattern.signal}</span>
                                </p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                                <div className="px-3 py-2 bg-green-50/50">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                    <span className="text-xs font-semibold text-green-700 uppercase">Choose</span>
                                  </div>
                                  <p className="text-xs text-green-800">{pattern.answer}</p>
                                </div>
                                <div className="px-3 py-2 bg-red-50/50">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                                    <span className="text-xs font-semibold text-red-600 uppercase">Avoid</span>
                                  </div>
                                  <p className="text-xs text-red-800">{pattern.notAnswer}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Services */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          Services & Features
                        </h3>
                        <div className="space-y-3">
                          {cat.services.map((svc, i) => (
                            <div key={i} className="border border-gray-200 rounded-lg p-3">
                              <h4 className="font-semibold text-gray-900 text-sm mb-1">{svc.name}</h4>
                              <p className="text-xs text-gray-600 mb-3">{svc.whatItDoes}</p>

                              {/* When to Choose */}
                              <div className="mb-2">
                                <div className="text-xs font-medium text-green-700 mb-1">Choose when:</div>
                                <div className="flex flex-wrap gap-1">
                                  {svc.whenToChoose.map((reason, j) => (
                                    <span key={j} className="inline-block px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded border border-green-200">
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Exam Keywords */}
                              <div className="mb-2">
                                <div className="text-xs font-medium text-blue-700 mb-1">Exam keywords:</div>
                                <div className="flex flex-wrap gap-1">
                                  {svc.examKeywords.map((kw, j) => (
                                    <span key={j} className="inline-block px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200 font-mono">
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* When NOT to Choose */}
                              <div className="mb-2">
                                <div className="text-xs font-medium text-red-600 mb-1">Avoid when:</div>
                                <div className="flex flex-wrap gap-1">
                                  {svc.whenNotToChoose.map((reason, j) => (
                                    <span key={j} className="inline-block px-2 py-0.5 text-xs bg-red-50 text-red-600 rounded border border-red-200">
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Common Traps */}
                              {svc.commonTraps.length > 0 && (
                                <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                                  <div className="flex items-start gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-amber-800 space-y-1">
                                      {svc.commonTraps.map((trap, j) => (
                                        <p key={j}>{trap}</p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Question IDs */}
                              <div className="mt-2">
                                <div className="text-xs text-gray-400 mb-1">Tested in:</div>
                                <div className="flex flex-wrap gap-1">
                                  {svc.questionIds.map(qid => (
                                    <Link
                                      key={qid}
                                      href="/official-practice"
                                      className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded hover:bg-orange-100 hover:text-orange-700 transition-colors font-mono"
                                    >
                                      {qid}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Category Question IDs */}
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-400">All questions in this category:</span>
                          {cat.questionIds.map(qid => (
                            <Link
                              key={qid}
                              href="/official-practice"
                              className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded hover:bg-orange-100 hover:text-orange-700 transition-colors font-mono"
                            >
                              {qid}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No categories match your search.
          </div>
        )}

        <div className="mt-8 text-sm text-gray-400 text-center">
          {filteredCategories.length} of {guideData.categories.length} categories
          {' '}&middot; {totalQuestions} questions covered &middot; {totalServices} service entries
        </div>
      </div>
    </div>
  );
}
