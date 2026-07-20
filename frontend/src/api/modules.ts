import { getStore } from '@/db/client';
import type { Module } from './types';

export async function listModules(isActive?: boolean): Promise<Module[]> {
  const store = await getStore();
  return store.listModules(isActive);
}
