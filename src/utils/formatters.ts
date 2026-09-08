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
