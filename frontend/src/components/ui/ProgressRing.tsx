import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, moduleAccents, type ModuleAccentKey } from '@/theme/colors';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  accent?: ModuleAccentKey;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 12,
  label,
  accent,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  const fillColor = accent ? moduleAccents[accent].strong : colors.ink;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceRaised}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View className="items-center">
        <Text className="text-2xl font-semibold text-ink">{Math.round(clamped * 100)}%</Text>
        {label && <Text className="text-xs text-ink-muted">{label}</Text>}
      </View>
    </View>
  );
}
