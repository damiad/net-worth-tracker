import React, { useMemo, useRef, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";

// The responsive legend is perfect and remains unchanged.
const ResponsiveWrappingLegend = ({ payload }) => {
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
};

export default function DashboardMetrics({ data, snapshots, displayCurrency }) {
  const {
    netWorth = 0,
    assetAllocation = [],
    liquidAssets = 0,
    plnRates = {},
  } = data || {};

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

  // Re-introducing the ref for the scrollable container.
  const scrollContainerRef = useRef(null);

  const rate = plnRates[displayCurrency] || 1;
  const netWorthInDisplay = netWorth / rate;
  const liquidAssetsInDisplay = liquidAssets / rate;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: displayCurrency || "PLN",
    }).format(value || 0);

  const formattedSnapshots = useMemo(() => {
    if (!snapshots || !plnRates) return [];
    return snapshots.map((s) => {
      const displayRate = plnRates[displayCurrency] || 1;
      return {
        date:
          s.timestamp
            ?.toDate()
            .toLocaleDateString("pl-PL", { month: "short", day: "numeric" }) ||
          "N/A",
        "Net Worth": (s.netWorth || 0) / displayRate,
        "Liquid Assets": (s.liquidAssets || 0) / displayRate,
      };
    });
  }, [snapshots, displayCurrency, plnRates]);

  const legendPayload = useMemo(
    () =>
      assetAllocation.map((entry, index) => ({
        value: entry.name,
        color: COLORS[index % COLORS.length],
      })),
    [assetAllocation]
  );

  // Re-introducing the useEffect to center the scrollable chart after it renders.
  useEffect(() => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      const scrollLeft = (scrollWidth - clientWidth) / 2;
      scrollContainerRef.current.scrollLeft = scrollLeft;
    }
  }, [assetAllocation]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Total Net Worth</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(netWorthInDisplay)}
          </p>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Liquid Assets
            </p>
            <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {formatCurrency(liquidAssetsInDisplay)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* --- WORTH OVER TIME CARD (RESTORED) --- */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Worth Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {formattedSnapshots.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedSnapshots}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "rgba(31, 41, 55, 0.8)",
                    border: "none",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  name="Net Worth"
                  dataKey="Net Worth"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#3b82f6" }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  name="Liquid Assets"
                  dataKey="Liquid Assets"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: "#22c55e" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <BarChart2 size={32} />
              <p className="mt-2 text-center text-sm">
                Not enough data for chart. Update sources to see history.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- ASSET ALLOCATION CARD (FINAL VERSION) --- */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col p-4">
          {assetAllocation && assetAllocation.length > 0 ? (
            <>
              {/* This container has overflow-x-auto to enable horizontal scrolling. */}
              <div ref={scrollContainerRef} className="w-full overflow-x-auto">
                {/* This inner div sets the minimum width for the chart content. */}
                <div
                  style={{
                    minWidth: "500px",
                    height: "300px",
                    margin: "0 auto",
                  }}
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
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <BarChart2 size={32} />
              <p className="mt-2 text-center text-sm">
                No positive assets to display.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
