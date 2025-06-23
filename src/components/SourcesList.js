import React, { useMemo } from "react";
import { DollarSign, Home, Edit, Trash2 } from "lucide-react";

const Card = ({ children, className = "" }) => (
  <div
    className={`border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 shadow-sm rounded-lg ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  // Removed opinionated flex styles to let the consumer control the layout.
  <div className={`p-4 md:p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
  >
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-4 md:p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ onClick, children, variant, size, className }) => {
  // A simplified button component to replicate the necessary 'ghost' variant style.
  const baseStyle =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50";

  // Specific styles for the 'ghost' variant used in this component
  const ghostStyle = "hover:bg-gray-100 dark:hover:bg-gray-700";

  const combinedClassName = `${baseStyle} ${
    variant === "ghost" ? ghostStyle : ""
  } ${className || ""}`;

  return (
    <button onClick={onClick} className={combinedClassName}>
      {children}
    </button>
  );
};

/**
 * A card component that displays detailed information about a single financial source.
 * It now converts the main total value to a selected display currency.
 * @param {object} props - The component's props.
 * @param {object} props.source - The source data object.
 * @param {Array<object>} props.accounts - The list of all accounts.
 * @param {function} props.onEdit - Callback for editing the source.
 * @param {function} props.onDelete - Callback for deleting the source.
 * @param {string} props.selectedCurrency - The currency to display the main total in (e.g., 'USD', 'EUR').
 * @param {object} props.exchangeRates - An object with exchange rates against PLN (e.g., { USD: 4.0, EUR: 4.3 }).
 */
function SourceCard({
  source,
  accounts,
  onEdit,
  onDelete,
  selectedCurrency,
  exchangeRates,
}) {
  // Formatter for displaying the main card total in the user-selected currency.
  // It converts the base PLN value using the provided exchange rates.
  const formatInSelectedCurrency = (valuePLN) => {
    // Default to PLN if no currency is selected, rates are missing, or PLN is the selected currency
    if (
      !selectedCurrency ||
      !exchangeRates ||
      !exchangeRates[selectedCurrency] ||
      selectedCurrency === "PLN"
    ) {
      return new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency: "PLN",
      }).format(valuePLN || 0);
    }

    const rate = exchangeRates[selectedCurrency];
    const convertedValue = (valuePLN || 0) / rate;

    // Use the appropriate locale/formatting for the selected currency
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: selectedCurrency,
    }).format(convertedValue);
  };

  // Generic formatter for displaying values in their native currency (for sub-items).
  const formatMoney = (value, currency) =>
    new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: currency,
    }).format(value || 0);

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

  // Sorting logic remains the same as it operates on the underlying data.
  const sortedPositiveAccounts = useMemo(
    () => [...positiveAccounts].sort((a, b) => b.balance - a.balance),
    [positiveAccounts]
  );

  const sortedLoanAccounts = useMemo(
    () =>
      [...loanAccounts].sort(
        (a, b) =>
          b.baseAmount +
          b.accumulatedInterest -
          (a.baseAmount + a.accumulatedInterest)
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

  // Helper function to render loan or debt details
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
          {formatMoney(
            (item.baseAmount || 0) + (item.accumulatedInterest || 0),
            item.currency || "PLN"
          )}
        </span>
      </div>
      <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 text-[10px] mt-1 px-2">
        <span>
          Base: {formatMoney(item.baseAmount, item.currency || "PLN")} | Int:{" "}
          {formatMoney(item.accumulatedInterest, item.currency || "PLN")}
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

  // --- CHANGE START ---
  // This component will now visually indicate if currency conversion failed due to missing props.
  const DisplayTotal = () => {
    const isPLNFallback =
      !selectedCurrency ||
      !exchangeRates ||
      !exchangeRates[selectedCurrency] ||
      selectedCurrency === "PLN";
    const hasConversionFailed =
      selectedCurrency && selectedCurrency !== "PLN" && isPLNFallback;

    return (
      <div>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {formatInSelectedCurrency(source.totalValuePLN)}
        </p>
        {hasConversionFailed && (
          <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1">
            (Conversion to {selectedCurrency} unavailable)
          </p>
        )}
      </div>
    );
  };
  // --- CHANGE END ---

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
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
            Last updated:{" "}
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
        <DisplayTotal />

        {source.type === "property" ? (
          <div className="mt-4 space-y-2 text-xs">
            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
              <div className="flex justify-between items-center">
                <span>Property Worth</span>
                <span className="font-semibold text-green-600 dark:text-green-500">
                  {formatMoney(
                    (source.m2 || 0) * (source.pricePerM2 || 0),
                    source.pricePerM2Currency || "PLN"
                  )}
                </span>
              </div>
            </div>
            {source.bankDebt > 0 && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                <div className="flex justify-between items-center">
                  <span>Bank Debt</span>
                  <span className="font-semibold text-red-600 dark:text-red-500">
                    -
                    {formatMoney(
                      source.bankDebt,
                      source.bankDebtCurrency || "PLN"
                    )}
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

/**
 * The main component that renders a grid of SourceCard components.
 * It passes down currency selection props to each card.
 * @param {object} props - The component's props.
 * @param {Array<object>} props.sources - The list of all sources.
 * @param {function} props.onEdit - Callback for editing.
 * @param {function} props.onDelete - Callback for deleting.
 * @param {Array<object>} props.accounts - The list of all accounts.
 * @param {string} props.selectedCurrency - The currency to display totals in.
 * @param {object} props.exchangeRates - The exchange rates for conversion from PLN.
 */
export default function SourcesList({
  sources,
  onEdit,
  onDelete,
  accounts,
  selectedCurrency,
  exchangeRates,
}) {
  if (!sources || sources.length === 0) {
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
          selectedCurrency={selectedCurrency}
          exchangeRates={exchangeRates}
        />
      ))}
    </div>
  );
}
