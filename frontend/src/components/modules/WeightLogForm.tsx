import type { ModuleAccentKey } from '@/theme/colors';
import { formatDateDisplay, formatDateOnly, parseDateOnly, todayIso } from '@/lib/date';
import { roundWeightLbs } from '@/lib/weight';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { TextField } from '../ui/TextField';

export interface WeightLogValues {
  date: string;
  weightLbs: number;
}

interface WeightLogFormProps {
  /** Pre-fills the form when re-opening it for a day that already has an entry, so logging again
   * for today shows (and lets you correct) what you already entered rather than starting blank. */
  initialDate?: string;
  initialWeightLbs?: number;
  onSubmit: (values: WeightLogValues) => Promise<void>;
  onCancel: () => void;
  submitError?: string | null;
  accent?: ModuleAccentKey;
}

export function WeightLogForm({
  initialDate,
  initialWeightLbs,
  onSubmit,
  onCancel,
  submitError,
  accent,
}: WeightLogFormProps) {
  const [date, setDate] = useState(initialDate ?? todayIso());
  const [weightLbs, setWeightLbs] = useState(initialWeightLbs != null ? String(roundWeightLbs(initialWeightLbs)) : '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const weightNum = Number(weightLbs);
  const valid = Number.isFinite(weightNum) && weightNum > 0;

  async function handleSubmit() {
    if (!valid) return;
    setSubmitting(true);
    try {
      await onSubmit({ date, weightLbs: roundWeightLbs(weightNum) });
    } finally {
      setSubmitting(false);
    }
  }

  function handlePickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setPickerOpen(false);
    if (event.type === 'set' && selected) setDate(formatDateOnly(selected));
  }

  return (
    <View className="gap-4">
      <ErrorBanner message={submitError} />

      <View className="gap-2">
        <Text className="text-sm font-medium text-ink-muted">Date</Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          className="rounded-md border border-border bg-surface px-3 py-2">
          <Text className="text-sm text-ink">{formatDateDisplay(date)}</Text>
        </Pressable>
        {pickerOpen && (
          <DateTimePicker
            value={parseDateOnly(date)}
            mode="date"
            maximumDate={new Date()}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handlePickerChange}
          />
        )}
      </View>

      <TextField
        label="Weight (lbs)"
        value={weightLbs}
        onChangeText={setWeightLbs}
        keyboardType="numeric"
        placeholder="e.g. 165"
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
