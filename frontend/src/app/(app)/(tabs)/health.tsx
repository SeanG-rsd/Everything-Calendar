import { SafeAreaScreen } from '@/components/layout/SafeAreaScreen';
import { TabContent } from '@/tabs/TabContent';

export default function HealthScreen() {
  return (
    <SafeAreaScreen>
      <TabContent tabKey="health" />
    </SafeAreaScreen>
  );
}
