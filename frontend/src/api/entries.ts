import { client } from './client';
import type { Entry, EntryCreate, EntryListParams, EntryUpdate } from './types';

export async function listEntries(params: EntryListParams): Promise<Entry[]> {
  const { data } = await client.get<Entry[]>('/api/entries', { params });
  return data;
}

export async function createEntry(payload: EntryCreate): Promise<Entry> {
  const { data } = await client.post<Entry>('/api/entries', payload);
  return data;
}

export async function getEntry(id: number): Promise<Entry> {
  const { data } = await client.get<Entry>(`/api/entries/${id}`);
  return data;
}

export async function updateEntry(id: number, payload: EntryUpdate): Promise<Entry> {
  const { data } = await client.put<Entry>(`/api/entries/${id}`, payload);
  return data;
}

export async function deleteEntry(id: number): Promise<void> {
  await client.delete(`/api/entries/${id}`);
}
