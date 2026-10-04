/**
 * Format numeric value to Indian Rupee (INR) currency format
 * @param {number} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format ISO Date string to human readable Indian date format
 * @param {string|Date} dateVal
 * @returns {string}
 */
export const formatDate = (dateVal) => {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get status badge classes based on status string value
 * @param {string} status
 * @returns {string} Tailwind classes
 */
export const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'active':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30';
    case 'partially paid':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30';
    case 'unpaid':
    case 'inactive':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30';
    case 'overdue':
      return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/30';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-350 border border-slate-200 dark:border-slate-700/30';
  }
};
