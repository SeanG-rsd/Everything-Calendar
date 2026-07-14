import { TotalsModuleView } from '@/components/modules/TotalsModuleView';
import { TabHeader } from '@/components/layout/TabHeader';
import { View } from 'react-native';

export default function DailyGoalsScreen() {
  return (
    <View className="flex-1">
      <TabHeader />
      <TotalsModuleView moduleName="Daily Goals" />
    </View>
  );
}
