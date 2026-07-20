import { ensureDefaultModules } from '../seed';
import { createMemoryStore } from '../testUtils';

describe('ensureDefaultModules', () => {
  it('creates the 7 default modules with the correct name/category pairs', async () => {
    const store = createMemoryStore();
    await ensureDefaultModules(store);

    const modules = await store.listModules();
    expect(modules.map((m) => [m.name, m.category])).toEqual([
      ['To-Dos', 'list'],
      ['Homework', 'list'],
      ['Long-Term Goals', 'list'],
      ['Daily Diet', 'totals'],
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
    expect(modules).toHaveLength(7);
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
