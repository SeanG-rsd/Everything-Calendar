import { ensureDefaultModules, ensureWorkoutDaySeeds } from '../seed';
import { createMemoryStore } from '../testUtils';

describe('ensureDefaultModules', () => {
  it('creates the 8 default modules with the correct name/category pairs', async () => {
    const store = createMemoryStore();
    await ensureDefaultModules(store);

    const modules = await store.listModules();
    expect(modules.map((m) => [m.name, m.category])).toEqual([
      ['To-Dos', 'list'],
      ['Homework', 'list'],
      ['Long-Term Goals', 'list'],
      ['Daily Diet', 'totals'],
      ['Water', 'totals'],
      ['Daily Goals', 'totals'],
      ['Daily Workout', 'totals'],
      ['Savings Goals', 'totals'],
    ]);
  });

  it('seeds entries for every default module', async () => {
    const store = createMemoryStore();
    await ensureDefaultModules(store);

    const modules = await store.listModules();
    for (const module of modules) {
      const count = await store.countEntriesForModule(module.id);
      expect(count).toBeGreaterThan(0);
    }
  });

  it('does not duplicate modules when run twice', async () => {
    const store = createMemoryStore();
    await ensureDefaultModules(store);
    await ensureDefaultModules(store);

    const modules = await store.listModules();
    expect(modules).toHaveLength(8);
  });

  it('does not re-seed entries for a module the user has emptied out', async () => {
    const store = createMemoryStore();
    await ensureDefaultModules(store);

    const modules = await store.listModules();
    const tasksModule = modules.find((m) => m.name === 'To-Dos')!;
    const taskEntries = await store.listEntries({ module_id: tasksModule.id, limit: 100 });
    for (const entry of taskEntries) {
      await store.deleteEntry(entry.id);
    }

    await ensureDefaultModules(store);

    const countAfter = await store.countEntriesForModule(tasksModule.id);
    expect(countAfter).toBe(0);
  });
});

describe('ensureWorkoutDaySeeds', () => {
  it('backfills a day entry for each distinct legacy template day name', async () => {
    const store = createMemoryStore();
    const module = await store.insertModule({ name: 'Daily Workout', category: 'totals' });
    await store.insertEntry({
      module_id: module.id,
      payload: { kind: 'template', day: 'Push', title: 'Bench Press', targetSets: 3, targetReps: 8 },
    });
    await store.insertEntry({
      module_id: module.id,
      payload: { kind: 'template', day: 'Push', title: 'Overhead Press', targetSets: 3, targetReps: 8 },
    });
    await store.insertEntry({
      module_id: module.id,
      payload: { kind: 'template', day: 'Legs', title: 'Squat', targetSets: 3, targetReps: 5 },
    });

    await ensureWorkoutDaySeeds(store);

    const entries = await store.listEntries({ module_id: module.id, limit: 100 });
    const dayNames = entries.filter((e) => e.payload.kind === 'day').map((e) => e.payload.name);
    expect(dayNames).toEqual(['Push', 'Legs']);
  });

  it('does not re-add a day the user has since deleted, once any day entry exists', async () => {
    const store = createMemoryStore();
    const module = await store.insertModule({ name: 'Daily Workout', category: 'totals' });
    await store.insertEntry({
      module_id: module.id,
      payload: { kind: 'template', day: 'Push', title: 'Bench Press', targetSets: 3, targetReps: 8 },
    });
    // Simulates a user who already migrated and then deleted "Push" from the rotation.
    await store.insertEntry({ module_id: module.id, payload: { kind: 'day', name: 'Pull' } });

    await ensureWorkoutDaySeeds(store);

    const entries = await store.listEntries({ module_id: module.id, limit: 100 });
    const dayNames = entries.filter((e) => e.payload.kind === 'day').map((e) => e.payload.name);
    expect(dayNames).toEqual(['Pull']);
  });

  it('does nothing when the Daily Workout module does not exist', async () => {
    const store = createMemoryStore();
    await expect(ensureWorkoutDaySeeds(store)).resolves.toBeUndefined();
  });
});
