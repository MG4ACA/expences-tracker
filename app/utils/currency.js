export function formatCurrency(amount, currencyCode = 'LKR') {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return '';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}
