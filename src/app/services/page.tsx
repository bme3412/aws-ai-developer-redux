'use client';

import { useState } from 'react';
import servicesData from '@/data/services.json';
import { Cloud, Search, Star, Tag } from 'lucide-react';

// Tier 1 services - must know for the exam
const tier1Services = [
  'Amazon Bedrock',
  'Amazon Bedrock Knowledge Bases',
  'Amazon Bedrock Guardrails',
  'Amazon Bedrock Agents',
  'Amazon Bedrock Prompt Management',
  'Amazon Bedrock Model Evaluations',
  'AWS Lambda',
  'Amazon S3',
  'Amazon OpenSearch Service',
  'AWS Step Functions',
  'Amazon CloudWatch',
  'AWS X-Ray',
  'Amazon API Gateway',
  'AWS IAM',
  'AWS KMS',
  'Amazon VPC'
];

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<'all' | 'tier1' | 'tier2'>('all');

  // Get unique categories
  const categories = [...new Set(servicesData.services.map(s => s.category))].sort();

  const filteredServices = servicesData.services.filter(service => {
    const matchesSearch = searchTerm === '' ||
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === null || service.category === selectedCategory;

    const isTier1 = tier1Services.includes(service.name);
    const matchesTier = tierFilter === 'all' ||
      (tierFilter === 'tier1' && isTier1) ||
      (tierFilter === 'tier2' && !isTier1);

    return matchesSearch && matchesCategory && matchesTier;
  });

  return (
    <div className="flex">
      <div className="flex-1 max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AWS Services Reference</h1>
          <p className="text-gray-600 mt-1">
            AWS services relevant to the AIP-C01 exam, organized by tier and category.
          </p>
        </div>

        {/* Tier Legend */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Service Tiers</h3>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-gray-600"><strong>Tier 1:</strong> Must-know services - expect multiple questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600"><strong>Tier 2:</strong> Good to know - may appear in context</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Tier Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setTierFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  tierFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Tiers
              </button>
              <button
                onClick={() => setTierFilter('tier1')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                  tierFilter === 'tier1'
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Star className="w-3 h-3" />
                Tier 1 Only
              </button>
              <button
                onClick={() => setTierFilter('tier2')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  tierFilter === 'tier2'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tier 2 Only
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {filteredServices.map(service => {
            const isTier1 = tier1Services.includes(service.name);
            return (
              <div
                key={service.name}
                className={`p-4 bg-white rounded-lg border transition-colors ${
                  isTier1 ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isTier1 ? 'bg-amber-100' : 'bg-gray-100'
                  }`}>
                    {isTier1 ? (
                      <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
                    ) : (
                      <Cloud className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{service.name}</h3>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {service.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                    <div className="p-2 bg-blue-50 rounded text-sm text-blue-800">
                      <strong className="text-blue-900">Exam Focus:</strong> {service.examRelevance}
                    </div>
                    {service.relatedTasks.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Tasks: {service.relatedTasks.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No services found matching your filters.
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500 text-center">
          Showing {filteredServices.length} of {servicesData.services.length} services
          {' '}({tier1Services.length} Tier 1, {servicesData.services.length - tier1Services.length} Tier 2)
        </div>
      </div>
    </div>
  );
}
