/** Local-time (not UTC) YYYY-MM-DD key, used both for same-day comparisons and as a stable, sortable storage key for daily snapshots (see lib/goalHistory.ts). */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isToday(isoString: string): boolean {
  return localDateKey(new Date(isoString)) === localDateKey(new Date());
}
