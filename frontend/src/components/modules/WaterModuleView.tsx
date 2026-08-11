import type { Entry } from '@/api/types';
import type { EntriesController } from '@/hooks/useEntries';
import { isHistoryEntry } from '@/lib/goalHistory';
import { findGoalEntry, goalAmount, isGoalEntry } from '@/lib/goals';
import { useModulesContext } from '@/modules/ModulesContext';
import { getModuleAccentKey } from '@/theme/moduleAccent';
import { moduleClassNames } from '@/theme/moduleClassNames';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { WaterBottle } from '../ui/WaterBottle';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { DailyTotalCard } from './DailyTotalCard';
import { GoalEditForm, type GoalEditValues } from './GoalEditForm';
import { WaterLogForm, type WaterLogValues } from './WaterLogForm';

const MODULE_NAME = 'Water';
const accentKey = getModuleAccentKey(MODULE_NAME);
const accentClasses = moduleClassNames[accentKey];

function entryAmountMl(entry: Entry): number {
  return typeof entry.payload.amountMl === 'number' ? entry.payload.amountMl : 0;
}

interface WaterModuleViewProps {
  entries: EntriesController;
}

export function WaterModuleView({ entries: entriesController }: WaterModuleViewProps) {
  const { findByName, loading: modulesLoading, error: modulesError } = useModulesContext();
  const module = findByName(MODULE_NAME);

  const { entries, loading, error, create, update } = entriesController;

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
        <ErrorBanner message={modulesError ?? '"Water" module isn\'t set up yet.'} />
      </View>
    );
  }

  const logEntries = entries.filter((entry) => !isGoalEntry(entry) && !isHistoryEntry(entry));
  const totalMl = logEntries.reduce((sum, entry) => sum + entryAmountMl(entry), 0);
  const goal = goalAmount(entries);
  const progress = goal ? totalMl / goal : 0;

  async function handleSubmit(values: WaterLogValues) {
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

  return (
    <View className="flex-1 bg-background p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className={`text-xl font-semibold ${accentClasses.text}`}>Water</Text>
        <View className="flex-row gap-2">
          <Button variant="secondary" onPress={() => setGoalFormOpen(true)}>
            Edit Goal
          </Button>
          <Button accent={accentKey} onPress={() => setFormOpen(true)}>
            Add
          </Button>
        </View>
      </View>
      <DailyTotalCard total={totalMl} goal={goal} unit="ml" accent={accentKey} />
      <ErrorBanner message={error} />
      {loading ? (
        <Spinner />
      ) : (
        <View className="flex-1 items-center justify-center">
          <WaterBottle progress={progress} />
        </View>
      )}
      {formOpen && (
        <Modal title="Add water" onClose={() => setFormOpen(false)}>
          <WaterLogForm
            onSubmit={handleSubmit}
            onCancel={() => setFormOpen(false)}
            submitError={formError}
            accent={accentKey}
          />
        </Modal>
      )}
      {goalFormOpen && (
        <Modal title="Set daily water goal" onClose={() => setGoalFormOpen(false)}>
          <GoalEditForm
            label="Daily goal"
            unit="ml"
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
