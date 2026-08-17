import type { Entry } from '@/api/types';
import { isThisMonth, isToday, localDateKey } from '@/lib/dates';
import { goalAmount, isGoalEntry } from '@/lib/goals';
import { isHistoryEntry } from '@/lib/goalHistory';
import { sumField } from '@/lib/logTotals';
import { metricProgress } from '@/lib/totals';

import type { DataStore } from './types';

const DIET_MODULE_NAME = 'Daily Diet';
const WATER_MODULE_NAME = 'Water';
const GOALS_MODULE_NAME = 'Daily Goals';
const TODO_LIST_MODULE_NAMES = ['To-Dos', 'Homework'];
const PROJECTS_MODULE_NAME = 'Projects';
const LONG_TERM_GOALS_MODULE_NAME = 'Long-Term Goals';

const LOGGED_AMOUNT_FIELD: Readonly<Record<string, string>> = {
  [DIET_MODULE_NAME]: 'calories',
  [WATER_MODULE_NAME]: 'amountMl',
};

const ALL_ENTRIES_LIMIT = 10_000;

/**
 * A module's `kind: 'goal'` entry (see lib/goals.ts) is persistent config,
 * and a `kind: 'history'` entry (see lib/goalHistory.ts) is itself a
 * snapshot record — neither is a logged-for-today item, so neither may ever
 * be swept up by the date-based clear below.
 *
 * Before a stale day's logged entries are deleted, this records whether that
 * day's total met the module's goal as a `kind: 'history'` entry (used by
 * the Health tab's weekly bar — see lib/healthHistory.ts), grouped by the
 * calendar day each entry was logged on (usually all the same day, but can
 * span several if the app sat unopened). A day with no logged entries, or no
 * goal set at the time of the snapshot, gets no snapshot at all — that's
 * what lets the weekly bar render it as "no data" (gray) rather than "goal
 * missed" (also gray, but a different underlying state).
 */
async function clearStaleLoggedEntries(store: DataStore, moduleName: string): Promise<void> {
  const module = (await store.listModules()).find((m) => m.name === moduleName);
  if (!module) return;

  const entries = await store.listEntries({ module_id: module.id, limit: ALL_ENTRIES_LIMIT });
  const loggedEntries = entries.filter((entry) => !isGoalEntry(entry) && !isHistoryEntry(entry));
  const staleEntries = loggedEntries.filter((entry) => !isToday(entry.created_at));

  const field = LOGGED_AMOUNT_FIELD[moduleName];
  const goal = field ? goalAmount(entries) : null;
  if (field && goal != null && staleEntries.length > 0) {
    const staleByDate = new Map<string, Entry[]>();
    for (const entry of staleEntries) {
      const date = localDateKey(new Date(entry.created_at));
      const group = staleByDate.get(date) ?? [];
      group.push(entry);
      staleByDate.set(date, group);
    }

    const alreadySnapshotted = new Set(entries.filter(isHistoryEntry).map((entry) => entry.payload.date));

    for (const [date, group] of staleByDate) {
      if (alreadySnapshotted.has(date)) continue;
      const progress = Math.max(0, Math.min(1, sumField(group, field) / goal));
      await store.insertEntry({ module_id: module.id, status: 'active', payload: { kind: 'history', date, progress } });
    }
  }

  for (const entry of staleEntries) {
    await store.deleteEntry(entry.id);
  }
}

/**
 * Before a stale Daily Goals metric gets its `current` zeroed for the new
 * day, record that day's finalized average progress (see lib/goalHistory.ts)
 * so the weekly progress bar has something to show for it. Stale entries are
 * grouped by the calendar day they were last touched — usually all the same
 * day (the last time the app was open), but they can span several if the app
 * sat unopened for a while. Days with no entries at all (the app never
 * having been opened) get no snapshot, which is what lets the weekly bar
 * render them as "no data" instead of 0%.
 */
async function snapshotAndResetGoalsProgress(store: DataStore): Promise<void> {
  const goalsModule = (await store.listModules()).find((module) => module.name === GOALS_MODULE_NAME);
  if (!goalsModule) return;

  const entries = await store.listEntries({ module_id: goalsModule.id, limit: ALL_ENTRIES_LIMIT });
  const staleMetrics = entries.filter((entry) => !isHistoryEntry(entry) && !isToday(entry.updated_at));
  if (staleMetrics.length === 0) return;

  const staleByDate = new Map<string, Entry[]>();
  for (const entry of staleMetrics) {
    const date = localDateKey(new Date(entry.updated_at));
    const group = staleByDate.get(date) ?? [];
    group.push(entry);
    staleByDate.set(date, group);
  }

  const alreadySnapshotted = new Set(
    entries.filter(isHistoryEntry).map((entry) => entry.payload.date),
  );

  for (const [date, group] of staleByDate) {
    if (alreadySnapshotted.has(date)) continue;
    const progress = group.reduce((sum, entry) => sum + metricProgress(entry), 0) / group.length;
    await store.insertEntry({ module_id: goalsModule.id, status: 'active', payload: { kind: 'history', date, progress } });
  }

  for (const entry of staleMetrics) {
    const current = typeof entry.payload.current === 'number' ? entry.payload.current : 0;
    if (current === 0) continue;
    await store.updateEntry(entry.id, { payload: { ...entry.payload, current: 0 } });
  }
}

