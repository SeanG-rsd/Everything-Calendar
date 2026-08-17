import type { TabKey, TabPreferenceUpsert } from '@/api/types';
import { MAX_BOTTOM_NAV_TABS, TAB_DEFINITIONS } from '@/lib/tabs';
import { resolveTabs } from '@/tabs/computeTabLayout';
import { ROW_HEIGHT, TabPlacementRow } from '@/tabs/TabPlacementRow';
import { useTabPreferencesContext } from '@/tabs/TabPreferencesContext';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
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
  const [header1Height, setHeader1Height] = useState(0);
  const [header2Height, setHeader2Height] = useState(0);
  const [emptyStateHeight, setEmptyStateHeight] = useState(0);
  const isDraggingRef = useRef(false);
  const translateY = useSharedValue(0);
  const activeIndex = useSharedValue(-1);
  const activeKey = useSharedValue<string | null>(null);
  const hoverIndex = useSharedValue(-1);

  useEffect(() => {
    if (isDraggingRef.current) return;
    // Ignore module-active hidden state entirely here — the Other screen
    // manages the user's raw placement preference, not the runtime nav bar.
    const resolved = resolveTabs(preferences, () => undefined);
    setInNav(resolved.filter((tab) => tab.inBottomNav).map((tab) => tab.def.key));
    setNotInNav(resolved.filter((tab) => !tab.inBottomNav).map((tab) => tab.def.key));
  }, [preferences]);

  // Deferred until after inNav/notInNav — and therefore every row's `index`
  // prop, and navRowsTop/notNavRowsTop below — reflect the drop's final
  // order. Rows compute their position from activeKey/activeIndex/hoverIndex
  // as an absolute target, which stays correct across the commit regardless
  // of exact timing (see TabPlacementRow) — but the *dragged* row specifically
  // depends on activeKey staying set until this fires, so it keeps tracking
  // via shared values instead of falling back to its own (momentarily stale)
  // `index` prop mid-settle.
  useEffect(() => {
    activeIndex.value = -1;
    activeKey.value = null;
    hoverIndex.value = -1;
  }, [inNav, notInNav, activeIndex, activeKey, hoverIndex]);

  const handleDragStart = useCallback((key: TabKey) => {
    isDraggingRef.current = true;
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
      const rawInNavLength = insertionIndex <= remainingInNavCount ? remainingInNavCount + 1 : remainingInNavCount;

      isDraggingRef.current = false;

      // Dropping a tab into an already-full bottom nav bumps whichever tab
      // ends up last in nav order out to "Not in Bottom Nav" instead of
      // rejecting the move — a single drag can only ever push the count one
      // over the cap, so this always displaces at most one tab.
      const newInNavLength = Math.min(rawInNavLength, MAX_BOTTOM_NAV_TABS);
      const newInNav = newFlat.slice(0, newInNavLength);
      const newNotInNav = [...newFlat.slice(newInNavLength, rawInNavLength), ...newFlat.slice(rawInNavLength)];
      setInNav(newInNav);
      setNotInNav(newNotInNav);

      const updates: TabPreferenceUpsert[] = [...newInNav, ...newNotInNav].map((tabKey, index) => ({
        tab_key: tabKey,
        in_bottom_nav: index < newInNavLength,
        sort_order: index,
      }));
      savePreferences(updates);
    },
    [inNav, notInNav, savePreferences],
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

  const totalCount = inNav.length + notInNav.length;

  // Computed, not measured-and-stored-per-render — these need to update in
  // the exact same render as `index` does (see the effect above and
  // TabPlacementRow's comments), which a second onLayout-driven state value
  // couldn't guarantee since onLayout fires asynchronously, a render or more
  // after the count that drives it changes. Only the header heights
  // themselves (stable regardless of drag state) come from onLayout.
  const navRowsTop = header1Height;
  const header2Top = header1Height + inNav.length * ROW_HEIGHT;
  const notNavRowsTop = header2Top + header2Height;
  const containerHeight =
    notNavRowsTop + (notInNav.length > 0 ? notInNav.length * ROW_HEIGHT : emptyStateHeight);

  return (
    <View className="flex-1 px-4 pt-4">
      <Text className="mb-4 text-2xl font-semibold text-ink">Other</Text>
      <View style={{ height: containerHeight }} className="overflow-hidden rounded-md border border-border">
        <View
          onLayout={(e: LayoutChangeEvent) => setHeader1Height(e.nativeEvent.layout.height)}
          className="bg-surface-raised px-3 py-2">
          <Text className="text-sm font-medium text-ink-muted">
            In Bottom Nav ({inNav.length}/{MAX_BOTTOM_NAV_TABS})
          </Text>
        </View>
        {inNav.map((key, localIndex) => (
          <TabPlacementRow
            key={key}
            def={defByKey.get(key)!}
            index={localIndex}
            totalCount={totalCount}
            navCount={inNav.length}
            navRowsTop={navRowsTop}
            notNavRowsTop={notNavRowsTop}
            translateY={translateY}
            activeIndex={activeIndex}
            activeKey={activeKey}
            hoverIndex={hoverIndex}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onNavigate={handleNavigate}
          />
        ))}
        <View
          onLayout={(e: LayoutChangeEvent) => setHeader2Height(e.nativeEvent.layout.height)}
          style={{ position: 'absolute', top: header2Top, left: 0, right: 0 }}
          className="border-t border-border bg-surface-raised px-3 py-2">
          <Text className="text-sm font-medium text-ink-muted">Not in Bottom Nav</Text>
        </View>
        {notInNav.map((key, localIndex) => (
          <TabPlacementRow
            key={key}
            def={defByKey.get(key)!}
            index={inNav.length + localIndex}
            totalCount={totalCount}
            navCount={inNav.length}
            navRowsTop={navRowsTop}
            notNavRowsTop={notNavRowsTop}
            translateY={translateY}
            activeIndex={activeIndex}
            activeKey={activeKey}
            hoverIndex={hoverIndex}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onNavigate={handleNavigate}
          />
        ))}
        {notInNav.length === 0 && (
          <View
            onLayout={(e: LayoutChangeEvent) => setEmptyStateHeight(e.nativeEvent.layout.height)}
            style={{ position: 'absolute', top: notNavRowsTop, left: 0, right: 0 }}
            className="px-3 py-3">
            <Text className="text-sm text-ink-faint">Drag a tab here to remove it from the bottom nav.</Text>
          </View>
        )}
      </View>
    </View>
  );
}
