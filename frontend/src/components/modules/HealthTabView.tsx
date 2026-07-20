import { DietModuleView } from './DietModuleView';
import { SegmentedModulesView } from './SegmentedModulesView';
import { WorkoutModuleView } from './WorkoutModuleView';

export function HealthTabView() {
  return (
    <SegmentedModulesView
      accent="health"
      sections={[
        { name: 'Daily Diet', label: 'Diet', render: () => <DietModuleView /> },
        { name: 'Daily Workout', label: 'Workout', render: () => <WorkoutModuleView /> },
      ]}
    />
  );
}
