import { TabHeader } from '@/components/layout/TabHeader';
import { TasksTabView } from '@/components/modules/TasksTabView';
import { View } from 'react-native';

export default function TasksScreen() {
  return (
    <View className="flex-1">
      <TabHeader />
      <TasksTabView />
    </View>
  );
}
