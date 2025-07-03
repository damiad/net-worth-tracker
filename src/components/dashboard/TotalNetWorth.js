import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";

export default function TotalNetWorth({
  netWorth,
  liquidAssets,
  rate,
  formatCurrency,
}) {
  const netWorthInDisplay = netWorth / rate;
  const liquidAssetsInDisplay = liquidAssets / rate;

  return (
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
  );
}
