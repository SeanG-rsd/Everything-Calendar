import { SectionedChecklistView } from './SectionedChecklistView';
import { SegmentedModulesView } from './SegmentedModulesView';

export function TasksTabView() {
  return (
    <SegmentedModulesView
      sections={[
        {
          name: 'To-Dos',
          label: 'To-Dos',
          render: () => <SectionedChecklistView moduleName="To-Dos" />,
        },
        {
          name: 'Homework',
          label: 'Homework',
          render: () => <SectionedChecklistView moduleName="Homework" />,
        },
      ]}
    />
  );
}
