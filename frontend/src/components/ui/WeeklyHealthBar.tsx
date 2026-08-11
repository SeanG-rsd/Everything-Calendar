import type { DaySectionsMet, HealthSection } from '@/lib/healthHistory';
import { colors } from '@/theme/colors';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface WeeklyHealthBarProps {
  days: DaySectionsMet[];
}

// Matches WeeklyProgressBar's h-6 w-6 (24px) dots so the two bars are the same height.
const SIZE = 24;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const THIRD = CIRCUMFERENCE / 3;
const GAP = THIRD * 0.1;

const SECTIONS: { key: HealthSection; color: string; rotation: number }[] = [
  { key: 'diet', color: colors.progress.red, rotation: -90 },
  { key: 'water', color: colors.water.default, rotation: -90 + 120 },
  { key: 'workout', color: colors.progress.orange, rotation: -90 + 240 },
];

export function WeeklyHealthBar({ days }: WeeklyHealthBarProps) {
  return (
    <View className="mb-4 flex-row justify-between rounded-md border border-border bg-surface px-3 py-3">
      {days.map((day) => (
        <View key={day.date} className="items-center gap-1.5">
          <Text className="text-xs font-medium text-ink-muted">{day.letter}</Text>
          {/* Fixed via the same h-6 w-6 class as WeeklyProgressBar's dot, rather than
              trusting Svg's own width/height props, so the two bars lay out identically. */}
          <View className="h-6 w-6">
            <Svg width="100%" height="100%" viewBox={`0 0 ${SIZE} ${SIZE}`}>
              {SECTIONS.map((section) => (
                <Circle
                  key={section.key}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke={day[section.key] ? section.color : colors.progress.gray}
                  strokeWidth={STROKE}
                  fill="none"
                  strokeDasharray={`${THIRD - GAP} ${CIRCUMFERENCE - (THIRD - GAP)}`}
                  rotation={section.rotation}
                  origin={`${SIZE / 2}, ${SIZE / 2}`}
                />
              ))}
            </Svg>
          </View>
        </View>
      ))}
    </View>
  );
}
