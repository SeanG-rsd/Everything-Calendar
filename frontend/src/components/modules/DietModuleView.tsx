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
import { Spinner } from '../ui/Spinner';
import { DietLogForm, type DietLogValues } from './DietLogForm';

const MODULE_NAME = 'Daily Diet';
const accentKey = getModuleAccentKey(MODULE_NAME);
const accentClasses = moduleClassNames[accentKey];

function entryCalories(entry: Entry): number {
  return typeof entry.payload.calories === 'number' ? entry.payload.calories : 0;
}

function entryName(entry: Entry): string {
  return typeof entry.payload.name === 'string' && entry.payload.name.length > 0
    ? entry.payload.name
    : 'Food';
}

export function DietModuleView() {
  const { findByName, loading: modulesLoading, error: modulesError } = useModulesContext();
  const module = findByName(MODULE_NAME);

  const { entries, loading, error, create, remove } = useEntries({ moduleId: module?.id });

  const [formOpen, setFormOpen] = useState(false);
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
        <ErrorBanner message={modulesError ?? '"Daily Diet" module isn\'t set up yet.'} />
      </View>
    );
  }

  const totalCalories = entries.reduce((sum, entry) => sum + entryCalories(entry), 0);

  async function handleSubmit(values: DietLogValues) {
    setFormError(null);
    try {
      await create({ payload: { ...values } });
      setFormOpen(false);
    } catch (err) {
      setFormError((err as Error).message ?? 'Something went wrong.');
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
        <Text className={`text-xl font-semibold ${accentClasses.text}`}>Diet</Text>
        <Button accent={accentKey} onPress={() => setFormOpen(true)}>
          Add
        </Button>
      </View>
      <View className="mb-4 items-center rounded-md border border-border bg-surface py-4">
        <Text className={`text-3xl font-semibold ${accentClasses.text}`}>{totalCalories}</Text>
        <Text className="text-xs text-ink-muted">calories today</Text>
      </View>
      <ErrorBanner message={error} />
      <ErrorBanner message={pageError} />
      {loading ? (
        <Spinner />
      ) : entries.length === 0 ? (
        <Text className="text-sm text-ink-muted">Nothing logged yet — tap Add.</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(entry) => String(entry.id)}
          contentContainerClassName="gap-2"
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between rounded-md border border-border bg-surface p-3">
              <Text className="flex-1 text-sm text-ink">{entryName(item)}</Text>
              <Text className="mr-3 text-sm text-ink-muted">{entryCalories(item)} kcal</Text>
              <Pressable onPress={() => setDeleteTarget(item)} hitSlop={8}>
                <Text className="text-xs text-danger">Delete</Text>
              </Pressable>
            </View>
          )}
        />
      )}
      {formOpen && (
        <Modal title="Add food" onClose={() => setFormOpen(false)}>
          <DietLogForm
            onSubmit={handleSubmit}
            onCancel={() => setFormOpen(false)}
            submitError={formError}
            accent={accentKey}
          />
        </Modal>
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete entry"
          message={`Delete "${entryName(deleteTarget)}"?`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </View>
  );
}
