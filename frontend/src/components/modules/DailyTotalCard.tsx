import type { ModuleAccentKey } from '@/theme/colors';
import { moduleClassNames } from '@/theme/moduleClassNames';
import { Text, View } from 'react-native';

interface DailyTotalCardProps {
  total: number;
  goal: number | null;
  unit: string;
  accent: ModuleAccentKey;
}

export function DailyTotalCard({ total, goal, unit, accent }: DailyTotalCardProps) {
  const accentClasses = moduleClassNames[accent];
  const progress = goal ? Math.max(0, Math.min(1, total / goal)) : 0;

  return (
    <View className="mb-4 items-center rounded-md border border-border bg-surface py-4">
      <Text className={`text-3xl font-semibold ${accentClasses.text}`}>
        {total}
        {goal != null ? ` / ${goal}` : ''}
      </Text>
      <Text className="text-xs text-ink-muted">
        {unit} today{goal == null ? ' · no goal set' : ''}
      </Text>
      {goal != null && (
        <View className="mt-3 h-2 w-2/3 overflow-hidden rounded-full bg-surface-raised">
          <View
            className={`h-2 rounded-full ${accentClasses.bg}`}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>
      )}
    </View>
  );
}
