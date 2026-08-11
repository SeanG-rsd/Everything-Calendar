import type { Entry } from '@/api/types';
import { findGoalEntry, goalAmount, isGoalEntry } from '../goals';

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

describe('isGoalEntry / findGoalEntry', () => {
  it('identifies only the entry with payload.kind === "goal"', () => {
    const log = makeEntry(1, { amountMl: 250 });
    const goal = makeEntry(2, { kind: 'goal', amount: 2000 });

    expect(isGoalEntry(log)).toBe(false);
    expect(isGoalEntry(goal)).toBe(true);
    expect(findGoalEntry([log, goal])).toBe(goal);
    expect(findGoalEntry([log])).toBeUndefined();
  });
});

describe('goalAmount', () => {
  it('returns the numeric amount from the goal entry', () => {
    const goal = makeEntry(1, { kind: 'goal', amount: 2000 });
    expect(goalAmount([goal])).toBe(2000);
  });

  it('returns null when there is no goal entry or the amount is not a number', () => {
    expect(goalAmount([makeEntry(1, { amountMl: 250 })])).toBeNull();
    expect(goalAmount([makeEntry(1, { kind: 'goal', amount: '2000' })])).toBeNull();
    expect(goalAmount([])).toBeNull();
  });
});
