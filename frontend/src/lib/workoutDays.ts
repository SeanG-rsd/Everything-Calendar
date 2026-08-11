import type { Entry } from '@/api/types';

/**
 * A rotation "day" (e.g. "Push", "Back and Biceps") is a singleton-per-name
 * entry (payload.kind === 'day') living alongside a workout module's template
 * and session entries — same pattern as the goal entries in lib/goals.ts.
 * Rotation order follows entry id (creation order); there's no separate
 * ordering field.
 */
export function isDayEntry(entry: Entry): boolean {
  return entry.payload.kind === 'day';
}

export function dayName(entry: Entry): string {
  return typeof entry.payload.name === 'string' ? entry.payload.name : `Day #${entry.id}`;
}

export function listDayNames(entries: Entry[]): string[] {
  return entries
    .filter(isDayEntry)
    .slice()
    .sort((a, b) => a.id - b.id)
    .map(dayName);
}

export function findDayEntry(entries: Entry[], name: string): Entry | undefined {
  return entries.find((entry) => isDayEntry(entry) && entry.payload.name === name);
}
