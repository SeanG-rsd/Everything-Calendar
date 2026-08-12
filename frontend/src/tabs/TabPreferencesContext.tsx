import * as tabPreferencesApi from '@/api/tabPreferences';
import type { TabPreference, TabPreferenceUpsert } from '@/api/types';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

interface TabPreferencesContextValue {
  preferences: TabPreference[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  savePreferences: (items: TabPreferenceUpsert[]) => Promise<void>;
}

const TabPreferencesContext = createContext<TabPreferencesContextValue | undefined>(undefined);

export function TabPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<TabPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPreferences(await tabPreferencesApi.listTabPreferences());
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const savePreferences = useCallback(
    async (items: TabPreferenceUpsert[]) => {
      const optimisticUpdatedAt = new Date().toISOString();
      setPreferences(items.map((item) => ({ ...item, updated_at: optimisticUpdatedAt })));
      try {
        setPreferences(await tabPreferencesApi.saveTabPreferences(items));
      } catch (err) {
        setError((err as Error).message ?? 'Something went wrong.');
        await refetch();
      }
    },
    [refetch],
  );

  return (
    <TabPreferencesContext.Provider value={{ preferences, loading, error, refetch, savePreferences }}>
      {children}
    </TabPreferencesContext.Provider>
  );
}

export function useTabPreferencesContext(): TabPreferencesContextValue {
  const ctx = useContext(TabPreferencesContext);
  if (!ctx) throw new Error('useTabPreferencesContext must be used within a TabPreferencesProvider');
  return ctx;
}
