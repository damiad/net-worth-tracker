import React, { useMemo } from "react";
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
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { BarChart2 } from "lucide-react";

export default function DashboardMetrics({ data, snapshots }) {
  const { netWorth, assetAllocation } = data;
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#AF19FF",
    "#FF1943",
  ];

  const formattedSnapshots = useMemo(() => {
    return snapshots.map((s) => ({
      date: s.timestamp
        .toDate()
        .toLocaleDateString("pl-PL", { month: "short", day: "numeric" }),
      netWorth: s.netWorth,
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
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Net Worth Over Time</CardTitle>
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
                  formatter={(value) => [formatCurrency(value), "Net Worth"]}
                  contentStyle={{
                    backgroundColor: "rgba(31, 41, 55, 0.8)",
                    border: "none",
                    borderRadius: "0.5rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#3b82f6" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <BarChart2 size={32} />
              <p className="mt-2 text-center text-sm">
                Not enough data for a chart. Update sources to see history.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {assetAllocation.length > 0 ? (
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
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
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
