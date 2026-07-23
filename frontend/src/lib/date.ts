// Date-only (no time-of-day) helpers, stored/compared as zero-padded 'YYYY-MM-DD'
// strings so they sort lexicographically in the same order as chronologically.
// Built from local Date getters (not toISOString/Date parsing) so a date picked
// as "today" stays "today" regardless of the device's UTC offset.

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayIso(): string {
  return formatDateOnly(new Date());
}

export function formatDateDisplay(iso: string): string {
  const date = parseDateOnly(iso);
  const includeYear = date.getFullYear() !== new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
}
