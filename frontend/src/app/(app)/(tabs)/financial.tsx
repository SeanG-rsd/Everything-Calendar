import { SafeAreaScreen } from '@/components/layout/SafeAreaScreen';
import { TabContent } from '@/tabs/TabContent';

export default function FinancialScreen() {
  return (
    <SafeAreaScreen>
      <TabContent tabKey="financial" />
    </SafeAreaScreen>
  );
}
