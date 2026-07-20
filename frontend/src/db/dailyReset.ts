import type { Entry } from '@/api/types';

import type { DataStore } from './types';

const DIET_MODULE_NAME = 'Daily Diet';
const GOALS_MODULE_NAME = 'Daily Goals';

const ALL_ENTRIES_LIMIT = 10_000;

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function isToday(isoString: string): boolean {
  return localDateKey(new Date(isoString)) === localDateKey(new Date());
}

async function clearDietEntries(store: DataStore, shouldClear: (entry: Entry) => boolean): Promise<void> {
  const dietModule = (await store.listModules()).find((module) => module.name === DIET_MODULE_NAME);
  if (!dietModule) return;

  const entries = await store.listEntries({ module_id: dietModule.id, limit: ALL_ENTRIES_LIMIT });
  for (const entry of entries) {
    if (shouldClear(entry)) {
      await store.deleteEntry(entry.id);
    }
  }
}

async function resetGoalsProgress(store: DataStore, shouldReset: (entry: Entry) => boolean): Promise<void> {
  const goalsModule = (await store.listModules()).find((module) => module.name === GOALS_MODULE_NAME);
  if (!goalsModule) return;

  const entries = await store.listEntries({ module_id: goalsModule.id, limit: ALL_ENTRIES_LIMIT });
  for (const entry of entries) {
    const current = typeof entry.payload.current === 'number' ? entry.payload.current : 0;
    if (current !== 0 && shouldReset(entry)) {
      await store.updateEntry(entry.id, { payload: { ...entry.payload, current: 0 } });
    }
  }
}

/**
 * Runs once per app launch (see client.ts). "Daily" modules have no built-in
 * expiry — Daily Diet entries are logged food that should only count for the
 * day they were logged, and Daily Goals' `current` only ever changes via the
 * +/- buttons, so both would otherwise carry over indefinitely.
 */
export async function resetStaleDailyProgress(store: DataStore): Promise<void> {
  await clearDietEntries(store, (entry) => !isToday(entry.created_at));
  await resetGoalsProgress(store, (entry) => !isToday(entry.updated_at));
}
