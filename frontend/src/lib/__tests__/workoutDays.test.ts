import type { Entry } from '@/api/types';
import { dayName, findDayEntry, isDayEntry, listDayNames } from '../workoutDays';

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

describe('isDayEntry / dayName', () => {
  it('identifies only entries with payload.kind === "day"', () => {
    const template = makeEntry(1, { kind: 'template', day: 'Push', title: 'Bench Press' });
    const day = makeEntry(2, { kind: 'day', name: 'Push' });

    expect(isDayEntry(template)).toBe(false);
    expect(isDayEntry(day)).toBe(true);
  });

  it('falls back to a placeholder when name is missing', () => {
    expect(dayName(makeEntry(5, { kind: 'day' }))).toBe('Day #5');
  });
});

describe('listDayNames', () => {
  it('returns day names in creation (id) order, ignoring other entries', () => {
    const entries = [
      makeEntry(3, { kind: 'day', name: 'Legs' }),
      makeEntry(1, { kind: 'day', name: 'Push' }),
      makeEntry(2, { kind: 'template', day: 'Push', title: 'Bench Press' }),
      makeEntry(4, { kind: 'day', name: 'Pull' }),
    ];

    expect(listDayNames(entries)).toEqual(['Push', 'Legs', 'Pull']);
  });

  it('returns an empty array when there are no day entries', () => {
    expect(listDayNames([makeEntry(1, { kind: 'template', day: 'Push', title: 'Bench Press' })])).toEqual([]);
  });
});

describe('findDayEntry', () => {
  it('finds a day entry by name', () => {
    const push = makeEntry(1, { kind: 'day', name: 'Push' });
    const pull = makeEntry(2, { kind: 'day', name: 'Pull' });

    expect(findDayEntry([push, pull], 'Pull')).toBe(pull);
    expect(findDayEntry([push, pull], 'Legs')).toBeUndefined();
  });
});
