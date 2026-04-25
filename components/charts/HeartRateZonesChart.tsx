"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface HeartRateZoneData {
  zone: string;
  minutes: number;
  percentage: number;
  range: string;
}

interface HeartRateZonesChartProps {
  data: HeartRateZoneData[];
  loading?: boolean;
}

const ZONE_COLORS = {
  "Zone 1": "#6B7280",  // Gray - Recovery
  "Zone 2": "#3B82F6",  // Blue - Aerobic
  "Zone 3": "#10B981",  // Green - Tempo
  "Zone 4": "#F59E0B",  // Amber - Threshold
  "Zone 5": "#EF4444",  // Red - Maximum
};

export default function HeartRateZonesChart({
  data,
  loading = false
}: HeartRateZonesChartProps) {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-gray-400">Loading chart data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center bg-gray-50 rounded-lg">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <p className="text-gray-500 text-center">No heart rate data available</p>
        <p className="text-gray-400 text-sm mt-2">Use a heart rate monitor during activities</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="zone"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            label={{
              value: 'Minutes',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: '12px', fill: '#6B7280' }
            }}
          />
          <Tooltip content={<HeartRateZonesCustomTooltip />} />
          <Legend />
          <Bar
            dataKey="minutes"
            fill="#3B82F6"
            radius={[8, 8, 0, 0]}
            name="Time in Zone"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={ZONE_COLORS[entry.zone as keyof typeof ZONE_COLORS] || "#3B82F6"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const HeartRateZonesCustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: HeartRateZoneData }>;
}) => {
  if (active && payload && payload.length) {
    const entry = payload[0].payload as HeartRateZoneData;
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900">{entry.zone}</p>
        <p className="text-sm text-gray-600">{entry.range}</p>
        <p className="text-sm font-semibold text-blue-600 mt-1">{entry.minutes} minutes</p>
        <p className="text-sm text-gray-500">{entry.percentage}% of total time</p>
      </div>
    );
  }
  return null;
};
