import type { Entry } from '@/api/types';
import {
  entryDate,
  entryWeightLbs,
  findWeightEntryForDate,
  isWeightGoalEntry,
  isWeightLogEntry,
  poundsToGoal,
  roundWeightLbs,
  weightGoal,
  weightGoalEntry,
  weightLogsSorted,
} from '../weight';

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

describe('isWeightGoalEntry / isWeightLogEntry', () => {
  it('distinguishes the goal entry from log entries', () => {
    const goal = makeEntry(1, { kind: 'goal', targetWeightLbs: 150, direction: 'lose' });
    const log = makeEntry(2, { date: '2026-01-01', weightLbs: 165 });
    expect(isWeightGoalEntry(goal)).toBe(true);
    expect(isWeightGoalEntry(log)).toBe(false);
    expect(isWeightLogEntry(log)).toBe(true);
    expect(isWeightLogEntry(goal)).toBe(false);
  });
});

describe('weightGoal', () => {
  it('reads a well-formed goal entry', () => {
    const entries = [makeEntry(1, { kind: 'goal', targetWeightLbs: 150, direction: 'lose' })];
    expect(weightGoal(entries)).toEqual({ targetWeightLbs: 150, direction: 'lose' });
  });

  it('returns null when there is no goal entry, or it is malformed', () => {
    expect(weightGoal([])).toBeNull();
    expect(weightGoal([makeEntry(1, { kind: 'goal', targetWeightLbs: 150, direction: 'sideways' })])).toBeNull();
    expect(weightGoal([makeEntry(1, { kind: 'goal', direction: 'lose' })])).toBeNull();
  });

  it('finds the goal entry via weightGoalEntry regardless of position among logs', () => {
    const goal = makeEntry(2, { kind: 'goal', targetWeightLbs: 150, direction: 'gain' });
    const entries = [makeEntry(1, { date: '2026-01-01', weightLbs: 165 }), goal];
    expect(weightGoalEntry(entries)).toBe(goal);
  });
});

describe('entryWeightLbs / entryDate', () => {
  it('reads valid fields and ignores anything else', () => {
    expect(entryWeightLbs(makeEntry(1, { weightLbs: 165 }))).toBe(165);
    expect(entryWeightLbs(makeEntry(2, { weightLbs: '165' }))).toBeNull();
    expect(entryDate(makeEntry(3, { date: '2026-01-01' }))).toBe('2026-01-01');
    expect(entryDate(makeEntry(4, {}))).toBeNull();
  });
});

describe('weightLogsSorted', () => {
  it('excludes the goal entry and sorts logs chronologically by date, not id/created_at', () => {
    const entries = [
      makeEntry(1, { date: '2026-01-15', weightLbs: 164 }),
      makeEntry(2, { kind: 'goal', targetWeightLbs: 150, direction: 'lose' }),
      makeEntry(3, { date: '2026-01-01', weightLbs: 168 }),
      makeEntry(4, { date: '2026-01-08', weightLbs: 166 }),
    ];

    expect(weightLogsSorted(entries).map((e) => e.id)).toEqual([3, 4, 1]);
  });
});

describe('findWeightEntryForDate', () => {
  it('finds the log entry matching a date, ignoring the goal entry', () => {
    const entries = [
      makeEntry(1, { date: '2026-01-01', weightLbs: 168 }),
      makeEntry(2, { kind: 'goal', targetWeightLbs: 150, direction: 'lose' }),
    ];

    expect(findWeightEntryForDate(entries, '2026-01-01')?.id).toBe(1);
    expect(findWeightEntryForDate(entries, '2026-01-02')).toBeUndefined();
  });
});

describe('roundWeightLbs', () => {
  it('rounds to the nearest tenth, including away from classic floating-point noise', () => {
    expect(roundWeightLbs(165.34567)).toBe(165.3);
    expect(roundWeightLbs(165.36)).toBe(165.4);
    expect(roundWeightLbs(165.3 - 150)).toBe(15.3); // raw JS math gives 15.299999999999997
    expect(roundWeightLbs(150)).toBe(150);
  });
});

describe('poundsToGoal', () => {
  it('for a "lose" goal, counts down until at or below target, then reads 0', () => {
    const goal = { targetWeightLbs: 150, direction: 'lose' as const };
    expect(poundsToGoal(165, goal)).toBe(15);
    expect(poundsToGoal(150, goal)).toBe(0);
    expect(poundsToGoal(145, goal)).toBe(0);
  });

  it('rounds the result to the nearest tenth rather than leaking floating-point noise', () => {
    const goal = { targetWeightLbs: 150, direction: 'lose' as const };
    expect(poundsToGoal(165.3, goal)).toBe(15.3);
  });

  it('for a "gain" goal, counts up until at or above target, then reads 0', () => {
    const goal = { targetWeightLbs: 180, direction: 'gain' as const };
    expect(poundsToGoal(165, goal)).toBe(15);
    expect(poundsToGoal(180, goal)).toBe(0);
    expect(poundsToGoal(185, goal)).toBe(0);
  });
});
