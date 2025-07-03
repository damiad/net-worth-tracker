import React from "react";
import { BarChart2 } from "lucide-react";

export default function ChartPlaceholder({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <BarChart2 size={32} />
      <p className="mt-2 text-center text-sm">{message}</p>
    </div>
  );
}