/**
 * A `done` to-do/task is only useful as a "yes, I finished this" confirmation
 * for the rest of the day it was completed on — once a new day starts, it's
 * just clutter. Keyed off `updated_at` (bumped every time status changes), so
 * something finished today survives until the app is next opened on a later
 * day, same idea as clearStaleLoggedEntries above.
 */
async function clearCompletedTodos(store: DataStore, moduleName: string): Promise<void> {
  const module = (await store.listModules()).find((m) => m.name === moduleName);
  if (!module) return;

  const entries = await store.listEntries({ module_id: module.id, limit: ALL_ENTRIES_LIMIT });
  for (const entry of entries) {
    if (entry.payload.kind === 'section') continue; // organizational, never itself completable
    if (entry.status === 'done' && !isToday(entry.updated_at)) {
      await store.deleteEntry(entry.id);
    }
  }
}

/** Same idea as clearCompletedTodos, but scoped to a project's `kind: 'task'` entries only — the
 * `kind: 'project'` entries sharing that module are never swept by this. */
async function clearCompletedProjectTasks(store: DataStore): Promise<void> {
  const module = (await store.listModules()).find((m) => m.name === PROJECTS_MODULE_NAME);
  if (!module) return;

  const entries = await store.listEntries({ module_id: module.id, limit: ALL_ENTRIES_LIMIT });
  for (const entry of entries) {
    if (entry.payload.kind !== 'task') continue;
    if (entry.status === 'done' && !isToday(entry.updated_at)) {
      await store.deleteEntry(entry.id);
    }
  }
}

/**
 * Long-Term Goals are aspirational, not day-scoped tasks, so a finished one
 * is worth leaving checked off for longer than a to-do — swept monthly
 * instead of daily.
 */
async function clearCompletedLongTermGoals(store: DataStore): Promise<void> {
  const module = (await store.listModules()).find((m) => m.name === LONG_TERM_GOALS_MODULE_NAME);
  if (!module) return;

  const entries = await store.listEntries({ module_id: module.id, limit: ALL_ENTRIES_LIMIT });
  for (const entry of entries) {
    if (entry.status === 'done' && !isThisMonth(entry.updated_at)) {
      await store.deleteEntry(entry.id);
    }
  }
}

/**
 * Unlike Long-Term Goals, a project that's been `done` past the calendar
 * month it was finished in is archived (payload.archived = true) rather than
 * deleted — its tasks are left untouched, still reachable via the project's
 * own detail screen once it's surfaced in the Projects tab's Archived
 * section (see lib/projects.ts isProjectArchived / ProjectsTabView).
 */
async function archiveCompletedProjects(store: DataStore): Promise<void> {
  const module = (await store.listModules()).find((m) => m.name === PROJECTS_MODULE_NAME);
  if (!module) return;

  const entries = await store.listEntries({ module_id: module.id, limit: ALL_ENTRIES_LIMIT });
  for (const entry of entries) {
    if (entry.payload.kind !== 'project') continue;
    if (entry.payload.archived === true) continue;
    if (entry.status === 'done' && !isThisMonth(entry.updated_at)) {
      await store.updateEntry(entry.id, { payload: { ...entry.payload, archived: true } });
    }
  }
}

/**
 * Runs once per app launch (see client.ts). "Daily" modules have no built-in
 * expiry — Daily Diet/Water entries are logged items that should only count
 * for the day they were logged, and Daily Goals' `current` only ever changes
 * via the +/- buttons, so both would otherwise carry over indefinitely.
 * Also sweeps completed to-do/task items (daily), archives completed
 * projects (monthly), and clears completed Long-Term Goals (monthly) — see
 * clearCompletedTodos, archiveCompletedProjects, and
 * clearCompletedLongTermGoals above.
 */
export async function resetStaleDailyProgress(store: DataStore): Promise<void> {
  await clearStaleLoggedEntries(store, DIET_MODULE_NAME);
  await clearStaleLoggedEntries(store, WATER_MODULE_NAME);
  await snapshotAndResetGoalsProgress(store);
  for (const moduleName of TODO_LIST_MODULE_NAMES) {
    await clearCompletedTodos(store, moduleName);
  }
  await clearCompletedProjectTasks(store);
  await archiveCompletedProjects(store);
  await clearCompletedLongTermGoals(store);
}
