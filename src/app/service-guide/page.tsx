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
  Zap,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Database, Shield, Layers, DollarSign, Bot, Eye, Lock, Rocket, BarChart2, HeartHandshake, FileText,
};

const colorMap: Record<string, { bg: string; border: string; text: string; light: string; pill: string; accent: string }> = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    light: 'bg-blue-100',    pill: 'bg-blue-100 text-blue-700',    accent: 'border-l-blue-400' },
  red:     { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     light: 'bg-red-100',     pill: 'bg-red-100 text-red-700',     accent: 'border-l-red-400' },
  purple:  { bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700',  light: 'bg-purple-100',  pill: 'bg-purple-100 text-purple-700',  accent: 'border-l-purple-400' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', light: 'bg-emerald-100', pill: 'bg-emerald-100 text-emerald-700', accent: 'border-l-emerald-400' },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  light: 'bg-violet-100',  pill: 'bg-violet-100 text-violet-700',  accent: 'border-l-violet-400' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   light: 'bg-amber-100',   pill: 'bg-amber-100 text-amber-700',   accent: 'border-l-amber-400' },
  rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    light: 'bg-rose-100',    pill: 'bg-rose-100 text-rose-700',    accent: 'border-l-rose-400' },
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700',  light: 'bg-indigo-100',  pill: 'bg-indigo-100 text-indigo-700',  accent: 'border-l-indigo-400' },
  teal:    { bg: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-700',    light: 'bg-teal-100',    pill: 'bg-teal-100 text-teal-700',    accent: 'border-l-teal-400' },
  pink:    { bg: 'bg-pink-50',    border: 'border-pink-200',    text: 'text-pink-700',    light: 'bg-pink-100',    pill: 'bg-pink-100 text-pink-700',    accent: 'border-l-pink-400' },
  sky:     { bg: 'bg-sky-50',     border: 'border-sky-200',     text: 'text-sky-700',     light: 'bg-sky-100',     pill: 'bg-sky-100 text-sky-700',     accent: 'border-l-sky-400' },
};

