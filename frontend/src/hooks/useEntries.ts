import { useCallback, useEffect, useState } from 'react';
import * as entriesApi from '../api/entries';
import type { ApiError } from '../api/client';
import type { Entry, EntryCreate, EntryUpdate } from '../api/types';

interface UseEntriesOptions {
  moduleId: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export function useEntries({ moduleId, status, limit = 20, offset = 0 }: UseEntriesOptions) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await entriesApi.listEntries({ module_id: moduleId, status, limit, offset }));
    } catch (err) {
      setError((err as ApiError).detail);
    } finally {
      setLoading(false);
    }
  }, [moduleId, status, limit, offset]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (payload: Omit<EntryCreate, 'module_id'>) => {
      const created = await entriesApi.createEntry({ ...payload, module_id: moduleId });
      await refetch();
      return created;
    },
    [moduleId, refetch],
  );

  const update = useCallback(async (id: number, payload: EntryUpdate) => {
    const updated = await entriesApi.updateEntry(id, payload);
    setEntries((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));
    return updated;
  }, []);

  const remove = useCallback(async (id: number) => {
    await entriesApi.deleteEntry(id);
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  return { entries, loading, error, refetch, create, update, remove };
}
