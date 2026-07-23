import type { Entry } from '@/api/types';
import { formatDateDisplay, formatDateOnly, parseDateOnly } from '@/lib/date';
import { PRIORITY_LABELS, PRIORITIES, taskDueDate, taskPriority, type Priority } from '@/lib/tasks';
import type { ModuleAccentKey } from '@/theme/colors';
import { priorityClassNames } from '@/theme/priorityClassNames';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';

export interface TaskEditValues {
  priority: Priority | null;
  dueDate: string | null;
}

interface TaskEditFormProps {
  entry: Entry;
  onSubmit: (values: TaskEditValues) => Promise<void>;
  onCancel: () => void;
  submitError?: string | null;
  accent?: ModuleAccentKey;
}

export function TaskEditForm({ entry, onSubmit, onCancel, submitError, accent }: TaskEditFormProps) {
  const [priority, setPriority] = useState<Priority | null>(taskPriority(entry));
  const [dueDate, setDueDate] = useState<string | null>(taskDueDate(entry));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit({ priority, dueDate });
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
        <Text className="text-sm font-medium text-ink-muted">Priority</Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setPriority(null)}
            className={`flex-1 items-center rounded-md border py-2 ${
              priority === null ? 'border-ink bg-surface-raised' : 'border-border bg-surface'
            }`}>
            <Text className="text-sm text-ink">None</Text>
          </Pressable>
          {PRIORITIES.map((level) => {
            const classes = priorityClassNames[level];
            const selected = priority === level;
            return (
              <Pressable
                key={level}
                onPress={() => setPriority(level)}
                className={`flex-1 items-center rounded-md border py-2 ${
                  selected ? `${classes.border} ${classes.bg}` : 'border-border bg-surface'
                }`}>
                <Text className={`text-sm ${selected ? classes.text : 'text-ink-muted'}`}>
                  {PRIORITY_LABELS[level]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium text-ink-muted">Due date</Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setPickerOpen(true)}
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2">
            <Text className="text-sm text-ink">
              {dueDate ? formatDateDisplay(dueDate) : 'No due date'}
            </Text>
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
