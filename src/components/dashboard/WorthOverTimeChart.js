import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import ChartPlaceholder from "./ChartPlaceholder";

export default function WorthOverTimeChart({
  snapshots,
  plnRates,
  displayCurrency,
  formatCurrency,
}) {
  const { formattedData, domain } = useMemo(() => {
    if (!snapshots || snapshots.length < 2 || !plnRates) {
      return { formattedData: [], domain: [0, 0] };
    }

    const data = snapshots.map((s) => {
      const displayRate = plnRates[displayCurrency] || 1;
      return {
        timestamp: s.timestamp?.toDate().getTime() || 0,
        "Net Worth": (s.netWorth || 0) / displayRate,
        "Liquid Assets": (s.liquidAssets || 0) / displayRate,
      };
    });

    // Ensure data is sorted by timestamp just in case
    data.sort((a, b) => a.timestamp - b.timestamp);

    const timeDomain = [data[0].timestamp, data[data.length - 1].timestamp];

    return { formattedData: data, domain: timeDomain };
  }, [snapshots, displayCurrency, plnRates]);

  const hasData = formattedData && formattedData.length > 1;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Worth Over Time</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis
                type="number"
                dataKey="timestamp"
                domain={domain}
                tickFormatter={(unixTime) =>
                  new Date(unixTime).toLocaleDateString("pl-PL", {
                    month: "short",
                    day: "numeric",
                  })
                }
                fontSize={12}
                tickLine={false}
                axisLine={false}
                scale="time"
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(unixTime) =>
                  new Date(unixTime).toLocaleDateString("pl-PL")
                }
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
          <ChartPlaceholder message="Not enough data for chart. Update sources to see history." />
        )}
      </CardContent>
    </Card>
  );
}
