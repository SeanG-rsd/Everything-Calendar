import { openSqliteStore } from './sqliteStore';
import { ensureDefaultModules } from './seed';
import { resetStaleDailyProgress } from './dailyReset';
import type { DataStore } from './types';

let storePromise: Promise<DataStore> | null = null;

async function initStore(): Promise<DataStore> {
  const store = await openSqliteStore();
  await ensureDefaultModules(store);
  await resetStaleDailyProgress(store);
  return store;
}

export function getStore(): Promise<DataStore> {
  if (!storePromise) {
    storePromise = initStore();
  }
  return storePromise;
}
