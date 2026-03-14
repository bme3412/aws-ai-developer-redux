'use client';

import { useState } from 'react';
import studyPlanData from '@/data/study-plan.json';
import { Calendar, CheckCircle, Clock, Target, BookOpen, Lightbulb } from 'lucide-react';

export default function StudyPlanPage() {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);

  return (
    <div className="flex">
      <div className="flex-1 max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">4-Week Study Plan</h1>
          <p className="text-gray-600 mt-1">
            Structured preparation for the AWS Certified AI Practitioner (AIP-C01) exam.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Total Study Time</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{studyPlanData.totalHours} hours</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <Target className="w-5 h-5" />
              <span className="font-semibold">Practice Questions</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{studyPlanData.totalQuestions}+</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold">Duration</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">4 weeks</p>
          </div>
        </div>

        {/* Study Tips */}
        <div className="mb-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <Lightbulb className="w-5 h-5" />
            <h3 className="font-semibold">Study Tips</h3>
          </div>
          <ul className="space-y-1 text-sm text-amber-800">
            {studyPlanData.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Weekly Plan */}
        <div className="space-y-4">
          {studyPlanData.weeks.map(week => (
            <div
              key={week.week}
              className="rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Week Header */}
              <button
                onClick={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)}
                className="w-full p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    W{week.week}
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-gray-900">{week.title}</h2>
                    <p className="text-sm text-gray-600">{week.focus}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Domains: {week.domains.join(', ')}</span>
                  <span>{week.practiceQuestions} questions</span>
                  <span className={`transition-transform ${expandedWeek === week.week ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </button>

              {/* Week Content */}
              {expandedWeek === week.week && (
                <div className="p-4 bg-white">
                  {/* Goals */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Weekly Goals</h3>
                    <ul className="space-y-1">
                      {week.goals.map((goal, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Daily Tasks */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Daily Schedule</h3>
                    <div className="space-y-3">
                      {week.tasks.map((task, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                Day {task.day}
                              </span>
                              <span className="font-medium text-gray-900 text-sm">{task.activity}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {task.timeMinutes} min
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{task.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Services */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Services This Week</h3>
                    <div className="flex flex-wrap gap-2">
                      {week.keyServices.map(service => (
                        <span
                          key={service}
                          className="px-2 py-1 bg-amber-50 text-amber-700 text-xs border border-amber-200 rounded"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Getting Started */}
        <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-semibold">Ready to Start?</h3>
          </div>
          <p className="text-sm text-green-800 mb-3">
            Begin with Week 1 by exploring the Domain 1 content in the Learn section.
            This plan assumes 5-8 hours of study per week.
          </p>
          <a
            href="/learn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Start Learning
          </a>
        </div>
      </div>
    </div>
  );
}
