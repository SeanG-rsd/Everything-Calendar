import { createMemoryStore } from '../testUtils';

describe('DataStore contract (validated against the in-memory implementation)', () => {
  it('rejects a duplicate module name', async () => {
    const store = createMemoryStore();
    await store.insertModule({ name: 'Tasks', category: 'list' });
    await expect(store.insertModule({ name: 'Tasks', category: 'list' })).rejects.toThrow();
  });

  it('filters entries by module_id and status', async () => {
    const store = createMemoryStore();
    const moduleA = await store.insertModule({ name: 'A', category: 'list' });
    const moduleB = await store.insertModule({ name: 'B', category: 'list' });

    await store.insertEntry({ module_id: moduleA.id, status: 'active' });
    await store.insertEntry({ module_id: moduleA.id, status: 'done' });
    await store.insertEntry({ module_id: moduleB.id, status: 'active' });

    const activeInA = await store.listEntries({ module_id: moduleA.id, status: 'active' });
    expect(activeInA).toHaveLength(1);
    expect(activeInA[0].module_id).toBe(moduleA.id);
    expect(activeInA[0].status).toBe('active');
  });

  it('orders entries by id ascending and applies limit/offset', async () => {
    const store = createMemoryStore();
    const module = await store.insertModule({ name: 'Paged', category: 'list' });
    for (let i = 0; i < 5; i++) {
      await store.insertEntry({ module_id: module.id, payload: { i } });
    }

    const page1 = await store.listEntries({ module_id: module.id, limit: 2, offset: 0 });
    const page2 = await store.listEntries({ module_id: module.id, limit: 2, offset: 2 });

    expect(page1.map((e) => e.payload.i)).toEqual([0, 1]);
    expect(page2.map((e) => e.payload.i)).toEqual([2, 3]);
  });

  it('round-trips create/update/delete for an entry', async () => {
    const store = createMemoryStore();
    const module = await store.insertModule({ name: 'CRUD', category: 'totals' });

    const created = await store.insertEntry({ module_id: module.id, payload: { calories: 100 } });
    expect(created.status).toBe('active');

    const updated = await store.updateEntry(created.id, { status: 'done' });
    expect(updated.status).toBe('done');
    expect(updated.payload).toEqual({ calories: 100 });

    await store.deleteEntry(created.id);
    expect(await store.getEntry(created.id)).toBeNull();
  });

  it('saveTabPreferences persists and a subsequent listTabPreferences reflects the new order', async () => {
    const store = createMemoryStore();
    await store.saveTabPreferences([
      { tab_key: 'tasks', in_bottom_nav: true, sort_order: 0 },
      { tab_key: 'goals', in_bottom_nav: false, sort_order: 1 },
    ]);

    const preferences = await store.listTabPreferences();
    expect(preferences.map((p) => [p.tab_key, p.in_bottom_nav, p.sort_order])).toEqual([
      ['tasks', true, 0],
      ['goals', false, 1],
    ]);
  });

  it('saveTabPreferences upserts by tab_key without creating duplicate rows', async () => {
    const store = createMemoryStore();
    await store.saveTabPreferences([{ tab_key: 'tasks', in_bottom_nav: true, sort_order: 0 }]);
    await store.saveTabPreferences([{ tab_key: 'tasks', in_bottom_nav: false, sort_order: 3 }]);

    const preferences = await store.listTabPreferences();
    expect(preferences).toHaveLength(1);
    expect(preferences[0]).toMatchObject({ tab_key: 'tasks', in_bottom_nav: false, sort_order: 3 });
  });

  it('listTabPreferences returns rows ordered by sort_order ascending regardless of write order', async () => {
    const store = createMemoryStore();
    await store.saveTabPreferences([
      { tab_key: 'financial', in_bottom_nav: true, sort_order: 2 },
      { tab_key: 'tasks', in_bottom_nav: true, sort_order: 0 },
      { tab_key: 'goals', in_bottom_nav: false, sort_order: 1 },
    ]);

    const preferences = await store.listTabPreferences();
    expect(preferences.map((p) => p.tab_key)).toEqual(['tasks', 'goals', 'financial']);
  });
});
