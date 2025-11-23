"use client";

import { useState } from "react";

interface DayData {
  date: string;
  count: number;
  duration: number; // in minutes
}

interface CalendarHeatmapProps {
  data: DayData[];
  loading?: boolean;
}

export default function CalendarHeatmap({
  data,
  loading = false
}: CalendarHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-gray-400">Loading calendar data...</div>
      </div>
    );
  }

  // Generate last 12 weeks of data
  const weeks = 12;
  const today = new Date();
  const calendar: (DayData | null)[][] = [];

  // Start from 12 weeks ago
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (weeks * 7));

  // Create a map for quick lookup
  const dataMap = new Map(data.map(d => [d.date, d]));

  // Generate calendar grid
  for (let week = 0; week < weeks; week++) {
    const weekData: (DayData | null)[] = [];
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7) + day);

      if (currentDate > today) {
        weekData.push(null);
      } else {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayData = dataMap.get(dateStr);
        weekData.push(dayData || { date: dateStr, count: 0, duration: 0 });
      }
    }
    calendar.push(weekData);
  }

  const getIntensityColor = (duration: number) => {
    if (duration === 0) return "bg-gray-100";
    if (duration < 30) return "bg-emerald-200";
    if (duration < 60) return "bg-emerald-400";
    if (duration < 90) return "bg-emerald-600";
    return "bg-emerald-800";
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center bg-gray-50 rounded-lg">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-500 text-center">No training consistency data</p>
        <p className="text-gray-400 text-sm mt-2">Start training regularly to build your streak</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2">
            {dayLabels.map((day, idx) => (
              <div
                key={idx}
                className="h-4 text-xs text-gray-500 flex items-center justify-end pr-1"
                style={{ minWidth: '30px' }}
              >
                {idx % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-1">
            {calendar.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {week.map((day, dayIdx) => (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                    className={`
                      h-4 w-4 rounded-sm cursor-pointer transition-all
                      ${day ? getIntensityColor(day.duration) : 'bg-transparent'}
                      ${day && day.count > 0 ? 'hover:ring-2 hover:ring-blue-400' : ''}
                    `}
                    onMouseEnter={() => day && day.count > 0 && setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    title={day ? `${day.date}: ${day.count} activities, ${day.duration} min` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {hoveredDay && (
          <div className="bg-gray-900 text-white text-xs p-2 rounded shadow-lg absolute mt-20">
            <p className="font-medium">{hoveredDay.date}</p>
            <p>{hoveredDay.count} activities</p>
            <p>{hoveredDay.duration} minutes</p>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="h-3 w-3 bg-gray-100 rounded-sm"></div>
            <div className="h-3 w-3 bg-emerald-200 rounded-sm"></div>
            <div className="h-3 w-3 bg-emerald-400 rounded-sm"></div>
            <div className="h-3 w-3 bg-emerald-600 rounded-sm"></div>
            <div className="h-3 w-3 bg-emerald-800 rounded-sm"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
