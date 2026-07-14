import { DietModuleView } from './DietModuleView';
import { SegmentedModulesView } from './SegmentedModulesView';
import { TotalsModuleView } from './TotalsModuleView';

export function HealthTabView() {
  return (
    <SegmentedModulesView
      sections={[
        { name: 'Daily Diet', label: 'Diet', render: () => <DietModuleView /> },
        {
          name: 'Daily Workout',
          label: 'Workout',
          render: () => <TotalsModuleView moduleName="Daily Workout" />,
        },
      ]}
    />
  );
}
