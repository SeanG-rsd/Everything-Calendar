import type { TabKey } from '@/api/types';
import { ChecklistModuleView } from '@/components/modules/ChecklistModuleView';
import { HealthTabView } from '@/components/modules/HealthTabView';
import { ProjectsTabView } from '@/components/modules/ProjectsTabView';
import { SavingsModuleView } from '@/components/modules/SavingsModuleView';
import { TasksTabView } from '@/components/modules/TasksTabView';
import { TotalsModuleView } from '@/components/modules/TotalsModuleView';
import { WeightTabView } from '@/components/modules/WeightTabView';

/**
 * Single place that maps a tab key to the view it renders — shared by each
 * tab's own screen file and the tab-modal route (used when a tab that isn't
 * in the bottom nav is opened from Other), so the two never drift apart.
 */
export function TabContent({ tabKey, action }: { tabKey: TabKey; action?: string }) {
  switch (tabKey) {
    case 'tasks':
      return <TasksTabView />;
    case 'goals':
      return <ChecklistModuleView moduleName="Long-Term Goals" />;
    case 'health':
      return <HealthTabView action={action} />;
    case 'daily-goals':
      return <TotalsModuleView moduleName="Daily Goals" />;
    case 'financial':
      return <SavingsModuleView />;
    case 'projects':
      return <ProjectsTabView />;
    case 'weight':
      return <WeightTabView />;
  }
}
