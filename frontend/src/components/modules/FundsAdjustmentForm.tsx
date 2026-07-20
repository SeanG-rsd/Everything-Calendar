import type { ModuleAccentKey } from '@/theme/colors';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { TextField } from '../ui/TextField';

interface FundsAdjustmentFormProps {
  mode: 'add' | 'subtract';
  onSubmit: (amount: number) => Promise<void>;
  onCancel: () => void;
  submitError?: string | null;
  accent?: ModuleAccentKey;
}

export function FundsAdjustmentForm({
  mode,
  onSubmit,
  onCancel,
  submitError,
  accent,
}: FundsAdjustmentFormProps) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const amountNum = Number(amount);
  const valid = Number.isFinite(amountNum) && amountNum > 0;

  async function handleSubmit() {
    if (!valid) return;
    setSubmitting(true);
    try {
      await onSubmit(amountNum);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="gap-4">
      <ErrorBanner message={submitError} />
      <TextField
        label={`Amount to ${mode} ($)`}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="e.g. 100"
        autoFocus
      />
      <View className="flex-row justify-end gap-2">
        <Button variant="secondary" onPress={onCancel}>
          Cancel
        </Button>
        <Button accent={accent} onPress={handleSubmit} disabled={submitting || !valid}>
          {mode === 'add' ? 'Add' : 'Subtract'}
        </Button>
      </View>
    </View>
  );
}
