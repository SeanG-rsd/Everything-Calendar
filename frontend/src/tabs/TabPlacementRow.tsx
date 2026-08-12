import type { TabDefinition } from '@/lib/tabs';
import { colors, moduleAccents } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import type { TabKey } from '@/api/types';

export const ROW_HEIGHT = 56;

interface TabPlacementRowProps {
  def: TabDefinition;
  isDragging: boolean;
  translateY: SharedValue<number>;
  onDragStart: (key: TabKey) => void;
  onDragEnd: (key: TabKey, translationY: number) => void;
  onNavigate: (key: TabKey) => void;
}

export function TabPlacementRow({
  def,
  isDragging,
  translateY,
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
          runOnJS(onDragStart)(def.key);
        })
        .onUpdate((event) => {
          translateY.value = event.translationY;
        })
        .onEnd((event) => {
          runOnJS(onDragEnd)(def.key, event.translationY);
        }),
    [def.key, translateY, onDragStart, onDragEnd],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: isDragging ? translateY.value : 0 }],
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.9 : 1,
    shadowOpacity: isDragging ? 0.3 : 0,
  }));

  return (
    <Animated.View
      style={[{ height: ROW_HEIGHT }, animatedStyle]}
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
