import { client } from './client';
import type { Module } from './types';

export async function listModules(isActive?: boolean): Promise<Module[]> {
  const { data } = await client.get<Module[]>('/api/modules', {
    params: isActive === undefined ? undefined : { is_active: isActive },
  });
  return data;
}
