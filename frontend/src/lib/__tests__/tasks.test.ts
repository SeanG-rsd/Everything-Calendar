import type { Entry } from '@/api/types';
import { compareTasks, isTaskOverdue, taskDueDate, taskPriority } from '../tasks';

function makeEntry(id: number, payload: Record<string, unknown>, status = 'active'): Entry {
  return {
    id,
    module_id: 1,
    status,
    payload,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('taskPriority / taskDueDate', () => {
  it('reads valid priority values and ignores invalid ones', () => {
    expect(taskPriority(makeEntry(1, { priority: 'high' }))).toBe('high');
    expect(taskPriority(makeEntry(2, { priority: 'urgent' }))).toBeNull();
    expect(taskPriority(makeEntry(3, {}))).toBeNull();
  });

  it('reads a string dueDate and ignores anything else', () => {
    expect(taskDueDate(makeEntry(1, { dueDate: '2026-08-01' }))).toBe('2026-08-01');
    expect(taskDueDate(makeEntry(2, { dueDate: 12345 }))).toBeNull();
  });
});

describe('isTaskOverdue', () => {
  it('is true only for a past due date on a non-done task', () => {
    expect(isTaskOverdue(makeEntry(1, { dueDate: '2000-01-01' }))).toBe(true);
    expect(isTaskOverdue(makeEntry(2, { dueDate: '2000-01-01' }, 'done'))).toBe(false);
    expect(isTaskOverdue(makeEntry(3, { dueDate: '2999-01-01' }))).toBe(false);
    expect(isTaskOverdue(makeEntry(4, {}))).toBe(false);
  });
});

describe('compareTasks', () => {
  it('sorts higher priority before lower, and unprioritized last', () => {
    const low = makeEntry(1, { priority: 'low' });
    const high = makeEntry(2, { priority: 'high' });
    const none = makeEntry(3, {});
    const medium = makeEntry(4, { priority: 'medium' });

    expect([low, none, medium, high].sort(compareTasks)).toEqual([high, medium, low, none]);
  });

  it('breaks ties within the same priority by soonest due date first', () => {
    const later = makeEntry(1, { priority: 'high', dueDate: '2026-09-01' });
    const sooner = makeEntry(2, { priority: 'high', dueDate: '2026-08-01' });
    const undated = makeEntry(3, { priority: 'high' });

    expect([later, undated, sooner].sort(compareTasks)).toEqual([sooner, later, undated]);
  });

  it('falls back to id order when priority and due date are both equal/absent', () => {
    const a = makeEntry(2, {});
    const b = makeEntry(1, {});
    expect([a, b].sort(compareTasks)).toEqual([b, a]);
  });
});
