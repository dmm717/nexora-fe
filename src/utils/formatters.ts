const currencyFormatters: Record<string, Intl.NumberFormat> = {};

export const formatCurrency = (amount: number, currency: string = 'VND') => {
  if (!currencyFormatters[currency]) {
    currencyFormatters[currency] = new Intl.NumberFormat('vi-VN', { style: 'currency', currency });
  }
  return currencyFormatters[currency].format(amount);
};

export const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

/**
 * Returns the maximum fraction digits for a currency according to Intl.NumberFormat
 * (e.g. 0 for VND, JPY, KRW; 2 for USD, EUR, GBP).
 */
export function getCurrencyFractionDigits(currency: string = 'VND', locale: string = 'vi-VN'): number {
  try {
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    return formatter.resolvedOptions().maximumFractionDigits ?? 0;
  } catch {
    const normalized = currency.trim().toUpperCase();
    if (['VND', 'JPY', 'KRW'].includes(normalized)) return 0;
    return 2;
  }
}

/**
 * Calculates the minor-unit divisor based on currency fraction digits (10 ** fractionDigits).
 * For VND (0 fraction digits) -> 1
 * For USD (2 fraction digits) -> 100
 */
export function getMinorUnitDivisor(currency: string = 'VND', locale: string = 'vi-VN'): number {
  const digits = getCurrencyFractionDigits(currency, locale);
  return 10 ** digits;
}

/**
 * Formats a minor-unit integer price into human-readable currency string.
 * - 0 returns 'Miễn phí'
 * - VND 49000 returns '49.000 ₫'
 * - USD 4900 returns '$49.00' (or appropriate localized USD format)
 */
export function formatPriceMinor(
  amountMinor: number,
  currency: string = 'VND',
  locale: string = 'vi-VN'
): string {
  if (amountMinor === 0) {
    return 'Miễn phí';
  }

  const divisor = getMinorUnitDivisor(currency, locale);
  const majorAmount = amountMinor / divisor;
  const digits = getCurrencyFractionDigits(currency, locale);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(majorAmount);
}
