import type { ModuleAccentKey } from '@/theme/colors';
import { moduleClassNames } from '@/theme/moduleClassNames';
import { roundWeightLbs, type WeightGoal, type WeightGoalDirection } from '@/lib/weight';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { TextField } from '../ui/TextField';

export interface WeightGoalValues {
  targetWeightLbs: number;
  direction: WeightGoalDirection;
}

interface WeightGoalFormProps {
  initialGoal: WeightGoal | null;
  onSubmit: (values: WeightGoalValues) => Promise<void>;
  onCancel: () => void;
  submitError?: string | null;
  accent?: ModuleAccentKey;
}

const DIRECTION_OPTIONS: { value: WeightGoalDirection; label: string }[] = [
  { value: 'lose', label: 'Lose weight' },
  { value: 'gain', label: 'Gain weight' },
];

export function WeightGoalForm({ initialGoal, onSubmit, onCancel, submitError, accent }: WeightGoalFormProps) {
  const [targetWeightLbs, setTargetWeightLbs] = useState(
    initialGoal ? String(roundWeightLbs(initialGoal.targetWeightLbs)) : '',
  );
  const [direction, setDirection] = useState<WeightGoalDirection>(initialGoal?.direction ?? 'lose');
  const [submitting, setSubmitting] = useState(false);

  const targetNum = Number(targetWeightLbs);
  const valid = Number.isFinite(targetNum) && targetNum > 0;
  const accentClasses = accent ? moduleClassNames[accent] : null;

  async function handleSubmit() {
    if (!valid) return;
    setSubmitting(true);
    try {
      await onSubmit({ targetWeightLbs: roundWeightLbs(targetNum), direction });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="gap-4">
      <ErrorBanner message={submitError} />

      <View className="gap-2">
        <Text className="text-sm font-medium text-ink-muted">Direction</Text>
        <View className="flex-row gap-2">
          {DIRECTION_OPTIONS.map((option) => {
            const selected = direction === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setDirection(option.value)}
                className={`flex-1 items-center rounded-md border py-2 ${
                  selected && accentClasses
                    ? `${accentClasses.border} ${accentClasses.bgSubtle}`
                    : 'border-border bg-surface'
                }`}>
                <Text className={`text-sm ${selected && accentClasses ? accentClasses.text : 'text-ink-muted'}`}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <TextField
        label="Target weight (lbs)"
        value={targetWeightLbs}
        onChangeText={setTargetWeightLbs}
        keyboardType="numeric"
        placeholder="e.g. 150"
        autoFocus
      />

      <View className="flex-row justify-end gap-2">
        <Button variant="secondary" onPress={onCancel}>
          Cancel
        </Button>
        <Button accent={accent} onPress={handleSubmit} disabled={submitting || !valid}>
          Save
        </Button>
      </View>
    </View>
  );
}
