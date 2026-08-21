'use client';

import { useState, useMemo } from 'react';
import catalogData from '@/data/aws-services-catalog.json';
import {
  Search,
  Map,
  ChevronDown,
  Database,
  Shield,
  Layers,
  Bot,
  Eye,
  BarChart2,
  Cpu,
  Box,
  Phone,
  Wrench,
  ArrowRightLeft,
  Globe,
  HardDrive,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  XCircle,
} from 'lucide-react';

type CatalogService = {
  name: string;
  summary: string;
  example: string;
  tags?: string[];
  detail?: string;
  chooseWhen?: string[];
  notFor?: string;
  vs?: string;
};

type CatalogCategory = {
  id: string;
  title: string;
  icon: string;
  color: string;
  services: CatalogService[];
};

const catalog = catalogData as { categories: CatalogCategory[] };

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart2,
  Layers,
  Cpu,
  Box,
  Phone,
  Database,
  Wrench,
  Bot,
  Eye,
  ArrowRightLeft,
  Globe,
  Shield,
  HardDrive,
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

const INVESTING_PREFIX = 'Investment angle:';

function isInvestingExample(example: string) {
  return example.startsWith(INVESTING_PREFIX);
}

function exampleBody(example: string) {
  return isInvestingExample(example)
    ? example.slice(INVESTING_PREFIX.length).trim()
    : example;
}

export default function ServiceGuidePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleToggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(catalog.categories.map(c => c.id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return catalog.categories
      .filter(cat => !selectedCategory || cat.id === selectedCategory)
      .map(cat => {
        if (!term) return cat;
        const categoryMatches = cat.title.toLowerCase().includes(term);
        const matchingServices = cat.services.filter(s =>
          s.name.toLowerCase().includes(term) ||
          s.summary.toLowerCase().includes(term) ||
          s.example.toLowerCase().includes(term) ||
          (s.detail || '').toLowerCase().includes(term) ||
          (s.vs || '').toLowerCase().includes(term) ||
          (s.notFor || '').toLowerCase().includes(term) ||
          (s.tags || []).some(t => t.toLowerCase().includes(term)) ||
          (s.chooseWhen || []).some(c => c.toLowerCase().includes(term))
        );
        if (categoryMatches) return cat;
        if (matchingServices.length === 0) return null;
        return { ...cat, services: matchingServices };
      })
      .filter((cat): cat is CatalogCategory => cat !== null);
  }, [searchTerm, selectedCategory]);

  const totalServices = catalog.categories.reduce((sum, c) => sum + c.services.length, 0);
  const visibleServices = filteredCategories.reduce((sum, c) => sum + c.services.length, 0);
  const searchActive = searchTerm.trim().length > 0;

  return (
    <div className="overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-3 md:px-6 py-6 md:py-8 pb-24 md:pb-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <Map className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AWS Services Reference</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            {catalog.categories.length} categories &middot; {totalServices} services
            {searchActive || selectedCategory ? (
              <span className="text-gray-400"> &middot; showing {visibleServices}</span>
            ) : null}
          </p>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search services, summaries, examples..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            />
          </div>
        </div>

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
          {catalog.categories.map(cat => {
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
                {cat.title}
              </button>
            );
          })}
        </div>

        <div className="mb-5 flex gap-3 text-xs">
          <button onClick={expandAll} className="text-orange-600 hover:text-orange-700 font-medium">
            Expand all
          </button>
          <span className="text-gray-300">|</span>
          <button onClick={collapseAll} className="text-orange-600 hover:text-orange-700 font-medium">
            Collapse all
          </button>
        </div>

        <div className="space-y-6">
          {filteredCategories.map(cat => {
            const colors = colorMap[cat.color] || colorMap.blue;
            const Icon = iconMap[cat.icon] || Database;
            const isExpanded = searchActive || expandedCategories.has(cat.id);

            return (
              <section key={cat.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <button
                  onClick={() => handleToggleCategory(cat.id)}
                  className="w-full flex items-center gap-3 px-4 md:px-5 py-4 text-left hover:bg-gray-50/80 transition-colors"
                  aria-expanded={isExpanded}
                >
                  <div className={`w-9 h-9 rounded-xl ${colors.light} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-[18px] h-[18px] ${colors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 text-[15px]">{cat.title}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{cat.services.length} {cat.services.length === 1 ? 'service' : 'services'}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? '' : '-rotate-90'}`} />
                </button>

                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className={`${colors.bg} border-t ${colors.border} px-3 md:px-5 py-5 space-y-5`}>
                      {cat.services.map((svc, i) => {
                        const investing = isInvestingExample(svc.example);
                        const n = String(i + 1).padStart(2, '0');
                        return (
                          <article
                            key={svc.name}
                            className="rounded-xl bg-white border border-gray-200/80 shadow-sm px-4 py-4 md:px-5 md:py-5"
                          >
                            <div className="flex items-start gap-3">
                              <span className={`mt-0.5 font-mono text-[11px] font-semibold tabular-nums ${colors.text} opacity-70`}>
                                {n}
                              </span>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-900 text-base leading-snug tracking-tight">
                                  {svc.name}
                                </h3>
                                {svc.tags && svc.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {svc.tags.map(tag => (
                                      <span
                                        key={tag}
                                        className={`px-2 py-0.5 text-[11px] font-medium rounded-md ${colors.pill}`}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                  {svc.summary}
                                </p>
                                {svc.detail && (
                                  <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                                    {svc.detail}
                                  </p>
                                )}

                                {(svc.chooseWhen || svc.notFor) && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                    {svc.chooseWhen && (
                                      <div className="rounded-lg bg-emerald-50/80 border border-emerald-100 px-3 py-2.5">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Use when</span>
                                        </div>
                                        <ul className="space-y-1.5">
                                          {svc.chooseWhen.map(item => (
                                            <li key={item} className="text-[13px] text-emerald-950 leading-snug flex gap-2">
                                              <span className="text-emerald-500 mt-0.5">•</span>
                                              <span>{item}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {svc.notFor && (
                                      <div className="rounded-lg bg-rose-50/70 border border-rose-100 px-3 py-2.5">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Not for</span>
                                        </div>
                                        <p className="text-[13px] text-rose-950 leading-relaxed">{svc.notFor}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {svc.vs && (
                                  <p className="mt-3 text-[13px] text-gray-500 leading-relaxed">
                                    <span className="font-semibold text-gray-700">Contrast. </span>
                                    {svc.vs}
                                  </p>
                                )}

                                <div className={`mt-4 pl-3 border-l-2 ${investing ? 'border-amber-400' : 'border-orange-300'}`}>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    {investing ? (
                                      <TrendingUp className="w-3 h-3 text-amber-600" />
                                    ) : (
                                      <Lightbulb className="w-3 h-3 text-orange-500" />
                                    )}
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${investing ? 'text-amber-700' : 'text-orange-600'}`}>
                                      {investing ? 'Investing' : 'On the desk'}
                                    </span>
                                  </div>
                                  <p className="text-[13px] text-gray-700 leading-relaxed">
                                    {exampleBody(svc.example)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            No services match your search.
          </div>
        )}
      </div>
    </div>
  );
}
