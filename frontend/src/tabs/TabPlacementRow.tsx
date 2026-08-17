import type { TabDefinition } from '@/lib/tabs';
import { colors, moduleAccents } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, withTiming, type SharedValue } from 'react-native-reanimated';
import type { TabKey } from '@/api/types';

export const ROW_HEIGHT = 56;
const SHIFT_DURATION_MS = 150;

interface TabPlacementRowProps {
  def: TabDefinition;
  /** This row's position in the combined [...inNav, ...notInNav] list. */
  index: number;
  totalCount: number;
  /** inNav.length — where "In Bottom Nav" rows end and "Not in Bottom Nav" begins. */
  navCount: number;
  /** Top of each section's first row slot — computed (not measured post-layout) from stable
   * header heights plus the persisted section counts, so it always updates in the same render as
   * `index` does. Every row is absolutely positioned from these, so its on-screen spot is always
   * driven by Reanimated, never by flex reflow — see TabPlacementEditor for why that's what makes
   * a drop's settle-into-place moment seamless instead of a two-step blink. */
  navRowsTop: number;
  notNavRowsTop: number;
  translateY: SharedValue<number>;
  /** Flat index the drag started at, or -1 when nothing is being dragged. */
  activeIndex: SharedValue<number>;
  /** Stable identity of the row currently being dragged. Deliberately key-based, not index-based —
   * an index-based check breaks the instant a reorder commits and this row's own `index` prop
   * changes, right in the middle of settling. */
  activeKey: SharedValue<string | null>;
  /** Live (or, after release, frozen-at-release) target flat index the drag is hovering over. */
  hoverIndex: SharedValue<number>;
  onDragStart: (key: TabKey) => void;
  onDragEnd: (key: TabKey, translationY: number) => void;
  onNavigate: (key: TabKey) => void;
}

export function TabPlacementRow({
  def,
  index,
  totalCount,
  navCount,
  navRowsTop,
  notNavRowsTop,
  translateY,
  activeIndex,
  activeKey,
  hoverIndex,
  onDragStart,
  onDragEnd,
  onNavigate,
}: TabPlacementRowProps) {
  const accent = moduleAccents[def.accent];

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          translateY.value = 0;
          activeIndex.value = index;
          activeKey.value = def.key;
          hoverIndex.value = index;
          runOnJS(onDragStart)(def.key);
        })
        .onUpdate((event) => {
          translateY.value = event.translationY;
          hoverIndex.value = Math.min(
            Math.max(index + Math.round(event.translationY / ROW_HEIGHT), 0),
            totalCount - 1,
          );
        })
        .onEnd((event) => {
          // Ease the remaining distance to the frozen hover target instead of stopping dead where
          // the finger let go — translateY keeps meaning "my offset from my own nominal slot" the
          // whole time, live-tracked during the drag and withTiming-animated after release, so
          // useAnimatedStyle doesn't need to branch on drag phase at all.
          const dragTranslationY = event.translationY;
          const fromTop =
            index < navCount ? navRowsTop + index * ROW_HEIGHT : notNavRowsTop + (index - navCount) * ROW_HEIGHT;
          const hover = hoverIndex.value;
          const toTop =
            hover < navCount ? navRowsTop + hover * ROW_HEIGHT : notNavRowsTop + (hover - navCount) * ROW_HEIGHT;
          // Don't commit (and thus don't let TabPlacementEditor's effect reset activeKey) until
          // this row has actually finished easing to its target — committing mid-animation would
          // switch this row from the "active" branch to the "neighbor" branch, and therefore from
          // a direct value to a withTiming-wrapped one, while still in flight.
          translateY.value = withTiming(toTop - fromTop, { duration: SHIFT_DURATION_MS }, (finished) => {
            if (finished) {
              runOnJS(onDragEnd)(def.key, dragTranslationY);
            }
          });
        }),
    [
      def.key,
      index,
      navCount,
      navRowsTop,
      notNavRowsTop,
      totalCount,
      translateY,
      activeIndex,
      activeKey,
      hoverIndex,
      onDragStart,
      onDragEnd,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const slotTop = (flatIndex: number) =>
      flatIndex < navCount ? navRowsTop + flatIndex * ROW_HEIGHT : notNavRowsTop + (flatIndex - navCount) * ROW_HEIGHT;

    // This row is the one being dragged (live, or settling into place right after release) — its
    // position comes entirely from shared values, never from its own `index` prop, so it stays
    // seamless across the exact moment a reorder commits. TabPlacementEditor only clears
    // activeKey once every row's `index` already matches what this computation already has it at.
    if (activeKey.value === def.key) {
      return {
        top: slotTop(activeIndex.value) + translateY.value,
        zIndex: 10,
        opacity: 0.9,
        shadowOpacity: 0.3,
      };
    }

    // Neighboring rows ease toward whichever slot they'd occupy if the drag dropped right now —
    // computed as an absolute target position (not an offset added on top of this row's own
    // layout position), so it stays correct whether this row's `index` prop is still pre- or
    // already post-commit: slotTop(targetIndex) doesn't care which one produced targetIndex.
    let targetIndex = index;
    if (activeIndex.value !== -1) {
      const hover = hoverIndex.value;
      if (hover > activeIndex.value && index > activeIndex.value && index <= hover) {
        targetIndex = index - 1;
      } else if (hover < activeIndex.value && index >= hover && index < activeIndex.value) {
        targetIndex = index + 1;
      }
    }

    return {
      top: withTiming(slotTop(targetIndex), { duration: SHIFT_DURATION_MS }),
      zIndex: 0,
      opacity: 1,
      shadowOpacity: 0,
    };
  });

  return (
    <Animated.View
      style={[{ position: 'absolute', left: 0, right: 0, height: ROW_HEIGHT }, animatedStyle]}
      className="flex-row items-center bg-surface">
      <Pressable
        onPress={() => onNavigate(def.key)}
        className="h-full flex-1 flex-row items-center gap-3 px-3 active:bg-surface-raised">
        <Ionicons name={def.icon as ComponentProps<typeof Ionicons>['name']} size={20} color={accent.default} />
        <Text className="flex-1 text-base text-ink">{def.label}</Text>
      </Pressable>
      <GestureDetector gesture={panGesture}>
        <View className="h-full items-center justify-center px-3">
          <Ionicons name="reorder-three-outline" size={20} color={colors.inkFaint} />
        </View>
      </GestureDetector>
    </Animated.View>
  );
}
