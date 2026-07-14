import { useModulesContext } from '@/modules/ModulesContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  const { findByName } = useModulesContext();

  function isInactive(name: string): boolean {
    const module = findByName(name);
    return module ? !module.is_active : false;
  }

  const tasksHidden = isInactive('To-Dos') && isInactive('Homework');
  const healthHidden = isInactive('Daily Diet') && isInactive('Daily Workout');

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="tasks" hidden={tasksHidden}>
        <Label>Tasks</Label>
        <Icon src={<VectorIcon family={Ionicons} name="checkbox-outline" />} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="goals" hidden={isInactive('Long-Term Goals')}>
        <Label>Goals</Label>
        <Icon src={<VectorIcon family={Ionicons} name="flag-outline" />} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="health" hidden={healthHidden}>
        <Label>Health</Label>
        <Icon src={<VectorIcon family={Ionicons} name="heart-outline" />} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="daily-goals" hidden={isInactive('Daily Goals')}>
        <Label>Daily Goals</Label>
        <Icon src={<VectorIcon family={Ionicons} name="checkmark-done-outline" />} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="financial" hidden={isInactive('Savings Goals')}>
        <Label>Financial</Label>
        <Icon src={<VectorIcon family={Ionicons} name="wallet-outline" />} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
