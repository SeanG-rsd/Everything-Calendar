import { TabHeader } from '@/components/layout/TabHeader';
import { SavingsModuleView } from '@/components/modules/SavingsModuleView';
import { View } from 'react-native';

export default function FinancialScreen() {
  return (
    <View className="flex-1">
      <TabHeader />
      <SavingsModuleView />
    </View>
  );
}
