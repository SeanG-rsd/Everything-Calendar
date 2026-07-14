import { HealthTabView } from '@/components/modules/HealthTabView';
import { TabHeader } from '@/components/layout/TabHeader';
import { View } from 'react-native';

export default function HealthScreen() {
  return (
    <View className="flex-1">
      <TabHeader />
      <HealthTabView />
    </View>
  );
}
