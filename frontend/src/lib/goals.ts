import type { Entry } from '@/api/types';

/**
 * A "goal" is a singleton entry (payload.kind === 'goal') living alongside a
 * module's regular logged entries, rather than a module-table column — the
 * modules API deliberately exposes no update path (see project memory
 * ec-default-modules), so per-module config rides in the entries table
 * instead, the same way SectionedChecklistView's sections do.
 */
export function isGoalEntry(entry: Entry): boolean {
  return entry.payload.kind === 'goal';
}

export function findGoalEntry(entries: Entry[]): Entry | undefined {
  return entries.find(isGoalEntry);
}

export function goalAmount(entries: Entry[]): number | null {
  const amount = findGoalEntry(entries)?.payload.amount;
  return typeof amount === 'number' ? amount : null;
}
