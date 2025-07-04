import React from "react";
import DynamicList from "./DynamicList";

export default function FinancialSourceFields({ data, setData }) {
  const { positiveAccounts, loans, debts } = data;

  const setList = (listName, newList) => {
    setData((prev) => ({ ...prev, [listName]: newList }));
  };

  const positiveAccountsConfig = [
    {
      name: "name",
      label: "Account Name",
      type: "text",
      defaultValue: "New Account",
      className: "col-span-12 sm:col-span-4",
    },
    {
      name: "balance",
      label: "Balance",
      type: "number",
      defaultValue: 0,
      className: "col-span-6 sm:col-span-4",
    },
    {
      name: "currency",
      label: "Currency",
      type: "select",
      defaultValue: "PLN",
      options: ["PLN", "USD", "EUR", "GBP"],
      className: "col-span-6 sm:col-span-3",
    },
    { name: "type", type: "hidden", defaultValue: "account" },
  ];

  const loanAndDebtConfig = {
    row1: [
      {
        name: "name",
        label: "Name",
        type: "text",
        defaultValue: "Unnamed Item",
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

  // Need to add the 'type' field dynamically for loans and debts
  const loanConfig = {
    ...loanAndDebtConfig,
    row2: [
      { name: "type", type: "hidden", defaultValue: "loan" },
      ...loanAndDebtConfig.row2,
    ],
  };
  const debtConfig = {
    ...loanAndDebtConfig,
    row2: [
      { name: "type", type: "hidden", defaultValue: "debt" },
      ...loanAndDebtConfig.row2,
    ],
  };

  return (
    <div className="space-y-4">
      <DynamicList
        title="Positive Accounts"
        list={positiveAccounts}
        setList={(newList) => setList("positiveAccounts", newList)}
        fieldsConfig={positiveAccountsConfig}
      />
      <DynamicList
        title="Associated Loans (Money you loaned out)"
        list={loans}
        setList={(newList) => setList("loans", newList)}
        fieldsConfig={loanConfig}
        isInterestBearing={true}
      />
      <DynamicList
        title="Associated Debts (Money you owe)"
        list={debts}
        setList={(newList) => setList("debts", newList)}
        fieldsConfig={debtConfig}
        isInterestBearing={true}
      />
    </div>
  );
}
