import type { Entry } from '@/api/types';
import { useEntries } from '@/hooks/useEntries';
import { useModulesContext } from '@/modules/ModulesContext';
import { getModuleAccentKey } from '@/theme/moduleAccent';
import { moduleClassNames } from '@/theme/moduleClassNames';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { ExerciseTemplateEditor } from './ExerciseTemplateEditor';

const MODULE_NAME = 'Daily Workout';
const accentKey = getModuleAccentKey(MODULE_NAME);
const accentClasses = moduleClassNames[accentKey];
const CYCLE = ['Push', 'Pull', 'Legs'] as const;
type Day = (typeof CYCLE)[number];

interface SessionExercise {
  title: string;
  targetSets: number;
  targetReps: number;
  actualSets: number | null;
  actualReps: number | null;
  weight: number | null;
}

function isTemplate(entry: Entry): boolean {
  return entry.payload.kind === 'template';
}

function isSession(entry: Entry): boolean {
  return entry.payload.kind === 'session';
}

function isValidDay(value: unknown): value is Day {
  return value === 'Push' || value === 'Pull' || value === 'Legs';
}

function computeNextDay(entries: Entry[]): Day {
  const doneSessions = entries.filter((e) => isSession(e) && e.status === 'done');
  if (doneSessions.length === 0) return 'Push';
  const latest = doneSessions.reduce((a, b) =>
    new Date(a.updated_at) > new Date(b.updated_at) ? a : b,
  );
  const lastDay = isValidDay(latest.payload.day) ? latest.payload.day : 'Push';
  return CYCLE[(CYCLE.indexOf(lastDay) + 1) % CYCLE.length];
}

function getSessionExercises(entry: Entry): SessionExercise[] {
  return Array.isArray(entry.payload.exercises) ? (entry.payload.exercises as SessionExercise[]) : [];
}

