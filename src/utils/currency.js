
// A mapping of currency codes to the symbols we want to display.
const currencySymbols = {
  PLN: "zł",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/**
 * A robust currency formatting function that is not affected by Google Translate.
 * It manually adds the correct currency symbol.
 *
 * @param {number} value The numeric value to format.
 * @param {string} currency The 3-letter currency code (e.g., "PLN").
 * @returns {string} The formatted currency string (e.g., "1,234.56 zł").
 */
export const formatCurrency = (value, currency) => {
  const code = currency || "PLN"; // Default to PLN if no currency is provided.

  // Use a consistent locale like 'pl-PL' to get the number format right.
  const numberPart = new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

  // Get the symbol from our map, or fall back to the currency code itself.
  const symbol = currencySymbols[code] || code;

  return `${numberPart} ${symbol}`;
};
