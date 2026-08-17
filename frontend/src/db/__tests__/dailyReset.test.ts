import { localDateKey } from '@/lib/dates';
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

  it('deletes Water entries logged on a previous day, keeping entries logged today', async () => {
    let clock = daysAgo(1);
    const store = createMemoryStore(() => clock);
    const water = await store.insertModule({ name: 'Water', category: 'totals' });
    await store.insertEntry({ module_id: water.id, payload: { amountMl: 500 } });

    clock = new Date();
    await store.insertEntry({ module_id: water.id, payload: { amountMl: 250 } });

    await resetStaleDailyProgress(store);

    const remaining = await store.listEntries({ module_id: water.id, limit: 100 });
    expect(remaining.map((entry) => entry.payload.amountMl)).toEqual([250]);
  });

  it('never deletes a "goal" entry in Daily Diet or Water, no matter how old', async () => {
    const clock = daysAgo(30);
    const store = createMemoryStore(() => clock);
    const diet = await store.insertModule({ name: 'Daily Diet', category: 'totals' });
    const water = await store.insertModule({ name: 'Water', category: 'totals' });
    const dietGoal = await store.insertEntry({ module_id: diet.id, payload: { kind: 'goal', amount: 2000 } });
    const waterGoal = await store.insertEntry({ module_id: water.id, payload: { kind: 'goal', amount: 2000 } });

    await resetStaleDailyProgress(store);

    expect(await store.getEntry(dietGoal.id)).not.toBeNull();
    expect(await store.getEntry(waterGoal.id)).not.toBeNull();
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

  it('records a history snapshot of the average progress before resetting stale Daily Goals entries', async () => {
    let clock = daysAgo(1);
    const store = createMemoryStore(() => clock);
    const goals = await store.insertModule({ name: 'Daily Goals', category: 'totals' });
    await store.insertEntry({
      module_id: goals.id,
      payload: { title: 'Read', target: 10, current: 10, unit: 'pages' }, // 100%
    });
    await store.insertEntry({
      module_id: goals.id,
      payload: { title: 'Meditate', target: 10, current: 4, unit: 'min' }, // 40%
    });
    const yesterdayKey = localDateKey(daysAgo(1));

    clock = new Date();
    await resetStaleDailyProgress(store);

    const entries = await store.listEntries({ module_id: goals.id, limit: 100 });
    const history = entries.filter((e) => e.payload.kind === 'history');
    expect(history).toHaveLength(1);
    expect(history[0].payload.date).toBe(yesterdayKey);
    expect(history[0].payload.progress).toBeCloseTo(0.7);
  });

  it('does not record a history snapshot for a day with no Daily Goals entries at all', async () => {
    const store = createMemoryStore();
    const goals = await store.insertModule({ name: 'Daily Goals', category: 'totals' });

    await resetStaleDailyProgress(store);

    const entries = await store.listEntries({ module_id: goals.id, limit: 100 });
    expect(entries.filter((e) => e.payload.kind === 'history')).toHaveLength(0);
  });

  it('does not duplicate a history snapshot for a date that already has one', async () => {
    let clock = daysAgo(1);
    const store = createMemoryStore(() => clock);
    const goals = await store.insertModule({ name: 'Daily Goals', category: 'totals' });
    await store.insertEntry({
      module_id: goals.id,
      payload: { title: 'Read', target: 10, current: 10, unit: 'pages' },
    });
    const yesterdayKey = localDateKey(daysAgo(1));
    await store.insertEntry({
      module_id: goals.id,
      payload: { kind: 'history', date: yesterdayKey, progress: 0.42 },
    });

    clock = new Date();
    await resetStaleDailyProgress(store);

    const entries = await store.listEntries({ module_id: goals.id, limit: 100 });
    const history = entries.filter((e) => e.payload.kind === 'history');
    expect(history).toHaveLength(1);
    expect(history[0].payload.progress).toBe(0.42);
  });

  it('records a Daily Diet history snapshot (total/goal) before deleting a stale day, when a goal is set', async () => {
    let clock = daysAgo(1);
    const store = createMemoryStore(() => clock);
    const diet = await store.insertModule({ name: 'Daily Diet', category: 'totals' });
    await store.insertEntry({ module_id: diet.id, payload: { kind: 'goal', amount: 2000 } });
    await store.insertEntry({ module_id: diet.id, payload: { name: 'Snack', calories: 1000 } });
    await store.insertEntry({ module_id: diet.id, payload: { name: 'Lunch', calories: 500 } });
    const yesterdayKey = localDateKey(daysAgo(1));

    clock = new Date();
    await resetStaleDailyProgress(store);

    const entries = await store.listEntries({ module_id: diet.id, limit: 100 });
    const history = entries.filter((e) => e.payload.kind === 'history');
    expect(history).toHaveLength(1);
    expect(history[0].payload.date).toBe(yesterdayKey);
    expect(history[0].payload.progress).toBeCloseTo(0.75);
    // the stale logged entries are still cleared, same as before
    expect(entries.filter((e) => e.payload.name)).toHaveLength(0);
  });

  it('records a Water history snapshot (total/goal) using amountMl', async () => {
    let clock = daysAgo(1);
    const store = createMemoryStore(() => clock);
    const water = await store.insertModule({ name: 'Water', category: 'totals' });
    await store.insertEntry({ module_id: water.id, payload: { kind: 'goal', amount: 2000 } });
    await store.insertEntry({ module_id: water.id, payload: { amountMl: 2500 } });

    clock = new Date();
    await resetStaleDailyProgress(store);

    const entries = await store.listEntries({ module_id: water.id, limit: 100 });
    const history = entries.filter((e) => e.payload.kind === 'history');
    expect(history).toHaveLength(1);
    expect(history[0].payload.progress).toBe(1); // clamped to 1 even though 2500/2000 > 1
  });

  it('does not record a Daily Diet/Water history snapshot when no goal is set', async () => {
    let clock = daysAgo(1);
    const store = createMemoryStore(() => clock);
    const diet = await store.insertModule({ name: 'Daily Diet', category: 'totals' });
    await store.insertEntry({ module_id: diet.id, payload: { name: 'Snack', calories: 200 } });

    clock = new Date();
    await resetStaleDailyProgress(store);

    const entries = await store.listEntries({ module_id: diet.id, limit: 100 });
    expect(entries.filter((e) => e.payload.kind === 'history')).toHaveLength(0);
  });

  it('never deletes a Daily Diet/Water "history" entry, no matter how old', async () => {
    const clock = daysAgo(30);
    const store = createMemoryStore(() => clock);
    const diet = await store.insertModule({ name: 'Daily Diet', category: 'totals' });
    const history = await store.insertEntry({
      module_id: diet.id,
      payload: { kind: 'history', date: '2025-01-01', progress: 0.5 },
    });

    await resetStaleDailyProgress(store);

    expect(await store.getEntry(history.id)).not.toBeNull();
  });

  it('does not duplicate a Daily Diet history snapshot for a date that already has one', async () => {
    let clock = daysAgo(1);
    const store = createMemoryStore(() => clock);
    const diet = await store.insertModule({ name: 'Daily Diet', category: 'totals' });
    await store.insertEntry({ module_id: diet.id, payload: { kind: 'goal', amount: 2000 } });
    await store.insertEntry({ module_id: diet.id, payload: { name: 'Snack', calories: 1000 } });
    const yesterdayKey = localDateKey(daysAgo(1));
    await store.insertEntry({
      module_id: diet.id,
      payload: { kind: 'history', date: yesterdayKey, progress: 0.33 },
    });

    clock = new Date();
    await resetStaleDailyProgress(store);

    const entries = await store.listEntries({ module_id: diet.id, limit: 100 });
    const history = entries.filter((e) => e.payload.kind === 'history');
    expect(history).toHaveLength(1);
    expect(history[0].payload.progress).toBe(0.33);
  });

  it.each(['To-Dos', 'Homework'])(
    'deletes a %s item done on a previous day, keeping items done today and items still active',
    async (moduleName) => {
      let clock = daysAgo(1);
      const store = createMemoryStore(() => clock);
      const module = await store.insertModule({ name: moduleName, category: 'list' });
      const doneYesterday = await store.insertEntry({
        module_id: module.id,
        status: 'done',
        payload: { title: 'Done yesterday' },
      });
      const stillActive = await store.insertEntry({
        module_id: module.id,
        status: 'active',
        payload: { title: 'Still active' },
      });

      clock = new Date();
      const doneToday = await store.insertEntry({
        module_id: module.id,
        status: 'done',
        payload: { title: 'Done today' },
      });

      await resetStaleDailyProgress(store);

      const remaining = await store.listEntries({ module_id: module.id, limit: 100 });
      expect(remaining.map((e) => e.id).sort()).toEqual([stillActive.id, doneToday.id].sort());
      expect(await store.getEntry(doneYesterday.id)).toBeNull();
    },
  );

  it('never deletes a "section" entry in To-Dos/Homework, even if somehow marked done', async () => {
    const clock = daysAgo(30);
    const store = createMemoryStore(() => clock);
    const todos = await store.insertModule({ name: 'To-Dos', category: 'list' });
    const section = await store.insertEntry({
      module_id: todos.id,
      status: 'done',
      payload: { kind: 'section', name: 'Errands' },
    });

    await resetStaleDailyProgress(store);

    expect(await store.getEntry(section.id)).not.toBeNull();
  });

  it("deletes a Projects 'task' entry done on a previous day, but never a 'project' entry", async () => {
    let clock = daysAgo(1);
    const store = createMemoryStore(() => clock);
    const projects = await store.insertModule({ name: 'Projects', category: 'list' });
    const project = await store.insertEntry({
      module_id: projects.id,
      status: 'done',
      payload: { kind: 'project', title: 'Everything Calendar' },
    });
    const doneYesterday = await store.insertEntry({
      module_id: projects.id,
      status: 'done',
      payload: { kind: 'task', projectId: project.id, title: 'Done yesterday' },
    });

    clock = new Date();
    await resetStaleDailyProgress(store);

    expect(await store.getEntry(project.id)).not.toBeNull();
    expect(await store.getEntry(doneYesterday.id)).toBeNull();
  });

  it("archives (does not delete) a done project from a previous month, leaving its tasks untouched", async () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

    let clock = lastMonth;
    const store = createMemoryStore(() => clock);
    const projects = await store.insertModule({ name: 'Projects', category: 'list' });
    const project = await store.insertEntry({
      module_id: projects.id,
      status: 'done',
      payload: { kind: 'project', title: 'Old project', description: '', notes: '' },
    });
    const task = await store.insertEntry({
      module_id: projects.id,
      status: 'active',
      payload: { kind: 'task', projectId: project.id, title: 'Leftover task' },
    });

    clock = now;
    await resetStaleDailyProgress(store);

    const archivedProject = await store.getEntry(project.id);
    expect(archivedProject).not.toBeNull();
    expect(archivedProject!.status).toBe('done');
    expect(archivedProject!.payload.archived).toBe(true);
    expect(await store.getEntry(task.id)).not.toBeNull();
  });

  it('does not archive a project done earlier this month, or one that is not done at all', async () => {
    const now = new Date();
    const store = createMemoryStore(() => now);
    const projects = await store.insertModule({ name: 'Projects', category: 'list' });
    const doneThisMonth = await store.insertEntry({
      module_id: projects.id,
      status: 'done',
      payload: { kind: 'project', title: 'Done this month' },
    });
    const inProgress = await store.insertEntry({
      module_id: projects.id,
      status: 'in-progress',
      payload: { kind: 'project', title: 'Still going' },
    });

    await resetStaleDailyProgress(store);

    expect((await store.getEntry(doneThisMonth.id))!.payload.archived).toBeUndefined();
    expect((await store.getEntry(inProgress.id))!.payload.archived).toBeUndefined();
  });

  it('does not re-archive (or otherwise touch) a project already archived', async () => {
    const clock = new Date(2020, 0, 1);
    const store = createMemoryStore(() => clock);
    const projects = await store.insertModule({ name: 'Projects', category: 'list' });
    const alreadyArchived = await store.insertEntry({
      module_id: projects.id,
      status: 'done',
      payload: { kind: 'project', title: 'Old news', archived: true },
    });

    await resetStaleDailyProgress(store);

    expect((await store.getEntry(alreadyArchived.id))!.payload).toEqual({
      kind: 'project',
      title: 'Old news',
      archived: true,
    });
  });

  it('does not delete a Long-Term Goals item done earlier this month, only one done in a previous month', async () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const earlierThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let clock = lastMonth;
    const store = createMemoryStore(() => clock);
    const goals = await store.insertModule({ name: 'Long-Term Goals', category: 'list' });
    const doneLastMonth = await store.insertEntry({
      module_id: goals.id,
      status: 'done',
      payload: { title: 'Done last month' },
    });

    clock = earlierThisMonth;
    const doneThisMonth = await store.insertEntry({
      module_id: goals.id,
      status: 'done',
      payload: { title: 'Done earlier this month' },
    });

    clock = now;
    await resetStaleDailyProgress(store);

    expect(await store.getEntry(doneLastMonth.id)).toBeNull();
    expect(await store.getEntry(doneThisMonth.id)).not.toBeNull();
  });
});
