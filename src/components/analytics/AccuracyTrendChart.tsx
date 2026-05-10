'use client';

import { AccuracyDataPoint } from '@/lib/analytics';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function AccuracyTrendChart({ data }: { data: AccuracyDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Accuracy Trend</h3>
        <div className="flex items-center justify-center h-48 text-sm text-gray-400">
          Complete practice questions to see your accuracy trend.
        </div>
      </div>
    );
  }

  // For a single data point, show a summary card instead of a line chart
  if (data.length === 1) {
    const point = data[0];
    const parts = point.date.split('-');
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Accuracy Trend</h3>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">{point.accuracy}%</div>
            <p className="text-sm text-gray-500 mt-1">{point.count} questions on {parts[1]}/{parts[2]}</p>
            <p className="text-xs text-gray-400 mt-2">Keep practicing to see your trend over time</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Accuracy Trend</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(d: string) => {
                const parts = d.split('-');
                return `${parts[1]}/${parts[2]}`;
              }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(v: number) => `${v}%`}
              width={40}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Accuracy']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
