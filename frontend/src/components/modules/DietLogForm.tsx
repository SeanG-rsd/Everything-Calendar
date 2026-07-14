import type { Entry } from '@/api/types';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { TextField } from '../ui/TextField';

export interface DietLogValues {
  name?: string;
  calories: number;
}

interface DietLogFormProps {
  entry?: Entry;
  onSubmit: (values: DietLogValues) => Promise<void>;
  onCancel: () => void;
  submitError?: string | null;
}

export function DietLogForm({ entry, onSubmit, onCancel, submitError }: DietLogFormProps) {
  const payload = entry?.payload ?? {};
  const [calories, setCalories] = useState(
    String(typeof payload.calories === 'number' ? payload.calories : ''),
  );
  const [name, setName] = useState(typeof payload.name === 'string' ? payload.name : '');
  const [submitting, setSubmitting] = useState(false);

  const caloriesNum = Number(calories);
  const valid = Number.isFinite(caloriesNum) && caloriesNum > 0;

  async function handleSubmit() {
    if (!valid) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim() || undefined, calories: caloriesNum });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="gap-4">
      <ErrorBanner message={submitError} />
      <TextField
        label="Calories"
        value={calories}
        onChangeText={setCalories}
        keyboardType="numeric"
        placeholder="e.g. 250"
      />
      <TextField
        label="Food name (optional)"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Banana"
      />
      <View className="flex-row justify-end gap-2">
        <Button variant="secondary" onPress={onCancel}>
          Cancel
        </Button>
        <Button onPress={handleSubmit} disabled={submitting || !valid}>
          {entry ? 'Save' : 'Add'}
        </Button>
      </View>
    </View>
  );
}
