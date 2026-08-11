import type { Entry } from '@/api/types';

export function sumField(entries: Entry[], field: string): number {
  return entries.reduce((sum, entry) => {
    const value = entry.payload[field];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
}
