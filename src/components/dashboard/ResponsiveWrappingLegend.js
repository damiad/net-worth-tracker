import React from "react";

export default function ResponsiveWrappingLegend({ payload }) {
  if (!payload || !payload.length) {
    return null;
  }
  return (
    <div className="flex flex-wrap justify-center w-full px-2 sm:px-4">
      {payload.map((entry, index) => (
        <div
          key={`item-${index}`}
          className="flex items-center mr-4 md:mr-6 mb-2"
        >
          <span
            className="w-2 h-2 sm:w-3 sm:h-3 inline-block mr-2 rounded-sm shrink-0"
            style={{ backgroundColor: entry.color }}
          ></span>
          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
