import type { Entry } from '@/api/types';

export type WeightGoalDirection = 'lose' | 'gain';

export interface WeightGoal {
  targetWeightLbs: number;
  direction: WeightGoalDirection;
}

/** Weights are entered and displayed to the nearest tenth of a pound — plain
 * floating-point arithmetic on tenths (e.g. 165.3 - 150) routinely produces
 * something like 15.299999999999997, so every computed or stored weight
 * value should be passed through this before it's saved or shown. */
export function roundWeightLbs(value: number): number {
  return Math.round(value * 10) / 10;
}

export function isWeightGoalEntry(entry: Entry): boolean {
  return entry.payload.kind === 'goal';
}

export function isWeightLogEntry(entry: Entry): boolean {
  return !isWeightGoalEntry(entry);
}

export function weightGoalEntry(entries: Entry[]): Entry | undefined {
  return entries.find(isWeightGoalEntry);
}

export function weightGoal(entries: Entry[]): WeightGoal | null {
  const entry = weightGoalEntry(entries);
  if (!entry) return null;
  const targetWeightLbs = entry.payload.targetWeightLbs;
  const direction = entry.payload.direction;
  if (typeof targetWeightLbs !== 'number') return null;
  if (direction !== 'lose' && direction !== 'gain') return null;
  return { targetWeightLbs, direction };
}

export function entryWeightLbs(entry: Entry): number | null {
  return typeof entry.payload.weightLbs === 'number' ? entry.payload.weightLbs : null;
}

export function entryDate(entry: Entry): string | null {
  return typeof entry.payload.date === 'string' ? entry.payload.date : null;
}

/** Log entries only, chronologically sorted by their logged date (not created_at — a backfilled
 * past-dated entry may be created after later ones). */
export function weightLogsSorted(entries: Entry[]): Entry[] {
  return entries
    .filter(isWeightLogEntry)
    .filter((entry) => entryDate(entry) != null)
    .sort((a, b) => entryDate(a)!.localeCompare(entryDate(b)!));
}

export function findWeightEntryForDate(entries: Entry[], date: string): Entry | undefined {
  return entries.find((entry) => isWeightLogEntry(entry) && entryDate(entry) === date);
}

/** Direction-aware distance remaining to the goal — 0 once it's been reached or passed, never
 * negative (a negative "N lbs to go" reads as broken, not as "past the goal"). */
export function poundsToGoal(currentWeightLbs: number, goal: WeightGoal): number {
  const raw = goal.direction === 'lose' ? currentWeightLbs - goal.targetWeightLbs : goal.targetWeightLbs - currentWeightLbs;
  return roundWeightLbs(Math.max(0, raw));
}
