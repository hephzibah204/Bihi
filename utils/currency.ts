export const formatNGN = (n: number, maximumFractionDigits: number = 0): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits,
    }).format(Number(n || 0));
  } catch {
    const val = Number(n || 0);
    const rounded = maximumFractionDigits > 0 ? val.toFixed(maximumFractionDigits) : Math.round(val).toString();
    const withCommas = rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `₦${withCommas}`;
  }
};