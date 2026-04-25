"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { PieLabelRenderProps } from "recharts";

export type ActivityTypeValue =
  | "RUNNING"
  | "CYCLING"
  | "SWIMMING"
  | "WALKING"
  | "WEIGHTLIFTING"
  | "YOGA"
  | "OTHER";

export interface ActivityBreakdownItem {
  name: ActivityTypeValue;
  value: number;
  count: number;
  [key: string]: unknown;
}

interface ActivityBreakdownChartProps {
  data: ActivityBreakdownItem[];
  loading?: boolean;
}

const COLORS: Record<ActivityTypeValue, string> = {
  RUNNING: '#3B82F6',      // Blue
  CYCLING: '#10B981',      // Green
  SWIMMING: '#06B6D4',     // Cyan
  WALKING: '#8B5CF6',      // Purple
  WEIGHTLIFTING: '#F59E0B', // Amber
  YOGA: '#EC4899',         // Pink
  OTHER: '#6B7280',        // Gray
};

export default function ActivityBreakdownChart({
  data,
  loading = false
}: ActivityBreakdownChartProps) {
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <p className="text-gray-500 text-center">No activity data available</p>
        <p className="text-gray-400 text-sm mt-2">Start logging activities to see breakdown</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.name] || COLORS.OTHER}
              />
            ))}
          </Pie>
          <Tooltip content={<ActivityBreakdownCustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value: string) => {
              const item = data.find((d) => d.name === value);
              return `${value} (${item?.count || 0})`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

const ActivityBreakdownCustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ActivityBreakdownItem }>;
}) => {
  if (active && payload && payload.length) {
    const entry = payload[0].payload as ActivityBreakdownItem;
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900">{entry.name}</p>
        <p className="text-sm text-gray-600 mt-1">{entry.count} activities</p>
        <p className="text-sm font-semibold text-blue-600">{entry.value.toFixed(1)} km</p>
      </div>
    );
  }
  return null;
};

type ActivityPieLabelProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent?: number;
};

const renderCustomLabel = (props: PieLabelRenderProps) => {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    percent,
  } = props as unknown as ActivityPieLabelProps;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent && percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${((percent || 0) * 100).toFixed(0)}%`}
    </text>
  );
};
