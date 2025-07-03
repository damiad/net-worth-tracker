import React, { useMemo, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import ResponsiveWrappingLegend from "./ResponsiveWrappingLegend";
import ChartPlaceholder from "./ChartPlaceholder";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF1943",
  "#FF45A1",
  "#45A1FF",
];

export default function AssetAllocationChart({
  assetAllocation,
  rate,
  formatCurrency,
}) {
  const scrollContainerRef = useRef(null);

  const legendPayload = useMemo(
    () =>
      assetAllocation.map((entry, index) => ({
        value: entry.name,
        color: COLORS[index % COLORS.length],
      })),
    [assetAllocation]
  );

  // Center the scrollable chart after it renders.
  useEffect(() => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      scrollContainerRef.current.scrollLeft = (scrollWidth - clientWidth) / 2;
    }
  }, [assetAllocation]);

  const hasData = assetAllocation && assetAllocation.length > 0;

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col p-4">
        {hasData ? (
          <>
            <div ref={scrollContainerRef} className="w-full overflow-x-auto">
              <div
                style={{ minWidth: "500px", height: "300px", margin: "0 auto" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetAllocation}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      fill="#8884d8"
                      labelLine={true}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {assetAllocation.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value / rate)}
                      contentStyle={{
                        backgroundColor: "rgba(31, 41, 55, 0.8)",
                        border: "none",
                        borderRadius: "0.5rem",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <hr className="w-full my-4 border-gray-200 dark:border-gray-700" />

            <ResponsiveWrappingLegend payload={legendPayload} />
          </>
        ) : (
          <div className="h-96">
            <ChartPlaceholder message="No positive assets to display." />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
