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
});
