import { client } from './client';
import type { Module, ModuleUpdate } from './types';

export async function listModules(isActive?: boolean): Promise<Module[]> {
  const { data } = await client.get<Module[]>('/api/modules', {
    params: isActive === undefined ? undefined : { is_active: isActive },
  });
  return data;
}

export async function getModule(id: number): Promise<Module> {
  const { data } = await client.get<Module>(`/api/modules/${id}`);
  return data;
}

export async function updateModule(id: number, payload: ModuleUpdate): Promise<Module> {
  const { data } = await client.put<Module>(`/api/modules/${id}`, payload);
  return data;
}
