import type { ApiError } from '@/api/client';
import * as modulesApi from '@/api/modules';
import type { Module } from '@/api/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface ModulesContextValue {
  modules: Module[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  findByName: (name: string) => Module | undefined;
}

const ModulesContext = createContext<ModulesContextValue | undefined>(undefined);

export function ModulesProvider({ children }: { children: ReactNode }) {
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

  const findByName = useCallback(
    (name: string) => modules.find((module) => module.name === name),
    [modules],
  );

  return (
    <ModulesContext.Provider value={{ modules, loading, error, refetch, findByName }}>
      {children}
    </ModulesContext.Provider>
  );
}

export function useModulesContext(): ModulesContextValue {
  const ctx = useContext(ModulesContext);
  if (!ctx) throw new Error('useModulesContext must be used within a ModulesProvider');
  return ctx;
}
