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
  if (data.length < 2) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Accuracy Trend</h3>
        <div className="flex items-center justify-center h-48 text-sm text-gray-400">
          Complete more practice sessions to see your accuracy trend.
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
              dot={{ r: 3, fill: '#3b82f6' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
