import { resetStaleDailyProgress } from '../dailyReset';
import { createMemoryStore } from '../testUtils';

function daysAgo(n: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date;
}

describe('resetStaleDailyProgress', () => {
  it('deletes Daily Diet entries logged on a previous day, keeping entries logged today', async () => {
    let clock = daysAgo(1);
    const store = createMemoryStore(() => clock);
    const diet = await store.insertModule({ name: 'Daily Diet', category: 'totals' });
    await store.insertEntry({ module_id: diet.id, payload: { name: 'Yesterday snack', calories: 200 } });

    clock = new Date();
    await store.insertEntry({ module_id: diet.id, payload: { name: 'Today snack', calories: 100 } });

    await resetStaleDailyProgress(store);

    const remaining = await store.listEntries({ module_id: diet.id, limit: 100 });
    expect(remaining.map((entry) => entry.payload.name)).toEqual(['Today snack']);
  });

  it('resets a Daily Goals entry to current=0 if last touched on a previous day, without deleting it', async () => {
    let clock = daysAgo(1);
    const store = createMemoryStore(() => clock);
    const goals = await store.insertModule({ name: 'Daily Goals', category: 'totals' });
    const entry = await store.insertEntry({
      module_id: goals.id,
      payload: { title: 'Drink water', target: 8, current: 6, unit: 'cups' },
    });

    clock = new Date();
    await resetStaleDailyProgress(store);

    const updated = await store.getEntry(entry.id);
    expect(updated).not.toBeNull();
    expect(updated!.payload).toEqual({ title: 'Drink water', target: 8, current: 0, unit: 'cups' });
  });

  it('does not touch a Daily Goals entry already updated today', async () => {
    const store = createMemoryStore();
    const goals = await store.insertModule({ name: 'Daily Goals', category: 'totals' });
    const entry = await store.insertEntry({
      module_id: goals.id,
      payload: { title: 'Meditate', target: 10, current: 3, unit: 'min' },
    });

    await resetStaleDailyProgress(store);

    const unchanged = await store.getEntry(entry.id);
    expect(unchanged!.payload.current).toBe(3);
  });

  it('is a no-op when Daily Diet/Daily Goals modules do not exist', async () => {
    const store = createMemoryStore();
    await expect(resetStaleDailyProgress(store)).resolves.toBeUndefined();
  });
});
