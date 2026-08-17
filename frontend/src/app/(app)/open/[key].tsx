import { Spinner } from '@/components/ui/Spinner';
import { useModulesContext } from '@/modules/ModulesContext';
import { resolveTabs } from '@/tabs/computeTabLayout';
import { useTabPreferencesContext } from '@/tabs/TabPreferencesContext';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

/**
 * Deep-link entry point (e.g. iOS Shortcuts: everythingcalendar://open/<key>).
 * Mirrors TabPlacementEditor's handleNavigate: tabs currently in the bottom
 * nav get a direct native-tab switch, tabs that aren't get pushed as the
 * tab-modal instead — since that membership is a live user preference, not
 * something a static Shortcut URL can know ahead of time.
 */
export default function OpenTabRedirect() {
  const router = useRouter();
  const { key, action } = useLocalSearchParams<{ key: string; action?: string }>();
  const { findByName, loading: modulesLoading } = useModulesContext();
  const { preferences, loading: preferencesLoading } = useTabPreferencesContext();

  useEffect(() => {
    if (modulesLoading || preferencesLoading) return;

    const suffix = action ? `?action=${action}` : '';

    if (key === 'other') {
      router.replace(`/other${suffix}` as Href);
      return;
    }

    const tab = resolveTabs(preferences, findByName).find((t) => t.def.key === key);
    const isLiveTabScreen = tab != null && !tab.hidden && tab.inBottomNav;

    router.replace((isLiveTabScreen ? `/${key}${suffix}` : `/tab-modal/${key}${suffix}`) as Href);
  }, [key, action, modulesLoading, preferencesLoading, preferences, findByName, router]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Spinner />
    </View>
  );
}
