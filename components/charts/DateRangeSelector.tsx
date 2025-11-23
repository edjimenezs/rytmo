"use client";

import { useState } from "react";

export type DateRangeOption = "7d" | "30d" | "90d" | "1y" | "custom";

interface DateRangeSelectorProps {
  selected: DateRangeOption;
  onSelect: (range: DateRangeOption) => void;
  onCustomRange?: (startDate: string, endDate: string) => void;
}

export default function DateRangeSelector({
  selected,
  onSelect,
  onCustomRange
}: DateRangeSelectorProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const options: { value: DateRangeOption; label: string }[] = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "1y", label: "Last year" },
    { value: "custom", label: "Custom" },
  ];

  const handleCustomSubmit = () => {
    if (customStart && customEnd && onCustomRange) {
      onCustomRange(customStart, customEnd);
      setShowCustomModal(false);
    }
  };

  const handleOptionClick = (value: DateRangeOption) => {
    if (value === "custom") {
      setShowCustomModal(true);
    } else {
      onSelect(value);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleOptionClick(option.value)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                selected === option.value
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Custom Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Custom Date Range
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCustomModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomSubmit}
                disabled={!customStart || !customEnd}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
