import type { Entry } from '@/api/types';
import { formatDateDisplay, formatDateOnly, parseDateOnly } from '@/lib/date';
import { taskDueDate } from '@/lib/tasks';
import { taskDescription } from '@/lib/projects';
import type { ModuleAccentKey } from '@/theme/colors';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { TextField } from '../ui/TextField';

export interface ProjectTaskEditValues {
  dueDate: string | null;
  description: string;
}

interface ProjectTaskEditFormProps {
  entry: Entry;
  onSubmit: (values: ProjectTaskEditValues) => Promise<void>;
  onCancel: () => void;
  submitError?: string | null;
  accent?: ModuleAccentKey;
}

export function ProjectTaskEditForm({ entry, onSubmit, onCancel, submitError, accent }: ProjectTaskEditFormProps) {
  const [dueDate, setDueDate] = useState<string | null>(taskDueDate(entry));
  const [description, setDescription] = useState(taskDescription(entry));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit({ dueDate, description });
    } finally {
      setSubmitting(false);
    }
  }

  function handlePickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setPickerOpen(false);
    if (event.type === 'set' && selected) setDueDate(formatDateOnly(selected));
  }

  return (
    <View className="gap-4">
      <ErrorBanner message={submitError} />

      <View className="gap-2">
        <Text className="text-sm font-medium text-ink-muted">Due date</Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setPickerOpen(true)}
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2">
            <Text className="text-sm text-ink">{dueDate ? formatDateDisplay(dueDate) : 'No due date'}</Text>
          </Pressable>
          {dueDate && (
            <Button variant="secondary" onPress={() => setDueDate(null)}>
              Clear
            </Button>
          )}
        </View>
        {pickerOpen && (
          <DateTimePicker
            value={dueDate ? parseDateOnly(dueDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handlePickerChange}
          />
        )}
      </View>

      <TextField
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Add details…"
        multiline
        numberOfLines={4}
        className="min-h-24"
        textAlignVertical="top"
      />

      <View className="flex-row justify-end gap-2">
        <Button variant="secondary" onPress={onCancel}>
          Cancel
        </Button>
        <Button accent={accent} onPress={handleSubmit} disabled={submitting}>
          Save
        </Button>
      </View>
    </View>
  );
}
