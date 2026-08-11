import type { Entry } from '@/api/types';
import { sumField } from '../logTotals';

function makeEntry(id: number, payload: Record<string, unknown>): Entry {
  return {
    id,
    module_id: 1,
    status: 'active',
    payload,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('sumField', () => {
  it('sums a numeric payload field across entries', () => {
    const entries = [makeEntry(1, { calories: 100 }), makeEntry(2, { calories: 250 })];
    expect(sumField(entries, 'calories')).toBe(350);
  });

  it('treats missing or non-numeric values as 0', () => {
    const entries = [makeEntry(1, { calories: 100 }), makeEntry(2, { name: 'no calories field' }), makeEntry(3, { calories: '50' })];
    expect(sumField(entries, 'calories')).toBe(100);
  });

  it('returns 0 for an empty list', () => {
    expect(sumField([], 'calories')).toBe(0);
  });
});
