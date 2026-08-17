import { SafeAreaScreen } from '@/components/layout/SafeAreaScreen';
import { TabContent } from '@/tabs/TabContent';

export default function ProjectsScreen() {
  return (
    <SafeAreaScreen>
      <TabContent tabKey="projects" />
    </SafeAreaScreen>
  );
}
