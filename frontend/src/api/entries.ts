import { getStore } from '@/db/client';
import type { Entry, EntryCreate, EntryListParams, EntryUpdate } from './types';

export async function listEntries(params: EntryListParams): Promise<Entry[]> {
  const store = await getStore();
  return store.listEntries(params);
}

export async function createEntry(payload: EntryCreate): Promise<Entry> {
  const store = await getStore();
  return store.insertEntry(payload);
}

export async function getEntry(id: number): Promise<Entry> {
  const store = await getStore();
  const entry = await store.getEntry(id);
  if (!entry) throw new Error(`Entry ${id} not found`);
  return entry;
}

export async function updateEntry(id: number, payload: EntryUpdate): Promise<Entry> {
  const store = await getStore();
  return store.updateEntry(id, payload);
}

export async function deleteEntry(id: number): Promise<void> {
  const store = await getStore();
  await store.deleteEntry(id);
}
