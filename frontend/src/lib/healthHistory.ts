import type { Entry } from '@/api/types';
import { localDateKey } from './dates';
import { isHistoryEntry } from './goalHistory';

export type HealthSection = 'diet' | 'water' | 'workout';

export interface DaySectionsMet {
  date: string;
  letter: string;
  diet: boolean;
  water: boolean;
  workout: boolean;
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function metOnDate(historyEntries: Entry[], date: string): boolean {
  const entry = historyEntries.find((e) => isHistoryEntry(e) && e.payload.date === date);
  return typeof entry?.payload.progress === 'number' && entry.payload.progress >= 1;
}

export interface TodayMet {
  diet: boolean;
  water: boolean;
  workout: boolean;
}

/**
 * The last 7 calendar days ending today, oldest first, as a binary
 * met-goal/not per health section (see components/ui/WeeklyHealthBar.tsx —
 * each section always occupies its own third of the ring; only the fill
 * color reflects whether that day's goal was hit). Diet/Water read from
 * `kind: 'history'` entries snapshotted by db/dailyReset.ts right before it
 * clears each day's logged entries (>=100% progress counts as met); Workout
 * has no such snapshot because session entries are never deleted, so its
 * past days are derived straight from `workoutDoneDates`. Today never reads
 * history (nothing's been snapshotted for a day still in progress) — it
 * always uses the live `todayMet` values instead.
 */
export function lastSevenDaysHealth(
  dietHistory: Entry[],
  waterHistory: Entry[],
  workoutDoneDates: Set<string>,
  todayMet: TodayMet,
  now: Date = new Date(),
): DaySectionsMet[] {
  const days: DaySectionsMet[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    const date = localDateKey(d);
    const isToday = offset === 0;
    days.push({
      date,
      letter: DAY_LETTERS[d.getDay()],
      diet: isToday ? todayMet.diet : metOnDate(dietHistory, date),
      water: isToday ? todayMet.water : metOnDate(waterHistory, date),
      workout: isToday ? todayMet.workout : workoutDoneDates.has(date),
    });
  }
  return days;
}
