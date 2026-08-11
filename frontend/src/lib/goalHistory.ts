import type { Entry } from '@/api/types';
import { localDateKey } from './dates';

/**
 * A day's finalized progress for a totals module (currently only "Daily
 * Goals") is a singleton-per-date entry (payload.kind === 'history'),
 * written by db/dailyReset.ts right before it zeroes a stale day's metrics
 * out — same co-located-entry pattern as lib/goals.ts and lib/workoutDays.ts.
 */
export function isHistoryEntry(entry: Entry): boolean {
  return entry.payload.kind === 'history';
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export interface DayProgress {
  date: string;
  letter: string;
  progress: number | null;
}

/**
 * The last 7 calendar days ending today, oldest first. Today never reads
 * from history (dailyReset only snapshots a day once it's over) — its value
 * always comes from `todayProgress`, the live in-progress total, so pass
 * `null` there when there are no metrics to track today rather than 0.
 */
export function lastSevenDays(
  historyEntries: Entry[],
  todayProgress: number | null,
  now: Date = new Date(),
): DayProgress[] {
  const progressByDate = new Map<string, number>();
  for (const entry of historyEntries) {
    if (!isHistoryEntry(entry)) continue;
    const date = entry.payload.date;
    const progress = entry.payload.progress;
    if (typeof date === 'string' && typeof progress === 'number') {
      progressByDate.set(date, progress);
    }
  }

  const days: DayProgress[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    const date = localDateKey(d);
    days.push({
      date,
      letter: DAY_LETTERS[d.getDay()],
      progress: offset === 0 ? todayProgress : (progressByDate.get(date) ?? null),
    });
  }
  return days;
}
