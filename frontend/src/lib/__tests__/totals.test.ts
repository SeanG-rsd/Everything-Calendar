import type { Entry } from '@/api/types';
import { metricProgress } from '../totals';

function makeEntry(payload: Record<string, unknown>): Entry {
  return {
    id: 1,
    module_id: 1,
    status: 'active',
    payload,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('metricProgress', () => {
  it('divides current by target, clamped to [0, 1]', () => {
    expect(metricProgress(makeEntry({ target: 10, current: 5 }))).toBe(0.5);
    expect(metricProgress(makeEntry({ target: 10, current: 20 }))).toBe(1);
    expect(metricProgress(makeEntry({ target: 10, current: -5 }))).toBe(0);
  });

  it('returns 0 when target/current are missing or target is not positive', () => {
    expect(metricProgress(makeEntry({ current: 5 }))).toBe(0);
    expect(metricProgress(makeEntry({ target: 10 }))).toBe(0);
    expect(metricProgress(makeEntry({ target: 0, current: 5 }))).toBe(0);
    expect(metricProgress(makeEntry({ target: -10, current: 5 }))).toBe(0);
  });
});
