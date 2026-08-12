import { SafeAreaScreen } from '@/components/layout/SafeAreaScreen';
import { TabContent } from '@/tabs/TabContent';

export default function LongTermGoalsScreen() {
  return (
    <SafeAreaScreen>
      <TabContent tabKey="goals" />
    </SafeAreaScreen>
  );
}
