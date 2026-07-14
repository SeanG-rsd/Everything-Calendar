import { ChecklistModuleView } from '@/components/modules/ChecklistModuleView';
import { TabHeader } from '@/components/layout/TabHeader';
import { View } from 'react-native';

export default function LongTermGoalsScreen() {
  return (
    <View className="flex-1">
      <TabHeader />
      <ChecklistModuleView moduleName="Long-Term Goals" />
    </View>
  );
}
