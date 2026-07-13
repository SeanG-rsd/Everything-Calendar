import { useCallback, useEffect, useState } from 'react';
import * as modulesApi from '../api/modules';
import type { ApiError } from '../api/client';
import type { Module, ModuleUpdate } from '../api/types';

export function useModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setModules(await modulesApi.listModules());
    } catch (err) {
      setError((err as ApiError).detail);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const update = useCallback(async (id: number, payload: ModuleUpdate) => {
    const updated = await modulesApi.updateModule(id, payload);
    setModules((prev) => prev.map((module) => (module.id === id ? updated : module)));
    return updated;
  }, []);

  return { modules, loading, error, refetch, update };
}