export function WorkoutModuleView() {
  const { findByName, loading: modulesLoading, error: modulesError } = useModulesContext();
  const module = findByName(MODULE_NAME);

  const { entries, loading, error, create, update, remove } = useEntries({ moduleId: module?.id });

  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<Entry | null>(null);
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<Entry | null>(null);

  const templates = entries.filter(isTemplate);
  const sessions = entries.filter(isSession);
  const activeSession = sessions.find((s) => s.status === 'active') ?? null;

  const [draftExercises, setDraftExercises] = useState<SessionExercise[]>([]);

  useEffect(() => {
    setDraftExercises(activeSession ? getSessionExercises(activeSession) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id, activeSession?.updated_at]);

  if (modulesLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  if (modulesError || !module) {
    return (
      <View className="flex-1 gap-4 bg-background p-4">
        <ErrorBanner message={modulesError ?? `"${MODULE_NAME}" module isn't set up yet.`} />
      </View>
    );
  }

  const nextDay = computeNextDay(entries);
  const doneSessions = sessions
    .filter((s) => s.status === 'done')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  async function handleCreateTemplate(day: Day, title: string, targetSets: number, targetReps: number) {
    await create({ payload: { kind: 'template', day, title, targetSets, targetReps } });
  }

  async function handleDeleteTemplate() {
    if (!deleteTemplateTarget) return;
    try {
      await remove(deleteTemplateTarget.id);
      setDeleteTemplateTarget(null);
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleStartWorkout() {
    setPageError(null);
    const dayTemplates = templates.filter((t) => t.payload.day === nextDay);
    const exercises: SessionExercise[] = dayTemplates.map((t) => ({
      title: typeof t.payload.title === 'string' ? t.payload.title : 'Exercise',
      targetSets: typeof t.payload.targetSets === 'number' ? t.payload.targetSets : 0,
      targetReps: typeof t.payload.targetReps === 'number' ? t.payload.targetReps : 0,
      actualSets: null,
      actualReps: null,
      weight: null,
    }));
    try {
      await create({ status: 'active', payload: { kind: 'session', day: nextDay, exercises } });
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  function updateDraft(index: number, field: 'actualSets' | 'actualReps' | 'weight', value: string) {
    setDraftExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value === '' ? null : Number(value) } : ex)),
    );
  }

  async function handleCompleteWorkout() {
    if (!activeSession) return;
    setPageError(null);
    try {
      await update(activeSession.id, {
        status: 'done',
        payload: { ...activeSession.payload, exercises: draftExercises },
      });
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleDeleteSession() {
    if (!deleteSessionTarget) return;
    try {
      await remove(deleteSessionTarget.id);
      setDeleteSessionTarget(null);
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  return (
    <View className="flex-1 bg-background p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className={`text-xl font-semibold ${accentClasses.text}`}>Workout</Text>
        <Button variant="secondary" onPress={() => setTemplateEditorOpen(true)}>
          Edit exercises
        </Button>
      </View>
      <ErrorBanner message={error} />
      <ErrorBanner message={pageError} />
      {loading ? (
        <Spinner />
      ) : (
        <ScrollView contentContainerClassName="gap-4">
          {activeSession ? (
            <View className="gap-3 rounded-md border border-border bg-surface p-3">
              <Text className="text-base font-semibold text-ink">
                {String(activeSession.payload.day)} Day — in progress
              </Text>
              {draftExercises.length === 0 ? (
                <Text className="text-sm text-ink-muted">
                  No exercises defined for this day yet — add some via "Edit exercises".
                </Text>
              ) : (
                draftExercises.map((ex, index) => (
                  <View key={index} className="gap-1 border-t border-border-subtle pt-2">
                    <Text className="text-sm font-medium text-ink">
                      {ex.title}{' '}
                      <Text className="text-xs text-ink-muted">
                        (target: {ex.targetSets}x{ex.targetReps})
                      </Text>
                    </Text>
                    <View className="flex-row gap-2">
                      <TextInput
                        className="w-16 rounded-md border border-border bg-surface px-2 py-1.5 text-center text-sm text-ink"
                        placeholderTextColor="#626B7A"
                        placeholder="Sets"
                        keyboardType="numeric"
                        value={ex.actualSets == null ? '' : String(ex.actualSets)}
                        onChangeText={(text) => updateDraft(index, 'actualSets', text)}
                      />
                      <TextInput
                        className="w-16 rounded-md border border-border bg-surface px-2 py-1.5 text-center text-sm text-ink"
                        placeholderTextColor="#626B7A"
                        placeholder="Reps"
                        keyboardType="numeric"
                        value={ex.actualReps == null ? '' : String(ex.actualReps)}
                        onChangeText={(text) => updateDraft(index, 'actualReps', text)}
                      />
                      <TextInput
                        className="w-20 rounded-md border border-border bg-surface px-2 py-1.5 text-center text-sm text-ink"
                        placeholderTextColor="#626B7A"
                        placeholder="Weight"
                        keyboardType="numeric"
                        value={ex.weight == null ? '' : String(ex.weight)}
                        onChangeText={(text) => updateDraft(index, 'weight', text)}
                      />
                    </View>
                  </View>
                ))
              )}
              <View className="flex-row justify-end gap-2 pt-2">
                <Button variant="danger" onPress={() => setDeleteSessionTarget(activeSession)}>
                  Discard
                </Button>
                <Button accent={accentKey} onPress={handleCompleteWorkout}>
                  Complete workout
                </Button>
              </View>
            </View>
          ) : (
            <View className="items-center gap-3 rounded-md border border-border bg-surface p-4">
              <Text className="text-sm text-ink-muted">Next up</Text>
              <Text className="text-2xl font-semibold text-ink">{nextDay} Day</Text>
              <Button accent={accentKey} onPress={handleStartWorkout}>{`Start ${nextDay} workout`}</Button>
            </View>
          )}

          {doneSessions.length > 0 && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-ink-muted">Recent workouts</Text>
              {doneSessions.map((session) => (
                <View
                  key={session.id}
                  className="flex-row items-center justify-between rounded-md border border-border bg-surface p-3">
                  <Text className="text-sm text-ink">
                    {String(session.payload.day)} — {new Date(session.updated_at).toLocaleDateString()}
                  </Text>
                  <Pressable onPress={() => setDeleteSessionTarget(session)} hitSlop={8}>
                    <Text className="text-xs text-danger">Delete</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
      {templateEditorOpen && (
        <Modal title="Edit exercises" onClose={() => setTemplateEditorOpen(false)}>
          <ScrollView style={{ maxHeight: 420 }}>
            <ExerciseTemplateEditor
              templates={templates}
              onCreate={handleCreateTemplate}
              onDelete={(entry) => setDeleteTemplateTarget(entry)}
            />
          </ScrollView>
          <View className="mt-4 flex-row justify-end">
            <Button variant="secondary" onPress={() => setTemplateEditorOpen(false)}>
              Done
            </Button>
          </View>
        </Modal>
      )}
      {deleteSessionTarget && (
        <ConfirmDialog
          title={deleteSessionTarget.status === 'active' ? 'Discard workout' : 'Delete workout'}
          message={`${deleteSessionTarget.status === 'active' ? 'Discard' : 'Delete'} this ${String(
            deleteSessionTarget.payload.day,
          )} Day workout?`}
          confirmLabel={deleteSessionTarget.status === 'active' ? 'Discard' : 'Delete'}
          onConfirm={handleDeleteSession}
          onCancel={() => setDeleteSessionTarget(null)}
        />
      )}
      {deleteTemplateTarget && (
        <ConfirmDialog
          title="Delete exercise"
          message={`Delete "${
            typeof deleteTemplateTarget.payload.title === 'string'
              ? deleteTemplateTarget.payload.title
              : 'this exercise'
          }" from the template?`}
          confirmLabel="Delete"
          onConfirm={handleDeleteTemplate}
          onCancel={() => setDeleteTemplateTarget(null)}
        />
      )}
    </View>
  );
}
