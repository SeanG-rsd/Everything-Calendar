import { getStore } from '@/db/client';
import type { TabPreference, TabPreferenceUpsert } from './types';

export async function listTabPreferences(): Promise<TabPreference[]> {
  const store = await getStore();
  return store.listTabPreferences();
}

export async function saveTabPreferences(items: TabPreferenceUpsert[]): Promise<TabPreference[]> {
  const store = await getStore();
  return store.saveTabPreferences(items);
}
