import { ChecklistModuleView } from './ChecklistModuleView';
import { SegmentedModulesView } from './SegmentedModulesView';

export function TasksTabView() {
  return (
    <SegmentedModulesView
      sections={[
        { name: 'To-Dos', label: 'To-Dos', render: () => <ChecklistModuleView moduleName="To-Dos" /> },
        {
          name: 'Homework',
          label: 'Homework',
          render: () => <ChecklistModuleView moduleName="Homework" />,
        },
      ]}
    />
  );
}
