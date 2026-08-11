import type { ModuleAccentKey } from '@/theme/colors';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { TextField } from '../ui/TextField';

export interface GoalEditValues {
  amount: number;
}

interface GoalEditFormProps {
  label: string;
  unit: string;
  initialAmount: number | null;
  onSubmit: (values: GoalEditValues) => Promise<void>;
  onCancel: () => void;
  submitError?: string | null;
  accent?: ModuleAccentKey;
}

export function GoalEditForm({
  label,
  unit,
  initialAmount,
  onSubmit,
  onCancel,
  submitError,
  accent,
}: GoalEditFormProps) {
  const [amount, setAmount] = useState(String(initialAmount ?? ''));
  const [submitting, setSubmitting] = useState(false);

  const amountNum = Number(amount);
  const valid = Number.isFinite(amountNum) && amountNum > 0;

  async function handleSubmit() {
    if (!valid) return;
    setSubmitting(true);
    try {
      await onSubmit({ amount: amountNum });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="gap-4">
      <ErrorBanner message={submitError} />
      <TextField
        label={`${label} (${unit})`}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="e.g. 2000"
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
