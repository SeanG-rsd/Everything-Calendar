import { useModulesContext } from '@/modules/ModulesContext';
import { colors, moduleAccents } from '@/theme/colors';
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
    <NativeTabs
      backgroundColor={colors.surfaceRaised}
      iconColor={{ default: colors.inkFaint, selected: colors.inkFaint }}
      labelStyle={{ default: { color: colors.inkFaint }, selected: { color: colors.inkFaint } }}>
      <NativeTabs.Trigger name="tasks" hidden={tasksHidden}>
        <Label selectedStyle={{ color: moduleAccents.tasks.default }}>Tasks</Label>
        <Icon
          selectedColor={moduleAccents.tasks.default}
          src={<VectorIcon family={Ionicons} name="checkbox-outline" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="goals" hidden={isInactive('Long-Term Goals')}>
        <Label selectedStyle={{ color: moduleAccents.goals.default }}>Goals</Label>
        <Icon
          selectedColor={moduleAccents.goals.default}
          src={<VectorIcon family={Ionicons} name="flag-outline" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="health" hidden={healthHidden}>
        <Label selectedStyle={{ color: moduleAccents.health.default }}>Health</Label>
        <Icon
          selectedColor={moduleAccents.health.default}
          src={<VectorIcon family={Ionicons} name="heart-outline" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="daily-goals" hidden={isInactive('Daily Goals')}>
        <Label selectedStyle={{ color: moduleAccents['daily-goals'].default }}>Daily Goals</Label>
        <Icon
          selectedColor={moduleAccents['daily-goals'].default}
          src={<VectorIcon family={Ionicons} name="checkmark-done-outline" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="financial" hidden={isInactive('Savings Goals')}>
        <Label selectedStyle={{ color: moduleAccents.financial.default }}>Financial</Label>
        <Icon
          selectedColor={moduleAccents.financial.default}
          src={<VectorIcon family={Ionicons} name="wallet-outline" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
