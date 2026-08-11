import type { DayProgress } from '@/lib/goalHistory';
import { Text, View } from 'react-native';

interface WeeklyProgressBarProps {
  days: DayProgress[];
}

function progressColorClass(progress: number | null): string {
  if (progress === null) return 'bg-progress-gray';
  if (progress < 0.25) return 'bg-progress-red';
  if (progress < 0.5) return 'bg-progress-orange';
  if (progress < 0.8) return 'bg-progress-yellow';
  return 'bg-progress-green';
}

export function WeeklyProgressBar({ days }: WeeklyProgressBarProps) {
  return (
    <View className="mb-4 flex-row justify-between rounded-md border border-border bg-surface px-3 py-3">
      {days.map((day) => (
        <View key={day.date} className="items-center gap-1.5">
          <Text className="text-xs font-medium text-ink-muted">{day.letter}</Text>
          <View className={`h-6 w-6 rounded-full ${progressColorClass(day.progress)}`} />
        </View>
      ))}
    </View>
  );
}
