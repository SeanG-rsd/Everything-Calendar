import { SafeAreaScreen } from '@/components/layout/SafeAreaScreen';
import { ChecklistModuleView } from '@/components/modules/ChecklistModuleView';

export default function LongTermGoalsScreen() {
  return (
    <SafeAreaScreen>
      <ChecklistModuleView moduleName="Long-Term Goals" />
    </SafeAreaScreen>
  );
}
