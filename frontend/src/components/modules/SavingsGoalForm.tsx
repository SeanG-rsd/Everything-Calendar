import type { Entry } from '@/api/types';
import type { ModuleAccentKey } from '@/theme/colors';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { TextField } from '../ui/TextField';

export interface SavingsGoalValues {
  title: string;
  target: number;
  current: number;
}

interface SavingsGoalFormProps {
  entry?: Entry;
  onSubmit: (values: SavingsGoalValues) => Promise<void>;
  onCancel: () => void;
  submitError?: string | null;
  accent?: ModuleAccentKey;
}

export function SavingsGoalForm({
  entry,
  onSubmit,
  onCancel,
  submitError,
  accent,
}: SavingsGoalFormProps) {
  const payload = entry?.payload ?? {};
  const [title, setTitle] = useState(typeof payload.title === 'string' ? payload.title : '');
  const [target, setTarget] = useState(
    String(typeof payload.target === 'number' ? payload.target : ''),
  );
  const [current, setCurrent] = useState(
    String(typeof payload.current === 'number' ? payload.current : '0'),
  );
  const [submitting, setSubmitting] = useState(false);

  const targetNum = Number(target);
  const currentNum = Number(current);
  const valid =
    title.trim().length > 0 &&
    Number.isFinite(targetNum) &&
    targetNum > 0 &&
    Number.isFinite(currentNum) &&
    currentNum >= 0;

  async function handleSubmit() {
    if (!valid) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), target: targetNum, current: currentNum });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="gap-4">
      <ErrorBanner message={submitError} />
      <TextField label="Goal name" value={title} onChangeText={setTitle} placeholder="e.g. Emergency Fund" />
      <TextField label="Target amount ($)" value={target} onChangeText={setTarget} keyboardType="numeric" />
      <TextField label="Saved so far ($)" value={current} onChangeText={setCurrent} keyboardType="numeric" />
      <View className="flex-row justify-end gap-2">
        <Button variant="secondary" onPress={onCancel}>
          Cancel
        </Button>
        <Button accent={accent} onPress={handleSubmit} disabled={submitting || !valid}>
          {entry ? 'Save' : 'Add goal'}
        </Button>
      </View>
    </View>
  );
}
