import React from "react";
import TotalNetWorth from "./dashboard/TotalNetWorth";
import WorthOverTimeChart from "./dashboard/WorthOverTimeChart";
import AssetAllocationChart from "./dashboard/AssetAllocationChart";
import { formatCurrency } from "../utils/currency";

export default function DashboardMetrics({ data, snapshots, displayCurrency }) {
  const {
    netWorth = 0,
    assetAllocation = [],
    liquidAssets = 0,
    plnRates = {},
  } = data || {};

  const rate = plnRates[displayCurrency] || 1;

  const formatValue = (value) => formatCurrency(value, displayCurrency);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <TotalNetWorth
        netWorth={netWorth}
        liquidAssets={liquidAssets}
        rate={rate}
        formatCurrency={formatValue}
      />

      <WorthOverTimeChart
        snapshots={snapshots}
        plnRates={plnRates}
        displayCurrency={displayCurrency}
        formatCurrency={formatValue}
      />

      <AssetAllocationChart
        assetAllocation={assetAllocation}
        rate={rate}
        formatCurrency={formatValue}
      />
    </div>
  );
}
