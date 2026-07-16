import type { ApiError } from '@/api/client';
import type { Entry } from '@/api/types';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';

type Day = 'Push' | 'Pull' | 'Legs';
const DAYS: Day[] = ['Push', 'Pull', 'Legs'];

interface ExerciseTemplateEditorProps {
  templates: Entry[];
  onCreate: (day: Day, title: string, targetSets: number, targetReps: number) => Promise<void>;
  onDelete: (entry: Entry) => void;
}

function templateTitle(entry: Entry): string {
  return typeof entry.payload.title === 'string' ? entry.payload.title : `Exercise #${entry.id}`;
}

export function ExerciseTemplateEditor({ templates, onCreate, onDelete }: ExerciseTemplateEditorProps) {
  const [drafts, setDrafts] = useState<Record<Day, { title: string; sets: string; reps: string }>>({
    Push: { title: '', sets: '3', reps: '8' },
    Pull: { title: '', sets: '3', reps: '8' },
    Legs: { title: '', sets: '3', reps: '8' },
  });
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(day: Day) {
    const draft = drafts[day];
    const sets = Number(draft.sets);
    const reps = Number(draft.reps);
    if (!draft.title.trim() || !Number.isFinite(sets) || sets <= 0 || !Number.isFinite(reps) || reps <= 0) {
      return;
    }
    setError(null);
    try {
      await onCreate(day, draft.title.trim(), sets, reps);
      setDrafts((prev) => ({ ...prev, [day]: { title: '', sets: '3', reps: '8' } }));
    } catch (err) {
      setError((err as ApiError).detail);
    }
  }

  return (
    <View className="gap-5">
      <ErrorBanner message={error} />
      {DAYS.map((day) => (
        <View key={day} className="gap-2">
          <Text className="text-sm font-semibold text-slate-700">{day}</Text>
          {templates
            .filter((t) => t.payload.day === day)
            .map((t) => (
              <View
                key={t.id}
                className="flex-row items-center justify-between rounded-md border border-slate-200 bg-white p-2">
                <Text className="flex-1 text-sm text-slate-900">
                  {templateTitle(t)}{' '}
                  <Text className="text-xs text-slate-500">
                    ({String(t.payload.targetSets)}x{String(t.payload.targetReps)})
                  </Text>
                </Text>
                <Pressable onPress={() => onDelete(t)} hitSlop={8}>
                  <Text className="text-xs text-red-600">Delete</Text>
                </Pressable>
              </View>
            ))}
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholderTextColor="#94a3b8"
              placeholder="Exercise name"
              value={drafts[day].title}
              onChangeText={(text) =>
                setDrafts((prev) => ({ ...prev, [day]: { ...prev[day], title: text } }))
              }
            />
            <TextInput
              className="w-14 rounded-md border border-slate-300 px-2 py-2 text-center text-sm"
              placeholderTextColor="#94a3b8"
              placeholder="Sets"
              keyboardType="numeric"
              value={drafts[day].sets}
              onChangeText={(text) =>
                setDrafts((prev) => ({ ...prev, [day]: { ...prev[day], sets: text } }))
              }
            />
            <TextInput
              className="w-14 rounded-md border border-slate-300 px-2 py-2 text-center text-sm"
              placeholderTextColor="#94a3b8"
              placeholder="Reps"
              keyboardType="numeric"
              value={drafts[day].reps}
              onChangeText={(text) =>
                setDrafts((prev) => ({ ...prev, [day]: { ...prev[day], reps: text } }))
              }
            />
            <Button variant="secondary" onPress={() => handleAdd(day)}>
              Add
            </Button>
          </View>
        </View>
      ))}
    </View>
  );
}
