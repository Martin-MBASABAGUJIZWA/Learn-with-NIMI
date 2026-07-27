/**
 * Add N months to a date without the JS overflow bug.
 *
 * `new Date("2024-01-31").setMonth(1)` produces Mar 2 because February
 * has no 31st. This helper clamps to the last valid day of the target month
 * instead (Jan 31 + 1 month → Feb 28/29).
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setDate(1); // temporarily move to the 1st to avoid spillover
  result.setMonth(targetMonth);
  // Clamp to the last day of the target month
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(date.getDate(), lastDay));
  return result;
}

export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}
