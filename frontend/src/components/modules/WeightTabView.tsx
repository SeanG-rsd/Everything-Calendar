import { useEntries } from '@/hooks/useEntries';
import {
  entryWeightLbs,
  findWeightEntryForDate,
  poundsToGoal,
  roundWeightLbs,
  weightGoal,
  weightGoalEntry,
  weightLogsSorted,
} from '@/lib/weight';
import { todayIso } from '@/lib/date';
import { useModulesContext } from '@/modules/ModulesContext';
import { getModuleAccentKey } from '@/theme/moduleAccent';
import { moduleClassNames } from '@/theme/moduleClassNames';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { WeightChart } from '../ui/WeightChart';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { WeightGoalForm, type WeightGoalValues } from './WeightGoalForm';
import { WeightLogForm, type WeightLogValues } from './WeightLogForm';

const MODULE_NAME = 'Weight';
const accentKey = getModuleAccentKey(MODULE_NAME);
const accentClasses = moduleClassNames[accentKey];
const ALL_ENTRIES_LIMIT = 1000;

export function WeightTabView() {
  const { findByName, loading: modulesLoading, error: modulesError } = useModulesContext();
  const module = findByName(MODULE_NAME);

  const { entries, loading, error, create, update } = useEntries({
    moduleId: module?.id,
    limit: ALL_ENTRIES_LIMIT,
  });

  const [logFormOpen, setLogFormOpen] = useState(false);
  const [logFormError, setLogFormError] = useState<string | null>(null);
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [goalFormError, setGoalFormError] = useState<string | null>(null);

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
        <ErrorBanner message={modulesError ?? `"${MODULE_NAME}" module isn't set up yet.`} />
      </View>
    );
  }

  const logs = weightLogsSorted(entries);
  const latest = logs[logs.length - 1];
  const currentWeightLbs = latest ? entryWeightLbs(latest) : null;
  const goal = weightGoal(entries);
  const toGo = currentWeightLbs != null && goal ? poundsToGoal(currentWeightLbs, goal) : null;
  const todaysEntry = findWeightEntryForDate(entries, todayIso());

  async function handleLogSubmit(values: WeightLogValues) {
    setLogFormError(null);
    try {
      const existing = findWeightEntryForDate(entries, values.date);
      if (existing) {
        await update(existing.id, { payload: { date: values.date, weightLbs: values.weightLbs } });
      } else {
        await create({ payload: { date: values.date, weightLbs: values.weightLbs } });
      }
      setLogFormOpen(false);
    } catch (err) {
      setLogFormError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleGoalSubmit(values: WeightGoalValues) {
    setGoalFormError(null);
    try {
      const goalEntry = weightGoalEntry(entries);
      const payload = { kind: 'goal', targetWeightLbs: values.targetWeightLbs, direction: values.direction };
      if (goalEntry) {
        await update(goalEntry.id, { payload });
      } else {
        await create({ payload });
      }
      setGoalFormOpen(false);
    } catch (err) {
      setGoalFormError((err as Error).message ?? 'Something went wrong.');
    }
  }

  return (
    <View className="flex-1 bg-background p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className={`text-xl font-semibold ${accentClasses.text}`}>Weight</Text>
        <View className="flex-row gap-2">
          <Button variant="secondary" onPress={() => setGoalFormOpen(true)}>
            Edit Goal
          </Button>
          <Button accent={accentKey} onPress={() => setLogFormOpen(true)}>
            Log weight
          </Button>
        </View>
      </View>

      <View className="mb-4 items-center rounded-md border border-border bg-surface py-4">
        <Text className={`text-3xl font-semibold ${accentClasses.text}`}>
          {currentWeightLbs != null ? `${roundWeightLbs(currentWeightLbs)} lbs` : '—'}
        </Text>
        <Text className="text-xs text-ink-muted">
          {goal
            ? `Goal: ${roundWeightLbs(goal.targetWeightLbs)} lbs (${goal.direction === 'lose' ? 'lose weight' : 'gain weight'})`
            : 'No goal set'}
        </Text>
        {goal && toGo != null && (
          <Text className="mt-1 text-sm text-ink">{toGo === 0 ? 'Goal reached' : `${toGo} lbs to go`}</Text>
        )}
      </View>

      <ErrorBanner message={error} />

      {loading ? <Spinner /> : <WeightChart logs={logs} goal={goal} />}

      {logFormOpen && (
        <Modal title="Log weight" onClose={() => setLogFormOpen(false)}>
          <WeightLogForm
            initialDate={todayIso()}
            initialWeightLbs={todaysEntry ? (entryWeightLbs(todaysEntry) ?? undefined) : undefined}
            onSubmit={handleLogSubmit}
            onCancel={() => setLogFormOpen(false)}
            submitError={logFormError}
            accent={accentKey}
          />
        </Modal>
      )}

      {goalFormOpen && (
        <Modal title="Set weight goal" onClose={() => setGoalFormOpen(false)}>
          <WeightGoalForm
            initialGoal={goal}
            onSubmit={handleGoalSubmit}
            onCancel={() => setGoalFormOpen(false)}
            submitError={goalFormError}
            accent={accentKey}
          />
        </Modal>
      )}
    </View>
  );
}
