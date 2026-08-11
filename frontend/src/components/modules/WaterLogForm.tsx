import type { ModuleAccentKey } from '@/theme/colors';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { TextField } from '../ui/TextField';

export interface WaterLogValues {
  amountMl: number;
}

interface WaterLogFormProps {
  onSubmit: (values: WaterLogValues) => Promise<void>;
  onCancel: () => void;
  submitError?: string | null;
  accent?: ModuleAccentKey;
}

export function WaterLogForm({ onSubmit, onCancel, submitError, accent }: WaterLogFormProps) {
  const [amountMl, setAmountMl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const amountNum = Number(amountMl);
  const valid = Number.isFinite(amountNum) && amountNum > 0;

  async function handleSubmit() {
    if (!valid) return;
    setSubmitting(true);
    try {
      await onSubmit({ amountMl: amountNum });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="gap-4">
      <ErrorBanner message={submitError} />
      <TextField
        label="Amount (ml)"
        value={amountMl}
        onChangeText={setAmountMl}
        keyboardType="numeric"
        placeholder="e.g. 250"
        autoFocus
      />
      <View className="flex-row justify-end gap-2">
        <Button variant="secondary" onPress={onCancel}>
          Cancel
        </Button>
        <Button accent={accent} onPress={handleSubmit} disabled={submitting || !valid}>
          Add
        </Button>
      </View>
    </View>
  );
}
