import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { DollarSign, Home, Edit, Trash2 } from "lucide-react";

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
  const formatCurrency = (value) =>
    new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(value || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sources.map((source) => (
        <Card key={source.id}>
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

            {source.type === "property" && (
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <span>Property Worth</span>
                  <span className="font-semibold text-green-600 dark:text-green-500">
                    {formatCurrency(
                      (source.m2 || 0) * (source.pricePerM2 || 0)
                    )}
                  </span>
                </div>
                {source.bankDebt > 0 && (
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                    <span>Bank Debt</span>
                    <span className="font-semibold text-red-600 dark:text-red-500">
                      -{formatCurrency(source.bankDebt)}
                    </span>
                  </div>
                )}
                {/* Display list of other debts, sorted by amount descending */}
                {(source.otherDebts || [])
                  .sort((a, b) => b.amount - a.amount)
                  .map((debt) => (
                    <div
                      key={debt.id}
                      className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md"
                    >
                      <span>{debt.name || "Other Debt"}</span>
                      <span className="font-semibold text-red-600 dark:text-red-500">
                        -{formatCurrency(debt.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {source.type !== "property" && (
              <div className="mt-4 space-y-2">
                {accounts
                  .filter((a) => a.sourceId === source.id)
                  .map((acc) => (
                    <div
                      key={acc.id}
                      className="flex justify-between items-center text-xs p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md"
                    >
                      <span>{acc.name || `Account`}</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat("en-US", {
                          style: "decimal",
                        }).format(acc.balance)}{" "}
                        {acc.currency}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
