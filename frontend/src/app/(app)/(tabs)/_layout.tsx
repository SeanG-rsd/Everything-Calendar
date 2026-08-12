import { useModulesContext } from '@/modules/ModulesContext';
import { resolveTabs } from '@/tabs/computeTabLayout';
import { useTabPreferencesContext } from '@/tabs/TabPreferencesContext';
import { colors, moduleAccents } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  const { findByName } = useModulesContext();
  const { preferences } = useTabPreferencesContext();
  const resolved = resolveTabs(preferences, findByName);

  // Remount the native tab bar whenever the visible bottom-nav membership or
  // order actually changes, so the native UITabBarController rebuilds its
  // item list from scratch rather than relying on live reordering of
  // NativeTabs.Trigger children, which this codebase has never exercised.
  const navKey = resolved
    .filter((tab) => tab.inBottomNav && !tab.hidden)
    .map((tab) => tab.def.key)
    .join('|');

  return (
    <NativeTabs
      key={navKey}
      backgroundColor={colors.surfaceRaised}
      iconColor={{ default: colors.inkFaint, selected: colors.inkFaint }}
      labelStyle={{ default: { color: colors.inkFaint }, selected: { color: colors.inkFaint } }}>
      {resolved.map((tab) => (
        <NativeTabs.Trigger key={tab.def.key} name={tab.def.key} hidden={tab.hidden || !tab.inBottomNav}>
          <Label selectedStyle={{ color: moduleAccents[tab.def.accent].default }}>{tab.def.label}</Label>
          <Icon
            selectedColor={moduleAccents[tab.def.accent].default}
            src={<VectorIcon family={Ionicons} name={tab.def.icon as ComponentProps<typeof Ionicons>['name']} />}
          />
        </NativeTabs.Trigger>
      ))}
      <NativeTabs.Trigger name="other">
        <Label selectedStyle={{ color: moduleAccents.other.default }}>Other</Label>
        <Icon
          selectedColor={moduleAccents.other.default}
          src={<VectorIcon family={Ionicons} name="ellipsis-horizontal-outline" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
