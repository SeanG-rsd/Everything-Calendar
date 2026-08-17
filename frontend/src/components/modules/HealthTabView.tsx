import { useEntries } from '@/hooks/useEntries';
import { isToday, localDateKey } from '@/lib/dates';
import { isHistoryEntry } from '@/lib/goalHistory';
import { goalAmount, isGoalEntry } from '@/lib/goals';
import { lastSevenDaysHealth } from '@/lib/healthHistory';
import { sumField } from '@/lib/logTotals';
import { useModulesContext } from '@/modules/ModulesContext';
import { View } from 'react-native';
import { WeeklyHealthBar } from '../ui/WeeklyHealthBar';
import { DietModuleView } from './DietModuleView';
import { SegmentedModulesView } from './SegmentedModulesView';
import { WaterModuleView } from './WaterModuleView';
import { WorkoutModuleView } from './WorkoutModuleView';

// Diet/Water gain one "history" entry per day forever (see db/dailyReset.ts),
// same reason TotalsModuleView bumps its own fetch for Daily Goals.
const ALL_ENTRIES_LIMIT = 10_000;

export function HealthTabView({ action }: { action?: string }) {
  const { findByName, loading: modulesLoading } = useModulesContext();

  const diet = useEntries({ moduleId: findByName('Daily Diet')?.id, limit: ALL_ENTRIES_LIMIT });
  const water = useEntries({ moduleId: findByName('Water')?.id, limit: ALL_ENTRIES_LIMIT });
  const workout = useEntries({ moduleId: findByName('Daily Workout')?.id, limit: ALL_ENTRIES_LIMIT });

  const weekDays = (() => {
    if (modulesLoading || diet.loading || water.loading || workout.loading) return null;

    const dietLogged = diet.entries.filter((e) => !isGoalEntry(e) && !isHistoryEntry(e));
    const dietGoal = goalAmount(diet.entries);
    const dietToday = sumField(dietLogged.filter((e) => isToday(e.created_at)), 'calories');
    const dietMetToday = dietGoal != null && dietToday >= dietGoal;

    const waterLogged = water.entries.filter((e) => !isGoalEntry(e) && !isHistoryEntry(e));
    const waterGoal = goalAmount(water.entries);
    const waterToday = sumField(waterLogged.filter((e) => isToday(e.created_at)), 'amountMl');
    const waterMetToday = waterGoal != null && waterToday >= waterGoal;

    const workoutDoneDates = new Set(
      workout.entries
        .filter((e) => e.payload.kind === 'session' && e.status === 'done')
        .map((e) => localDateKey(new Date(e.updated_at))),
    );
    const workoutMetToday = workoutDoneDates.has(localDateKey(new Date()));

    return lastSevenDaysHealth(
      diet.entries.filter(isHistoryEntry),
      water.entries.filter(isHistoryEntry),
      workoutDoneDates,
      { diet: dietMetToday, water: waterMetToday, workout: workoutMetToday },
    );
  })();

  return (
    <>
      {weekDays && (
        <View className="bg-background px-4 pt-4">
          <WeeklyHealthBar days={weekDays} />
        </View>
      )}
      <SegmentedModulesView
        accent="health"
        sections={[
          {
            name: 'Daily Diet',
            label: 'Diet',
            accent: 'diet',
            render: () => <DietModuleView entries={diet} autoOpenAdd={action === 'addFood'} />,
          },
          { name: 'Water', label: 'Water', accent: 'water', render: () => <WaterModuleView entries={water} /> },
          {
            name: 'Daily Workout',
            label: 'Workout',
            accent: 'workout',
            render: () => <WorkoutModuleView entries={workout} />,
          },
        ]}
      />
    </>
  );
}
