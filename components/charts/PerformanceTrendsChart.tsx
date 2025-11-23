"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PerformanceData {
  date: string;
  averagePace?: number;    // min/km
  averageSpeed?: number;   // km/h
  distance?: number;       // km
}

interface PerformanceTrendsChartProps {
  data: PerformanceData[];
  metric?: "pace" | "speed" | "distance";
  loading?: boolean;
}

export default function PerformanceTrendsChart({
  data,
  metric = "pace",
  loading = false
}: PerformanceTrendsChartProps) {
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <p className="text-gray-500 text-center">No performance data available</p>
        <p className="text-gray-400 text-sm mt-2">Start logging activities to track your progress</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      let displayValue = "";

      if (metric === "pace") {
        displayValue = `${value.toFixed(2)} min/km`;
      } else if (metric === "speed") {
        displayValue = `${value.toFixed(1)} km/h`;
      } else {
        displayValue = `${value.toFixed(1)} km`;
      }

      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{payload[0].payload.date}</p>
          <p className="text-sm text-emerald-600 mt-1">{displayValue}</p>
        </div>
      );
    }
    return null;
  };

  const getYAxisLabel = () => {
    switch (metric) {
      case "pace":
        return "Pace (min/km)";
      case "speed":
        return "Speed (km/h)";
      case "distance":
        return "Distance (km)";
      default:
        return "";
    }
  };

  const getDataKey = () => {
    switch (metric) {
      case "pace":
        return "averagePace";
      case "speed":
        return "averageSpeed";
      case "distance":
        return "distance";
      default:
        return "averagePace";
    }
  };

  const getLegendName = () => {
    switch (metric) {
      case "pace":
        return "Avg Pace (min/km)";
      case "speed":
        return "Avg Speed (km/h)";
      case "distance":
        return "Distance (km)";
      default:
        return "";
    }
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            label={{
              value: getYAxisLabel(),
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: '12px', fill: '#6B7280' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey={getDataKey()}
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
            name={getLegendName()}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
