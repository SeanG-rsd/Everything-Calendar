import type { Entry } from '@/api/types';
import { useEntries } from '@/hooks/useEntries';
import { useModulesContext } from '@/modules/ModulesContext';
import { getModuleAccentKey } from '@/theme/moduleAccent';
import { moduleClassNames } from '@/theme/moduleClassNames';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Modal } from '../ui/Modal';
import { ProgressRing } from '../ui/ProgressRing';
import { Spinner } from '../ui/Spinner';
import { TotalsEntryForm, type TotalsEntryValues } from './TotalsEntryForm';

interface TotalsModuleViewProps {
  moduleName: string;
}

function metricProgress(entry: Entry): number {
  const target = entry.payload.target;
  const current = entry.payload.current;
  if (typeof target !== 'number' || target <= 0 || typeof current !== 'number') return 0;
  return Math.max(0, Math.min(1, current / target));
}

function entryTitle(entry: Entry): string {
  return typeof entry.payload.title === 'string' ? entry.payload.title : `Entry #${entry.id}`;
}

export function TotalsModuleView({ moduleName }: TotalsModuleViewProps) {
  const { findByName, loading: modulesLoading, error: modulesError } = useModulesContext();
  const module = findByName(moduleName);
  const accentKey = getModuleAccentKey(moduleName);
  const accentClasses = moduleClassNames[accentKey];

  const { entries, loading, error, create, update, remove } = useEntries({ moduleId: module?.id });

  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);

  if (modulesLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  if (modulesError || !module) {
    return (
      <View className="flex-1 gap-4 bg-background p-4">
        <ErrorBanner message={modulesError ?? `"${moduleName}" module isn't set up yet.`} />
      </View>
    );
  }

  const overallProgress =
    entries.length === 0
      ? 0
      : entries.reduce((sum, entry) => sum + metricProgress(entry), 0) / entries.length;

  function openCreate() {
    setEditingEntry(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(entry: Entry) {
    setEditingEntry(entry);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit(values: TotalsEntryValues) {
    const payload: Record<string, unknown> = { ...values };
    try {
      if (editingEntry) {
        await update(editingEntry.id, { payload });
      } else {
        await create({ payload });
      }
      setFormOpen(false);
    } catch (err) {
      setFormError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function adjust(entry: Entry, delta: number) {
    setPageError(null);
    const current = typeof entry.payload.current === 'number' ? entry.payload.current : 0;
    const target = typeof entry.payload.target === 'number' ? entry.payload.target : 0;
    const next = Math.max(0, Math.min(target, current + delta));
    try {
      await update(entry.id, { payload: { ...entry.payload, current: next } });
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  return (
    <View className="flex-1 bg-background p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className={`text-xl font-semibold ${accentClasses.text}`}>{moduleName}</Text>
        <Button accent={accentKey} onPress={openCreate}>
          Add metric
        </Button>
      </View>
      <View className="mb-4 items-center">
        <ProgressRing progress={overallProgress} label="today" accent={accentKey} />
      </View>
      <ErrorBanner message={error} />
      <ErrorBanner message={pageError} />
      {loading ? (
        <Spinner />
      ) : entries.length === 0 ? (
        <Text className="text-sm text-ink-muted">No metrics yet — add one above.</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(entry) => String(entry.id)}
          contentContainerClassName="gap-2"
          renderItem={({ item }) => {
            const target = typeof item.payload.target === 'number' ? item.payload.target : 0;
            const current = typeof item.payload.current === 'number' ? item.payload.current : 0;
            const unit = typeof item.payload.unit === 'string' ? item.payload.unit : '';
            return (
              <View className="rounded-md border border-border bg-surface p-3">
                <Pressable
                  onPress={() => openEdit(item)}
                  className="mb-2 flex-row items-center justify-between">
                  <Text className="font-medium text-ink">{entryTitle(item)}</Text>
                  <Text className="text-xs text-ink-muted">
                    {current}/{target} {unit}
                  </Text>
                </Pressable>
                <View className="h-2 overflow-hidden rounded-full bg-surface-raised">
                  <View
                    className={`h-2 rounded-full ${accentClasses.bg}`}
                    style={{ width: `${Math.round(metricProgress(item) * 100)}%` }}
                  />
                </View>
                <View className="mt-2 flex-row items-center justify-between">
                  <View className="flex-row gap-2">
                    <Button variant="secondary" onPress={() => adjust(item, -1)}>
                      −
                    </Button>
                    <Button variant="secondary" onPress={() => adjust(item, 1)}>
                      +
                    </Button>
                  </View>
                  <Pressable onPress={() => setDeleteTarget(item)} hitSlop={8}>
                    <Text className="text-xs text-danger">Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
      {formOpen && (
        <Modal title={editingEntry ? 'Edit metric' : 'Add metric'} onClose={() => setFormOpen(false)}>
          <TotalsEntryForm
            entry={editingEntry ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setFormOpen(false)}
            submitError={formError}
            accent={accentKey}
          />
        </Modal>
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete metric"
          message={`Delete "${entryTitle(deleteTarget)}"?`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </View>
  );
}
