import { SafeAreaScreen } from '@/components/layout/SafeAreaScreen';
import { TotalsModuleView } from '@/components/modules/TotalsModuleView';

export default function DailyGoalsScreen() {
  return (
    <SafeAreaScreen>
      <TotalsModuleView moduleName="Daily Goals" />
    </SafeAreaScreen>
  );
}