export default function ServiceGuidePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleToggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleService = (key: string) => {
    setExpandedServices(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(guideData.categories.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
    setExpandedServices(new Set());
  };

  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return guideData.categories.filter(cat => {
      if (selectedCategory && cat.id !== selectedCategory) return false;
      if (!term) return true;
      if (cat.title.toLowerCase().includes(term)) return true;
      if (cat.subtitle.toLowerCase().includes(term)) return true;
      if (cat.decisionPatterns.some(p =>
        p.signal.toLowerCase().includes(term) ||
        p.answer.toLowerCase().includes(term) ||
        p.notAnswer.toLowerCase().includes(term)
      )) return true;
      if (cat.services.some(s =>
        s.name.toLowerCase().includes(term) ||
        s.whatItDoes.toLowerCase().includes(term) ||
        s.examKeywords.some(k => k.toLowerCase().includes(term)) ||
        s.commonTraps.some(t => t.toLowerCase().includes(term))
      )) return true;
      return false;
    });
  }, [searchTerm, selectedCategory]);

  const totalServices = guideData.categories.reduce((sum, c) => sum + c.services.length, 0);

  return (
    <div className="flex">
      <div className="flex-1 max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <Map className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Service Decision Guide</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            {guideData.categories.length} categories &middot; {totalServices} services &middot; derived from 60 practice questions
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search services, keywords, patterns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-2.5 py-1 text-xs rounded-full transition-colors font-medium whitespace-nowrap flex-shrink-0 ${
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
                className={`px-2.5 py-1 text-xs rounded-full transition-colors font-medium whitespace-nowrap flex-shrink-0 ${
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
        <div className="mb-5 flex gap-3 text-xs">
          <button onClick={expandAll} className="text-orange-600 hover:text-orange-700 font-medium">
            Expand all
          </button>
          <span className="text-gray-300">|</span>
          <button onClick={collapseAll} className="text-orange-600 hover:text-orange-700 font-medium">
            Collapse all
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {filteredCategories.map(cat => {
            const colors = colorMap[cat.color] || colorMap.blue;
            const Icon = iconMap[cat.icon] || Database;
            const isExpanded = expandedCategories.has(cat.id);

            return (
              <div key={cat.id} className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {/* Category Header */}
                <button
                  onClick={() => handleToggleCategory(cat.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left bg-white hover:bg-gray-50 transition-colors"
                  aria-expanded={isExpanded}
                >
                  <div className={`w-8 h-8 rounded-lg ${colors.light} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 text-sm">{cat.title}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{cat.services.length} services &middot; {cat.decisionPatterns.length} patterns</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? '' : '-rotate-90'}`} />
                </button>

                {/* Expandable Content */}
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-gray-100">

                      {/* Quick Decision Patterns — clean table */}
                      <div className="px-4 py-3 bg-gray-50/70">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                          If you see this in a question...
                        </h3>
                        <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
                          {cat.decisionPatterns.map((pattern, i) => (
                            <div key={i} className="px-3 py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                              <p className="text-xs text-gray-900 font-medium sm:w-2/5 leading-snug shrink-0">
                                {pattern.signal}
                              </p>
                              <div className="flex items-baseline gap-1.5 sm:flex-1 min-w-0">
                                <span className="text-green-500 text-sm leading-none shrink-0">&#10132;</span>
                                <p className="text-xs text-green-800 font-medium leading-snug">{pattern.answer}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Service Cards */}
                      <div className="px-4 py-3 space-y-2">
                        {cat.services.map((svc, i) => {
                          const svcKey = `${cat.id}-${i}`;
                          const isSvcExpanded = expandedServices.has(svcKey);
                          return (
                            <div key={i} className={`rounded-lg border-l-4 ${colors.accent} bg-white border border-gray-200 overflow-hidden`}>
                              {/* Service Header — always visible */}
                              <button
                                onClick={() => handleToggleService(svcKey)}
                                className="w-full text-left px-3 py-2.5 hover:bg-gray-50/50 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 text-sm leading-tight">{svc.name}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{svc.whatItDoes}</p>
                                  </div>
                                  <ChevronDown className={`w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0 transition-transform ${isSvcExpanded ? '' : '-rotate-90'}`} />
                                </div>

                                {/* Exam keywords — always visible as the "hook" */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {svc.examKeywords.map((kw, j) => (
                                    <span key={j} className={`px-1.5 py-0.5 text-[10px] rounded ${colors.pill} font-medium`}>
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              </button>

                              {/* Expandable detail */}
                              <div
                                className="grid transition-[grid-template-rows] duration-200 ease-in-out"
                                style={{ gridTemplateRows: isSvcExpanded ? '1fr' : '0fr' }}
                              >
                                <div className="overflow-hidden">
                                  <div className="px-3 pb-3 space-y-2.5 border-t border-gray-100 pt-2.5">

                                    {/* Choose / Avoid — side by side */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div className="rounded-lg bg-green-50 p-2.5">
                                        <div className="flex items-center gap-1 mb-1.5">
                                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                          <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Use when</span>
                                        </div>
                                        <ul className="space-y-1">
                                          {svc.whenToChoose.map((r, j) => (
                                            <li key={j} className="text-xs text-green-800 leading-snug flex gap-1.5">
                                              <span className="text-green-400 mt-0.5">-</span>
                                              {r}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div className="rounded-lg bg-red-50 p-2.5">
                                        <div className="flex items-center gap-1 mb-1.5">
                                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                                          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Not for</span>
                                        </div>
                                        <ul className="space-y-1">
                                          {svc.whenNotToChoose.map((r, j) => (
                                            <li key={j} className="text-xs text-red-700 leading-snug flex gap-1.5">
                                              <span className="text-red-300 mt-0.5">-</span>
                                              {r}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>

                                    {/* Common Trap */}
                                    {svc.commonTraps.length > 0 && (
                                      <div className="rounded-lg bg-amber-50 p-2.5 flex gap-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <div className="space-y-1">
                                          {svc.commonTraps.map((trap, j) => (
                                            <p key={j} className="text-xs text-amber-800 leading-snug">
                                              <span className="font-semibold">Trap: </span>{trap}
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Question links */}
                                    <div className="flex items-center gap-1.5 pt-1">
                                      <Zap className="w-3 h-3 text-gray-300" />
                                      <span className="text-[10px] text-gray-400 font-medium">Practice:</span>
                                      {svc.questionIds.map(qid => (
                                        <Link
                                          key={qid}
                                          href="/official-practice"
                                          className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded hover:bg-orange-100 hover:text-orange-600 transition-colors font-mono"
                                        >
                                          {qid}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            No categories match your search.
          </div>
        )}
      </div>
    </div>
  );
}
