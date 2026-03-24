"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type TrendPoint = { date: string; energia: number | null; performance: number | null };

export default function FeedbackTrendsChart({ data }: { data: TrendPoint[] }) {
  if (data.length < 3) return null;

  return (
    <div className="w-full mt-4 mb-2">
      <p className="text-xs text-gray-400 mb-1">Tus ultimos dias</p>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
            <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '10px' }} />
            <YAxis domain={[1, 5]} ticks={[1, 3, 5]} stroke="#9CA3AF" style={{ fontSize: '10px' }} />
            <Tooltip
              contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
              formatter={(val: number, name: string) => [val, name === 'energia' ? 'Energia' : 'Performance']}
            />
            <Line type="monotone" dataKey="energia" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} name="energia" />
            <Line type="monotone" dataKey="performance" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} name="performance" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
