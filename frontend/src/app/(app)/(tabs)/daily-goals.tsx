import { SafeAreaScreen } from '@/components/layout/SafeAreaScreen';
import { TabContent } from '@/tabs/TabContent';

export default function DailyGoalsScreen() {
  return (
    <SafeAreaScreen>
      <TabContent tabKey="daily-goals" />
    </SafeAreaScreen>
  );
}
