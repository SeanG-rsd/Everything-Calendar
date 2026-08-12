import { SafeAreaScreen } from '@/components/layout/SafeAreaScreen';
import { TabContent } from '@/tabs/TabContent';

export default function TasksScreen() {
  return (
    <SafeAreaScreen>
      <TabContent tabKey="tasks" />
    </SafeAreaScreen>
  );
}
