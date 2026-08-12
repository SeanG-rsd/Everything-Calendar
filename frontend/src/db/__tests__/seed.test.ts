import { ensureDefaultModules, ensureDefaultTabPreferences, ensureWorkoutDaySeeds } from '../seed';
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

describe('ensureDefaultTabPreferences', () => {
  it('seeds the 5 default tab preferences with the correct starting placement/order', async () => {
    const store = createMemoryStore();
    await ensureDefaultTabPreferences(store);

    const preferences = await store.listTabPreferences();
    expect(preferences.map((p) => [p.tab_key, p.in_bottom_nav, p.sort_order])).toEqual([
      ['tasks', true, 0],
      ['health', true, 1],
      ['daily-goals', true, 2],
      ['financial', true, 3],
      ['goals', false, 4],
    ]);
  });

  it('does not reset a user-customized order when run again', async () => {
    const store = createMemoryStore();
    await ensureDefaultTabPreferences(store);

    await store.saveTabPreferences([
      { tab_key: 'goals', in_bottom_nav: true, sort_order: 0 },
      { tab_key: 'tasks', in_bottom_nav: true, sort_order: 1 },
      { tab_key: 'health', in_bottom_nav: false, sort_order: 2 },
      { tab_key: 'daily-goals', in_bottom_nav: true, sort_order: 3 },
      { tab_key: 'financial', in_bottom_nav: false, sort_order: 4 },
    ]);

    await ensureDefaultTabPreferences(store);

    const preferences = await store.listTabPreferences();
    expect(preferences.map((p) => [p.tab_key, p.in_bottom_nav, p.sort_order])).toEqual([
      ['goals', true, 0],
      ['tasks', true, 1],
      ['health', false, 2],
      ['daily-goals', true, 3],
      ['financial', false, 4],
    ]);
  });

  it('seeds only missing keys, leaving existing rows untouched', async () => {
    const store = createMemoryStore();
    await store.saveTabPreferences([
      { tab_key: 'tasks', in_bottom_nav: false, sort_order: 7 },
      { tab_key: 'goals', in_bottom_nav: true, sort_order: 2 },
    ]);

    await ensureDefaultTabPreferences(store);

    const preferences = await store.listTabPreferences();
    const byKey = new Map(preferences.map((p) => [p.tab_key, p]));
    expect(byKey.get('tasks')).toMatchObject({ in_bottom_nav: false, sort_order: 7 });
    expect(byKey.get('goals')).toMatchObject({ in_bottom_nav: true, sort_order: 2 });
    expect(byKey.get('health')).toMatchObject({ in_bottom_nav: true, sort_order: 1 });
    expect(byKey.get('daily-goals')).toMatchObject({ in_bottom_nav: true, sort_order: 2 });
    expect(byKey.get('financial')).toMatchObject({ in_bottom_nav: true, sort_order: 3 });
    expect(preferences).toHaveLength(5);
  });
});
