import type { Entry } from '@/api/types';
import { localDateKey } from '../dates';
import { lastSevenDaysHealth } from '../healthHistory';

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

function dateOffset(now: Date, offset: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - offset);
  return d;
}

describe('lastSevenDaysHealth', () => {
  const now = new Date(2026, 7, 10); // 2026-08-10

  it('returns 7 days ending today, oldest first', () => {
    const days = lastSevenDaysHealth([], [], new Set(), { diet: false, water: false, workout: false }, now);
    expect(days).toHaveLength(7);
    expect(days[6].date).toBe(localDateKey(now));
    expect(days[0].date).toBe(localDateKey(dateOffset(now, 6)));
  });

  it('marks diet/water met when a history entry has progress >= 1, unmet below that', () => {
    const twoDaysAgo = localDateKey(dateOffset(now, 2));
    const threeDaysAgo = localDateKey(dateOffset(now, 3));
    const dietHistory = [
      makeEntry(1, { kind: 'history', date: twoDaysAgo, progress: 1.2 }),
      makeEntry(2, { kind: 'history', date: threeDaysAgo, progress: 0.6 }),
    ];

    const days = lastSevenDaysHealth(dietHistory, [], new Set(), { diet: false, water: false, workout: false }, now);
    const byDate = new Map(days.map((d) => [d.date, d.diet]));

    expect(byDate.get(twoDaysAgo)).toBe(true);
    expect(byDate.get(threeDaysAgo)).toBe(false);
  });

  it('treats a day with no history entry at all as unmet (renders gray, same as attempted-but-missed)', () => {
    const days = lastSevenDaysHealth([], [], new Set(), { diet: false, water: false, workout: false }, now);
    expect(days.every((d) => d.diet === false && d.water === false)).toBe(true);
  });

  it('marks workout met purely from workoutDoneDates, independent of history entries', () => {
    const fourDaysAgo = localDateKey(dateOffset(now, 4));
    const days = lastSevenDaysHealth(
      [],
      [],
      new Set([fourDaysAgo]),
      { diet: false, water: false, workout: false },
      now,
    );
    const byDate = new Map(days.map((d) => [d.date, d.workout]));
    expect(byDate.get(fourDaysAgo)).toBe(true);
  });

  it("always uses the live todayMet for today, ignoring any history entry dated today", () => {
    const todayKey = localDateKey(now);
    const dietHistory = [makeEntry(1, { kind: 'history', date: todayKey, progress: 1 })];

    const days = lastSevenDaysHealth(
      dietHistory,
      [],
      new Set([todayKey]),
      { diet: false, water: true, workout: false },
      now,
    );

    expect(days[6]).toMatchObject({ diet: false, water: true, workout: false });
  });
});
