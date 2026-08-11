import type { Entry } from '@/api/types';

export function metricProgress(entry: Entry): number {
  const target = entry.payload.target;
  const current = entry.payload.current;
  if (typeof target !== 'number' || target <= 0 || typeof current !== 'number') return 0;
  return Math.max(0, Math.min(1, current / target));
}
