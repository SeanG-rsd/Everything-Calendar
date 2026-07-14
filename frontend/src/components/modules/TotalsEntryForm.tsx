import type { Entry } from '@/api/types';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { TextField } from '../ui/TextField';

export interface TotalsEntryValues {
  title: string;
  target: number;
  current: number;
  unit: string;
}

interface TotalsEntryFormProps {
  entry?: Entry;
  onSubmit: (values: TotalsEntryValues) => Promise<void>;
  onCancel: () => void;
  submitError?: string | null;
}

export function TotalsEntryForm({ entry, onSubmit, onCancel, submitError }: TotalsEntryFormProps) {
  const payload = entry?.payload ?? {};
  const [title, setTitle] = useState(typeof payload.title === 'string' ? payload.title : '');
  const [target, setTarget] = useState(
    String(typeof payload.target === 'number' ? payload.target : ''),
  );
  const [current, setCurrent] = useState(
    String(typeof payload.current === 'number' ? payload.current : '0'),
  );
  const [unit, setUnit] = useState(typeof payload.unit === 'string' ? payload.unit : '');
  const [submitting, setSubmitting] = useState(false);

  const targetNum = Number(target);
  const currentNum = Number(current);
  const valid =
    title.trim().length > 0 && Number.isFinite(targetNum) && targetNum > 0 && Number.isFinite(currentNum);

  async function handleSubmit() {
    if (!valid) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), target: targetNum, current: currentNum, unit: unit.trim() });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="gap-4">
      <ErrorBanner message={submitError} />
      <TextField label="Title" value={title} onChangeText={setTitle} />
      <TextField label="Target" value={target} onChangeText={setTarget} keyboardType="numeric" />
      <TextField label="Current" value={current} onChangeText={setCurrent} keyboardType="numeric" />
      <TextField label="Unit" value={unit} onChangeText={setUnit} placeholder="e.g. reps, kcal" />
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
