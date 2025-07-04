import React from "react";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import DynamicList from "./DynamicList";

export default function PropertyFields({ data, setData }) {
  const {
    m2,
    pricePerM2,
    pricePerM2Currency,
    bankDebt,
    bankDebtCurrency,
    otherDebts,
  } = data;

  const handleChange = (field, value, isNumeric = false) => {
    setData((prev) => ({
      ...prev,
      [field]: isNumeric ? parseFloat(value) || 0 : value,
    }));
  };

  const otherDebtsConfig = {
    row1: [
      {
        name: "name",
        label: "Name",
        type: "text",
        defaultValue: "Unnamed Debt",
        className: "col-span-12 sm:col-span-7",
      },
      {
        name: "baseAmount",
        label: "Base Amount",
        type: "number",
        defaultValue: 0,
        className: "col-span-12 sm:col-span-5",
      },
    ],
    row2: [
      {
        name: "accumulatedInterest",
        label: "Acc. Interest",
        type: "number",
        defaultValue: 0,
        className: "col-span-4",
      },
      {
        name: "interestRate",
        label: "Rate %",
        type: "number",
        defaultValue: 0,
        className: "col-span-4",
      },
      {
        name: "currency",
        label: "Currency",
        type: "select",
        defaultValue: "PLN",
        options: ["PLN", "USD", "EUR", "GBP"],
        className: "col-span-4",
      },
    ],
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg space-y-4">
        <h4 className="font-semibold text-gray-800 dark:text-gray-100">
          Property Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs">Area (m²)</label>
            <Input
              type="number"
              value={m2}
              onChange={(e) => handleChange("m2", e.target.value, true)}
            />
          </div>
          <div>
            <label className="text-xs">Price per m²</label>
            <Input
              type="number"
              value={pricePerM2}
              onChange={(e) => handleChange("pricePerM2", e.target.value, true)}
            />
          </div>
          <div>
            <label className="text-xs">Price Currency</label>
            <Select
              value={pricePerM2Currency}
              onChange={(e) =>
                handleChange("pricePerM2Currency", e.target.value)
              }
            >
              <option>PLN</option>
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg space-y-4">
        <h4 className="font-semibold text-gray-800 dark:text-gray-100">
          Bank Debt
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs">Amount</label>
            <Input
              type="number"
              value={bankDebt}
              onChange={(e) => handleChange("bankDebt", e.target.value, true)}
            />
          </div>
          <div>
            <label className="text-xs">Currency</label>
            <Select
              value={bankDebtCurrency}
              onChange={(e) => handleChange("bankDebtCurrency", e.target.value)}
            >
              <option>PLN</option>
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </Select>
          </div>
        </div>
      </div>

      <DynamicList
        title="Other Debts (e.g. from family)"
        list={otherDebts}
        setList={(newList) =>
          setData((prev) => ({ ...prev, otherDebts: newList }))
        }
        fieldsConfig={otherDebtsConfig}
        isInterestBearing={true}
      />
    </div>
  );
}
