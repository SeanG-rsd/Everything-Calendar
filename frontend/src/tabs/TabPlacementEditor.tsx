import type { TabKey, TabPreferenceUpsert } from '@/api/types';
import { MAX_BOTTOM_NAV_TABS, TAB_DEFINITIONS } from '@/lib/tabs';
import { resolveTabs } from '@/tabs/computeTabLayout';
import { ROW_HEIGHT, TabPlacementRow } from '@/tabs/TabPlacementRow';
import { useTabPreferencesContext } from '@/tabs/TabPreferencesContext';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

const defByKey = new Map(TAB_DEFINITIONS.map((def) => [def.key, def]));

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function TabPlacementEditor() {
  const router = useRouter();
  const { preferences, savePreferences } = useTabPreferencesContext();

  const [inNav, setInNav] = useState<TabKey[]>([]);
  const [notInNav, setNotInNav] = useState<TabKey[]>([]);
  const [draggingKey, setDraggingKey] = useState<TabKey | null>(null);
  const isDraggingRef = useRef(false);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (isDraggingRef.current) return;
    // Ignore module-active hidden state entirely here — the Other screen
    // manages the user's raw placement preference, not the runtime nav bar.
    const resolved = resolveTabs(preferences, () => undefined);
    setInNav(resolved.filter((tab) => tab.inBottomNav).map((tab) => tab.def.key));
    setNotInNav(resolved.filter((tab) => !tab.inBottomNav).map((tab) => tab.def.key));
  }, [preferences]);

  const handleDragStart = useCallback((key: TabKey) => {
    isDraggingRef.current = true;
    setDraggingKey(key);
  }, []);

  const handleDragEnd = useCallback(
    (key: TabKey, translationYValue: number) => {
      const flatBefore = [...inNav, ...notInNav];
      const startFlatIndex = flatBefore.indexOf(key);
      const deltaSlots = Math.round(translationYValue / ROW_HEIGHT);
      const targetFlatIndex = clamp(startFlatIndex + deltaSlots, 0, flatBefore.length - 1);

      const wasInNav = inNav.includes(key);
      const remaining = wasInNav
        ? [...inNav.filter((k) => k !== key), ...notInNav]
        : [...inNav, ...notInNav.filter((k) => k !== key)];
      const remainingInNavCount = wasInNav ? inNav.length - 1 : inNav.length;
      const insertionIndex = clamp(targetFlatIndex, 0, remaining.length);

      const newFlat = [...remaining.slice(0, insertionIndex), key, ...remaining.slice(insertionIndex)];
      const newInNavLength = insertionIndex <= remainingInNavCount ? remainingInNavCount + 1 : remainingInNavCount;

      isDraggingRef.current = false;
      setDraggingKey(null);
      translateY.value = 0;

      if (newInNavLength > MAX_BOTTOM_NAV_TABS) {
        Alert.alert('Bottom nav is full', 'Remove a tab from the bottom nav before adding another.');
        return;
      }

      const newInNav = newFlat.slice(0, newInNavLength);
      const newNotInNav = newFlat.slice(newInNavLength);
      setInNav(newInNav);
      setNotInNav(newNotInNav);

      const updates: TabPreferenceUpsert[] = newFlat.map((tabKey, index) => ({
        tab_key: tabKey,
        in_bottom_nav: index < newInNavLength,
        sort_order: index,
      }));
      savePreferences(updates);
    },
    [inNav, notInNav, savePreferences, translateY],
  );

  const handleNavigate = useCallback(
    (key: TabKey) => {
      // In-nav tabs already have a bottom-bar icon — just switch to them.
      // Not-in-nav tabs have no icon to return to, so open them as a modal
      // that layers over everything (including the bottom nav) instead.
      if (inNav.includes(key)) {
        router.navigate(`/${key}` as Href);
      } else {
        router.push(`/tab-modal/${key}` as Href);
      }
    },
    [router, inNav],
  );

  return (
    <View className="flex-1 px-4 pt-4">
      <Text className="mb-4 text-2xl font-semibold text-ink">Other</Text>
      <Text className="mb-2 text-sm font-medium text-ink-muted">
        In Bottom Nav ({inNav.length}/{MAX_BOTTOM_NAV_TABS})
      </Text>
      <View className="mb-6 overflow-hidden rounded-md border border-border">
        {inNav.map((key) => (
          <TabPlacementRow
            key={key}
            def={defByKey.get(key)!}
            isDragging={draggingKey === key}
            translateY={translateY}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onNavigate={handleNavigate}
          />
        ))}
      </View>
      <Text className="mb-2 text-sm font-medium text-ink-muted">Not in Bottom Nav</Text>
      <View className="overflow-hidden rounded-md border border-border">
        {notInNav.map((key) => (
          <TabPlacementRow
            key={key}
            def={defByKey.get(key)!}
            isDragging={draggingKey === key}
            translateY={translateY}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onNavigate={handleNavigate}
          />
        ))}
        {notInNav.length === 0 && (
          <Text className="px-3 py-3 text-sm text-ink-faint">Drag a tab here to remove it from the bottom nav.</Text>
        )}
      </View>
    </View>
  );
}
