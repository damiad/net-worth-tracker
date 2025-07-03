export const formatCurrency = (value, currency) => {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currency || "PLN",
  }).format(value || 0);
};
