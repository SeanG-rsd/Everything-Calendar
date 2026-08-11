import { useCallback, useEffect, useState } from 'react';
import * as entriesApi from '../api/entries';
import type { Entry, EntryCreate, EntryUpdate } from '../api/types';

interface UseEntriesOptions {
  moduleId: number | undefined;
  status?: string;
  limit?: number;
  offset?: number;
}

export function useEntries({ moduleId, status, limit = 20, offset = 0 }: UseEntriesOptions) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (moduleId == null) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setEntries(await entriesApi.listEntries({ module_id: moduleId, status, limit, offset }));
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [moduleId, status, limit, offset]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (payload: Omit<EntryCreate, 'module_id'>) => {
      if (moduleId == null) throw new Error('Cannot create an entry before its module has loaded.');
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

/**
 * Each useEntries() call owns its own local state with no cross-instance
 * sync — fine when a module has exactly one consumer, but the Health tab
 * fetches Diet/Water/Workout entries itself (for the weekly bar) *and*
 * renders DietModuleView/WaterModuleView/WorkoutModuleView, which used to
 * each call useEntries again independently. Logging water in the Water tab
 * updated only that second, private copy, so the bar never saw it. Passing
 * one shared controller down as a prop (see HealthTabView.tsx) fixes that by
 * construction — there's only one piece of state to go stale.
 */
export type EntriesController = ReturnType<typeof useEntries>;
