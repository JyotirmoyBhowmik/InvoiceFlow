export const FX_RATES_TO_INR: Record<string, number> = {
  INR: 1.0,
  USD: 86.50,
  EUR: 93.20,
  GBP: 111.40,
  AED: 23.55,
  SGD: 65.80,
  CAD: 62.40,
  AUD: 56.10,
  JPY: 0.58,
  CHF: 96.80,
  SAR: 23.05,
  QAR: 23.75,
  KWD: 281.20,
  OMR: 224.80,
  BHD: 229.50,
  NPR: 0.625,
};

export function getExchangeRateToINR(currency?: string): number {
  const code = (currency || 'INR').trim().toUpperCase();
  return FX_RATES_TO_INR[code] ?? 1.0;
}

export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0.00';
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatOriginalCurrency(amount: number, currency?: string): string {
  const curr = (currency || 'INR').trim().toUpperCase();
  if (curr === 'INR') {
    return formatINR(amount);
  }
  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'AED ',
    SGD: 'S$',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '¥',
    CHF: 'CHF ',
    NPR: 'रू ',
  };
  const sym = symbolMap[curr] || `${curr} `;
  return `${sym}${(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${curr}`;
}

export function convertToINR(amount: number, currency?: string, customRate?: number): number {
  const rate = customRate !== undefined && customRate > 0 ? customRate : getExchangeRateToINR(currency);
  return (amount || 0) * rate;
}

export function getCurrencySymbol(currency?: string): string {
  const curr = (currency || 'INR').trim().toUpperCase();
  if (curr === 'INR') return '₹';
  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'AED ',
    SGD: 'S$',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '¥',
    CHF: 'CHF ',
    SAR: 'SAR ',
    QAR: 'QAR ',
    NPR: 'रू',
  };
  return symbolMap[curr] || `${curr} `;
}

export function formatDualCurrency(amount: number, currency?: string, customRate?: number) {
  const curr = (currency || 'INR').trim().toUpperCase();
  const isForeign = curr !== 'INR';
  const rate = customRate !== undefined && customRate > 0 ? customRate : getExchangeRateToINR(curr);
  const inrAmount = isForeign ? (amount || 0) * rate : amount || 0;

  return {
    isForeign,
    currencyCode: curr,
    original: formatOriginalCurrency(amount, curr),
    inr: formatINR(inrAmount),
    rateText: isForeign ? `1 ${curr} = ₹${rate.toFixed(2)}` : '1.00',
    rate,
  };
}
