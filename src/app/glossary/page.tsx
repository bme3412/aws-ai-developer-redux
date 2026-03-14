'use client';

import { useState } from 'react';
import glossaryData from '@/data/glossary.json';
import { Book, Search, Tag } from 'lucide-react';

export default function GlossaryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTerms = glossaryData.terms.filter(term => {
    const matchesSearch = searchTerm === '' ||
      term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === null || term.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = Object.entries(glossaryData.categories);

  return (
    <div className="flex">
      <div className="flex-1 max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Glossary</h1>
          <p className="text-gray-600 mt-1">
            Key terms and concepts for the AWS Certified AI Practitioner exam.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Terms List */}
        <div className="space-y-4">
          {filteredTerms.map(term => (
            <div
              key={term.id}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Book className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{term.term}</h3>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      {glossaryData.categories[term.category as keyof typeof glossaryData.categories]}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{term.definition}</p>
                  {term.relatedServices.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <div className="flex flex-wrap gap-1">
                        {term.relatedServices.map(service => (
                          <span
                            key={service}
                            className="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTerms.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No terms found matching your search.
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500 text-center">
          {glossaryData.terms.length} terms total
        </div>
      </div>
    </div>
  );
}
