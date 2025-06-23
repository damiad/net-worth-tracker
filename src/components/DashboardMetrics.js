import React, { useMemo, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
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

export default function DashboardMetrics({ data, snapshots }) {
  const { netWorth, assetAllocation, liquidAssets } = data;
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

  const pieChartContainerRef = useRef(null);

  useEffect(() => {
    // Center the pie chart on initial render if it's scrollable
    if (pieChartContainerRef.current) {
      const container = pieChartContainerRef.current;
      const scrollAmount = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollLeft = scrollAmount;
    }
  }, [assetAllocation]); // Rerun when data changes

  const formattedSnapshots = useMemo(() => {
    if (!snapshots) return [];
    return snapshots.map((s) => ({
      date: s.timestamp
        .toDate()
        .toLocaleDateString("pl-PL", { month: "short", day: "numeric" }),
      "Net Worth": s.netWorth,
      "Liquid Assets": s.liquidAssets,
    }));
  }, [snapshots]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(value || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Total Net Worth</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(netWorth)}
          </p>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Liquid Assets
            </p>
            <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {formatCurrency(liquidAssets)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Worth Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {formattedSnapshots.length >= 1 ? (
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
                  formatter={(value) => [formatCurrency(value)]}
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
                No data for chart. Update your sources to create a snapshot.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          {assetAllocation && assetAllocation.length > 0 ? (
            <>
              {/* Scrollable Container for the Pie Chart */}
              <div ref={pieChartContainerRef} className="h-64 overflow-x-auto">
                <div style={{ minWidth: '400px', height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetAllocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius="80%"
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
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
                        formatter={(value) => formatCurrency(value)}
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
              
              {/* Separate, Non-scrolling, Wrapping Legend */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                {assetAllocation.map((entry, index) => (
                  <div key={`legend-${index}`} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <div
                      className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span>{entry.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-72 text-gray-500">
              <PieChart size={32} />
              <p className="mt-2 text-center text-sm">
                No positive assets to display. Add or update your sources.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
