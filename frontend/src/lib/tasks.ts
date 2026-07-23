import type { Entry } from '@/api/types';
import { todayIso } from './date';

export type Priority = 'low' | 'medium' | 'high';

export const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const PRIORITY_RANK: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

export function taskTitle(entry: Entry): string {
  return typeof entry.payload.title === 'string' ? entry.payload.title : `Task #${entry.id}`;
}

export function taskPriority(entry: Entry): Priority | null {
  const value = entry.payload.priority;
  return value === 'low' || value === 'medium' || value === 'high' ? value : null;
}

export function taskDueDate(entry: Entry): string | null {
  return typeof entry.payload.dueDate === 'string' ? entry.payload.dueDate : null;
}

export function isTaskOverdue(entry: Entry): boolean {
  const dueDate = taskDueDate(entry);
  return dueDate != null && entry.status !== 'done' && dueDate < todayIso();
}

function priorityRank(entry: Entry): number {
  const priority = taskPriority(entry);
  return priority ? PRIORITY_RANK[priority] : 0;
}

/** High priority first, then soonest due date, undated/unprioritized tasks sort last. */
export function compareTasks(a: Entry, b: Entry): number {
  const rankDiff = priorityRank(b) - priorityRank(a);
  if (rankDiff !== 0) return rankDiff;

  const dueA = taskDueDate(a);
  const dueB = taskDueDate(b);
  if (dueA && dueB) return dueA < dueB ? -1 : dueA > dueB ? 1 : 0;
  if (dueA) return -1;
  if (dueB) return 1;

  return a.id - b.id;
}
