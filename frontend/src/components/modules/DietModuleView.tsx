import type { Entry } from '@/api/types';
import type { EntriesController } from '@/hooks/useEntries';
import { isHistoryEntry } from '@/lib/goalHistory';
import { findGoalEntry, goalAmount, isGoalEntry } from '@/lib/goals';
import { useModulesContext } from '@/modules/ModulesContext';
import { getModuleAccentKey } from '@/theme/moduleAccent';
import { moduleClassNames } from '@/theme/moduleClassNames';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { DailyTotalCard } from './DailyTotalCard';
import { DietLogForm, type DietLogValues } from './DietLogForm';
import { GoalEditForm, type GoalEditValues } from './GoalEditForm';

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

interface DietModuleViewProps {
  entries: EntriesController;
  /** Auto-opens the Add-food modal on mount, e.g. from the "Log Food" Shortcut deep link. */
  autoOpenAdd?: boolean;
}

export function DietModuleView({ entries: entriesController, autoOpenAdd }: DietModuleViewProps) {
  const { findByName, loading: modulesLoading, error: modulesError } = useModulesContext();
  const module = findByName(MODULE_NAME);

  const { entries, loading, error, create, update, remove } = entriesController;

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [goalFormError, setGoalFormError] = useState<string | null>(null);

  useEffect(() => {
    if (autoOpenAdd) setFormOpen(true);
  }, [autoOpenAdd]);

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

  const logEntries = entries.filter((entry) => !isGoalEntry(entry) && !isHistoryEntry(entry));
  const totalCalories = logEntries.reduce((sum, entry) => sum + entryCalories(entry), 0);
  const goal = goalAmount(entries);

  async function handleSubmit(values: DietLogValues) {
    setFormError(null);
    try {
      await create({ payload: { ...values } });
      setFormOpen(false);
    } catch (err) {
      setFormError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleSaveGoal(values: GoalEditValues) {
    setGoalFormError(null);
    try {
      const goalEntry = findGoalEntry(entries);
      if (goalEntry) {
        await update(goalEntry.id, { payload: { kind: 'goal', amount: values.amount } });
      } else {
        await create({ payload: { kind: 'goal', amount: values.amount } });
      }
      setGoalFormOpen(false);
    } catch (err) {
      setGoalFormError((err as Error).message ?? 'Something went wrong.');
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
        <View className="flex-row gap-2">
          <Button variant="secondary" onPress={() => setGoalFormOpen(true)}>
            Edit Goal
          </Button>
          <Button accent={accentKey} onPress={() => setFormOpen(true)}>
            Add
          </Button>
        </View>
      </View>
      <DailyTotalCard total={totalCalories} goal={goal} unit="kcal" accent={accentKey} />
      <ErrorBanner message={error} />
      <ErrorBanner message={pageError} />
      {loading ? (
        <Spinner />
      ) : logEntries.length === 0 ? (
        <Text className="text-sm text-ink-muted">Nothing logged yet — tap Add.</Text>
      ) : (
        <FlatList
          data={logEntries}
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
      {goalFormOpen && (
        <Modal title="Set daily calorie goal" onClose={() => setGoalFormOpen(false)}>
          <GoalEditForm
            label="Daily goal"
            unit="kcal"
            initialAmount={goal}
            onSubmit={handleSaveGoal}
            onCancel={() => setGoalFormOpen(false)}
            submitError={goalFormError}
            accent={accentKey}
          />
        </Modal>
      )}
    </View>
  );
}
