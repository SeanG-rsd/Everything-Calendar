import type { Entry } from '@/api/types';
import { isHistoryEntry, lastSevenDays } from '../goalHistory';
import { localDateKey } from '../dates';

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

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dateOffset(now: Date, offset: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - offset);
  return d;
}

describe('isHistoryEntry', () => {
  it('identifies only entries with payload.kind === "history"', () => {
    expect(isHistoryEntry(makeEntry(1, { kind: 'history', date: '2026-01-01', progress: 0.5 }))).toBe(true);
    expect(isHistoryEntry(makeEntry(2, { title: 'Meditate', target: 10, current: 5 }))).toBe(false);
  });
});

describe('lastSevenDays', () => {
  const now = new Date(2026, 7, 10); // 2026-08-10

  it('returns 7 days ending today, oldest first, with correct weekday letters and dates', () => {
    const days = lastSevenDays([], 0.5, now);

    expect(days).toHaveLength(7);
    for (let i = 0; i < 7; i++) {
      const expected = dateOffset(now, 6 - i);
      expect(days[i].date).toBe(localDateKey(expected));
      expect(days[i].letter).toBe(WEEKDAY_LETTERS[expected.getDay()]);
    }
    expect(days[6].date).toBe(localDateKey(now));
  });

  it('fills past days from history entries and leaves undocumented days null', () => {
    const twoDaysAgo = localDateKey(dateOffset(now, 2));
    const fiveDaysAgo = localDateKey(dateOffset(now, 5));
    const history = [
      makeEntry(1, { kind: 'history', date: twoDaysAgo, progress: 0.9 }),
      makeEntry(2, { kind: 'history', date: fiveDaysAgo, progress: 0.1 }),
    ];

    const days = lastSevenDays(history, 0.5, now);
    const byDate = new Map(days.map((d) => [d.date, d.progress]));

    expect(byDate.get(twoDaysAgo)).toBe(0.9);
    expect(byDate.get(fiveDaysAgo)).toBe(0.1);
    expect(byDate.get(localDateKey(dateOffset(now, 3)))).toBeNull();
  });

  it('always uses the live todayProgress for today, ignoring any history entry dated today', () => {
    const todayKey = localDateKey(now);
    const history = [makeEntry(1, { kind: 'history', date: todayKey, progress: 0.1 })];

    const days = lastSevenDays(history, 0.77, now);

    expect(days[6].progress).toBe(0.77);
  });

  it('passes through null todayProgress (no metrics defined) as gray for today', () => {
    const days = lastSevenDays([], null, now);
    expect(days[6].progress).toBeNull();
  });

  it('ignores non-history entries mixed into the same list', () => {
    const someDate = localDateKey(dateOffset(now, 1));
    const history = [
      makeEntry(1, { title: 'Meditate', target: 10, current: 5 }),
      makeEntry(2, { kind: 'history', date: someDate, progress: 0.6 }),
    ];

    const days = lastSevenDays(history, 0.5, now);
    const day = days.find((d) => d.date === someDate)!;
    expect(day.progress).toBe(0.6);
  });
});
