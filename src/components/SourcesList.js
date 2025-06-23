import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { DollarSign, Home, Edit, Trash2 } from "lucide-react";

// A new, dedicated component for a single source card.
// This allows us to use hooks correctly at the top level.
function SourceCard({ source, accounts, onEdit, onDelete }) {
  const formatCurrency = (value) =>
    new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(value || 0);

  // Filter accounts related to this specific source once.
  const sourceAccounts = useMemo(
    () => accounts.filter((acc) => acc.sourceId === source.id),
    [accounts, source.id]
  );

  const positiveAccounts = useMemo(
    () => sourceAccounts.filter((acc) => acc.type === "account"),
    [sourceAccounts]
  );

  const loanAccounts = useMemo(
    () => sourceAccounts.filter((acc) => acc.type === "loan"),
    [sourceAccounts]
  );

  const debtAccounts = useMemo(
    () => sourceAccounts.filter((acc) => acc.type === "debt"),
    [sourceAccounts]
  );

  // Memoize sorted lists to avoid re-sorting on every render.
  const sortedPositiveAccounts = useMemo(
    () => [...positiveAccounts].sort((a, b) => b.balance - a.balance),
    [positiveAccounts]
  );

  const sortedLoanAccounts = useMemo(
    () =>
      [...loanAccounts].sort(
        (a, b) =>
          a.baseAmount +
          a.accumulatedInterest -
          (b.baseAmount + b.accumulatedInterest)
      ),
    [loanAccounts]
  );

  const sortedDebtAccounts = useMemo(
    () =>
      [...debtAccounts].sort(
        (a, b) =>
          b.baseAmount +
          b.accumulatedInterest -
          (a.baseAmount + a.accumulatedInterest)
      ),
    [debtAccounts]
  );

  const sortedOtherDebts = useMemo(
    () =>
      [...(source.otherDebts || [])].sort(
        (a, b) =>
          b.baseAmount +
          b.accumulatedInterest -
          (a.baseAmount + a.accumulatedInterest)
      ),
    [source.otherDebts]
  );

  const renderLoanOrDebtDetails = (item, isDebt = true) => (
    <>
      <div
        className={`flex justify-between items-center font-semibold ${
          isDebt
            ? "text-red-700 dark:text-red-400"
            : "text-green-700 dark:text-green-400"
        }`}
      >
        <span>{item.name}</span>
        <span>
          {isDebt ? "-" : "+"}
          {formatCurrency(
            (item.baseAmount || 0) + (item.accumulatedInterest || 0)
          )}
        </span>
      </div>
      <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 text-[10px] mt-1 px-2">
        <span>
          Base: {formatCurrency(item.baseAmount)} | Int:{" "}
          {formatCurrency(item.accumulatedInterest)}
        </span>
        <span>
          {item.interestRate}% | Upd:{" "}
          {item.lastUpdated && item.lastUpdated.toDate
            ? item.lastUpdated.toDate().toLocaleDateString()
            : "N/A"}
        </span>
      </div>
    </>
  );

  return (
    <Card>
      <CardHeader className="flex justify-between items-start">
        <div>
          <CardTitle className="flex items-center gap-2">
            {source.type === "property" ? (
              <Home size={20} className="text-blue-500" />
            ) : (
              <DollarSign size={20} className="text-green-500" />
            )}
            {source.name}
          </CardTitle>
          <p className="text-xs text-gray-400 mt-1">
            Last updated:
            {source.lastUpdated &&
            typeof source.lastUpdated.toDate === "function"
              ? source.lastUpdated.toDate().toLocaleDateString()
              : "N/A"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onEdit(source)}
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8"
          >
            <Edit size={16} />
          </Button>
          <Button
            onClick={() => onDelete(source.id)}
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {formatCurrency(source.totalValuePLN)}
        </p>

        {source.type === "property" ? (
          <div className="mt-4 space-y-2 text-xs">
            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
              <div className="flex justify-between items-center">
                <span>Property Worth</span>
                <span className="font-semibold text-green-600 dark:text-green-500">
                  {formatCurrency((source.m2 || 0) * (source.pricePerM2 || 0))}
                </span>
              </div>
            </div>
            {source.bankDebt > 0 && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                <div className="flex justify-between items-center">
                  <span>Bank Debt</span>
                  <span className="font-semibold text-red-600 dark:text-red-500">
                    -{formatCurrency(source.bankDebt)}
                  </span>
                </div>
              </div>
            )}
            {sortedOtherDebts.map((debt, index) => (
              <div
                key={index}
                className="p-2 bg-red-50 dark:bg-red-900/20 rounded-md"
              >
                {renderLoanOrDebtDetails(debt, true)}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-2 text-xs">
            {sortedPositiveAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-2 bg-green-50 dark:bg-green-900/20 rounded-md"
              >
                <div className="flex justify-between items-center">
                  <span className="text-green-700 dark:text-green-400 font-medium">
                    {acc.name || `Account`}
                  </span>
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    {new Intl.NumberFormat("en-US", {
                      style: "decimal",
                    }).format(acc.balance)}{" "}
                    {acc.currency}
                  </span>
                </div>
                <div className="text-right text-gray-400 text-[10px] mt-1">
                  Updated:{" "}
                  {acc.lastUpdated && acc.lastUpdated.toDate
                    ? acc.lastUpdated.toDate().toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            ))}
            {sortedLoanAccounts.map((loan, index) => (
              <div
                key={loan.id || index}
                className="p-2 bg-green-50 dark:bg-green-900/20 rounded-md"
              >
                {renderLoanOrDebtDetails(loan, false)}
              </div>
            ))}
            {sortedDebtAccounts.map((debt, index) => (
              <div
                key={debt.id || index}
                className="p-2 bg-red-50 dark:bg-red-900/20 rounded-md"
              >
                {renderLoanOrDebtDetails(debt, true)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// The main SourcesList component is now much simpler.
export default function SourcesList({ sources, onEdit, onDelete, accounts }) {
  if (sources.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <h3 className="text-xl font-medium text-gray-800 dark:text-gray-100">
            No sources yet!
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Click "Add Source" to start tracking your net worth.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sources.map((source) => (
        <SourceCard
          key={source.id}
          source={source}
          accounts={accounts}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
