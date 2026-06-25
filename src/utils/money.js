// Single source of truth for currency formatting (PKR).
// Usage: formatMoney(1500) → "Rs. 1,500"; formatMoney(null, { fallback: 'On request' })
export const formatMoney = (n, { fallback = '—', round = false } = {}) => {
    if (n == null || n === '' || isNaN(Number(n))) return fallback;
    const v = round ? Math.round(Number(n)) : Number(n);
    return `Rs. ${v.toLocaleString()}`;
};

export default formatMoney;
