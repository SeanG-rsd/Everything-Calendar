import type { Entry } from '@/api/types';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';

interface ExerciseDraft {
  title: string;
  sets: string;
  reps: string;
}

const EMPTY_DRAFT: ExerciseDraft = { title: '', sets: '3', reps: '8' };

interface ExerciseTemplateEditorProps {
  days: string[];
  templates: Entry[];
  onCreateExercise: (day: string, title: string, targetSets: number, targetReps: number) => Promise<void>;
  onDeleteExercise: (entry: Entry) => void;
  onCreateDay: (name: string) => Promise<void>;
  onDeleteDay: (name: string) => void;
}

function templateTitle(entry: Entry): string {
  return typeof entry.payload.title === 'string' ? entry.payload.title : `Exercise #${entry.id}`;
}

export function ExerciseTemplateEditor({
  days,
  templates,
  onCreateExercise,
  onDeleteExercise,
  onCreateDay,
  onDeleteDay,
}: ExerciseTemplateEditorProps) {
  const [drafts, setDrafts] = useState<Record<string, ExerciseDraft>>({});
  const [newDayName, setNewDayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function draftFor(day: string): ExerciseDraft {
    return drafts[day] ?? EMPTY_DRAFT;
  }

  async function handleAddDay() {
    const name = newDayName.trim();
    if (!name) return;
    if (days.some((d) => d.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" is already in your rotation.`);
      return;
    }
    setError(null);
    try {
      await onCreateDay(name);
      setNewDayName('');
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleAddExercise(day: string) {
    const draft = draftFor(day);
    const sets = Number(draft.sets);
    const reps = Number(draft.reps);
    if (!draft.title.trim() || !Number.isFinite(sets) || sets <= 0 || !Number.isFinite(reps) || reps <= 0) {
      return;
    }
    setError(null);
    try {
      await onCreateExercise(day, draft.title.trim(), sets, reps);
      setDrafts((prev) => ({ ...prev, [day]: EMPTY_DRAFT }));
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong.');
    }
  }

  return (
    <View className="gap-5">
      <ErrorBanner message={error} />
      <View className="gap-2 border-b border-border-subtle pb-4">
        <Text className="text-sm font-semibold text-ink-muted">Add a workout</Text>
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
            placeholderTextColor="#626B7A"
            placeholder="e.g. Back and Biceps"
            value={newDayName}
            onChangeText={setNewDayName}
          />
          <Button variant="secondary" onPress={handleAddDay}>
            Add workout
          </Button>
        </View>
      </View>
      {days.length === 0 ? (
        <Text className="text-sm text-ink-muted">No workouts in your rotation yet — add one above.</Text>
      ) : (
        days.map((day) => (
          <View key={day} className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-ink-muted">{day}</Text>
              <Pressable onPress={() => onDeleteDay(day)} hitSlop={8}>
                <Text className="text-xs text-danger">Remove workout</Text>
              </Pressable>
            </View>
            {templates
              .filter((t) => t.payload.day === day)
              .map((t) => (
                <View
                  key={t.id}
                  className="flex-row items-center justify-between rounded-md border border-border bg-surface p-2">
                  <Text className="flex-1 text-sm text-ink">
                    {templateTitle(t)}{' '}
                    <Text className="text-xs text-ink-muted">
                      ({String(t.payload.targetSets)}x{String(t.payload.targetReps)})
                    </Text>
                  </Text>
                  <Pressable onPress={() => onDeleteExercise(t)} hitSlop={8}>
                    <Text className="text-xs text-danger">Delete</Text>
                  </Pressable>
                </View>
              ))}
            <View className="flex-row gap-2">
              <TextInput
                className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
                placeholderTextColor="#626B7A"
                placeholder="Exercise name"
                value={draftFor(day).title}
                onChangeText={(text) =>
                  setDrafts((prev) => ({ ...prev, [day]: { ...draftFor(day), title: text } }))
                }
              />
              <TextInput
                className="w-14 rounded-md border border-border bg-surface px-2 py-2 text-center text-sm text-ink"
                placeholderTextColor="#626B7A"
                placeholder="Sets"
                keyboardType="numeric"
                value={draftFor(day).sets}
                onChangeText={(text) =>
                  setDrafts((prev) => ({ ...prev, [day]: { ...draftFor(day), sets: text } }))
                }
              />
              <TextInput
                className="w-14 rounded-md border border-border bg-surface px-2 py-2 text-center text-sm text-ink"
                placeholderTextColor="#626B7A"
                placeholder="Reps"
                keyboardType="numeric"
                value={draftFor(day).reps}
                onChangeText={(text) =>
                  setDrafts((prev) => ({ ...prev, [day]: { ...draftFor(day), reps: text } }))
                }
              />
              <Button variant="secondary" onPress={() => handleAddExercise(day)}>
                Add
              </Button>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
