import type { Entry } from '@/api/types';
import { SafeAreaScreen } from '@/components/layout/SafeAreaScreen';
import { useEntries } from '@/hooks/useEntries';
import { formatDateDisplay, formatDateOnly, parseDateOnly } from '@/lib/date';
import {
  isProjectArchived,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
  projectDescription,
  projectEndDate,
  projectNotes,
  projectStartDate,
  projectStatus,
  projectTitle,
  tasksForProject,
  taskDescription,
  type ProjectStatus,
} from '@/lib/projects';
import { taskDueDate, taskTitle } from '@/lib/tasks';
import { useModulesContext } from '@/modules/ModulesContext';
import { colors } from '@/theme/colors';
import { getModuleAccentKey } from '@/theme/moduleAccent';
import { moduleClassNames } from '@/theme/moduleClassNames';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { TextField } from '../ui/TextField';
import { ProjectTaskEditForm, type ProjectTaskEditValues } from './ProjectTaskEditForm';

const MODULE_NAME = 'Projects';
const accentKey = getModuleAccentKey(MODULE_NAME);
const accentClasses = moduleClassNames[accentKey];
const ALL_ENTRIES_LIMIT = 1000;

function compareByDueDate(a: Entry, b: Entry): number {
  const dueA = taskDueDate(a);
  const dueB = taskDueDate(b);
  if (dueA && dueB) return dueA < dueB ? -1 : dueA > dueB ? 1 : 0;
  if (dueA) return -1;
  if (dueB) return 1;
  return a.id - b.id;
}

interface ProjectDetailViewProps {
  projectId: number;
}

export function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const router = useRouter();
  const { findByName, loading: modulesLoading, error: modulesError } = useModulesContext();
  const module = findByName(MODULE_NAME);

  const { entries, loading, error, create, update, remove } = useEntries({
    moduleId: module?.id,
    limit: ALL_ENTRIES_LIMIT,
  });

  const entry = entries.find((e) => e.id === projectId);
  const tasks = tasksForProject(entries, projectId).sort(compareByDueDate);

  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Entry | null>(null);
  const [editTaskError, setEditTaskError] = useState<string | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Entry | null>(null);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);

  useEffect(() => {
    if (!entry) return;
    setDescription(projectDescription(entry));
    setNotes(projectNotes(entry));
    // Seed local edit state once per project, not on every entry refresh —
    // otherwise saving one field would clobber in-progress edits to the other.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.id]);

  async function handleSaveDescription() {
    if (!entry) return;
    try {
      await update(entry.id, { payload: { ...entry.payload, description } });
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleSaveNotes() {
    if (!entry) return;
    try {
      await update(entry.id, { payload: { ...entry.payload, notes } });
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleChangeStartDate(date: string | null) {
    if (!entry) return;
    setPageError(null);
    try {
      await update(entry.id, { payload: { ...entry.payload, startDate: date } });
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleChangeEndDate(date: string | null) {
    if (!entry) return;
    setPageError(null);
    try {
      await update(entry.id, { payload: { ...entry.payload, endDate: date } });
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  function handleStartPickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setStartPickerOpen(false);
    if (event.type === 'set' && selected) handleChangeStartDate(formatDateOnly(selected));
  }

  function handleEndPickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setEndPickerOpen(false);
    if (event.type === 'set' && selected) handleChangeEndDate(formatDateOnly(selected));
  }

  async function handleChangeStatus(status: ProjectStatus) {
    if (!entry) return;
    setPageError(null);
    try {
      // Moving off 'done' un-archives — archiving only ever happens via the
      // end-of-month sweep (see dailyReset.ts), never immediately on status
      // change, but reversing it here is what lets a re-opened project find
      // its way back out of the Archived section without a separate control.
      const nextPayload = status === 'done' ? entry.payload : { ...entry.payload, archived: false };
      await update(entry.id, { status, payload: nextPayload });
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleAddTask() {
    if (!newTaskTitle.trim() || !entry) return;
    setPageError(null);
    try {
      await create({ payload: { kind: 'task', projectId: entry.id, title: newTaskTitle.trim() } });
      setNewTaskTitle('');
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleToggleTask(task: Entry) {
    setPageError(null);
    try {
      await update(task.id, { status: task.status === 'done' ? 'active' : 'done' });
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleUpdateTask(values: ProjectTaskEditValues) {
    if (!editingTask) return;
    setEditTaskError(null);
    try {
      await update(editingTask.id, {
        payload: { ...editingTask.payload, dueDate: values.dueDate, description: values.description },
      });
      setEditingTask(null);
    } catch (err) {
      setEditTaskError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleDeleteTask() {
    if (!deleteTaskTarget) return;
    try {
      await remove(deleteTaskTarget.id);
      setDeleteTaskTarget(null);
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  const showSpinner = modulesLoading || loading;

  return (
    <SafeAreaScreen>
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Text className="flex-1 text-lg font-semibold text-ink" numberOfLines={1}>
          {entry ? projectTitle(entry) : ''}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8} className="p-1">
          <Ionicons name="close" size={24} color={colors.inkMuted} />
        </Pressable>
      </View>

      {showSpinner ? (
        <View className="flex-1 items-center justify-center bg-background">
          <Spinner />
        </View>
      ) : modulesError || error || !entry ? (
        <View className="flex-1 gap-4 bg-background p-4">
          <ErrorBanner message={modulesError ?? error ?? 'Project not found.'} />
        </View>
      ) : (
        <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 p-4">
          <ErrorBanner message={pageError} />

          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-medium text-ink-muted">Status</Text>
              {isProjectArchived(entry) && (
                <View className="rounded bg-surface-raised px-1.5 py-0.5">
                  <Text className="text-xs text-ink-faint">Archived</Text>
                </View>
              )}
            </View>
            <View className="flex-row flex-wrap gap-2">
              {PROJECT_STATUSES.map((status) => {
                const selected = projectStatus(entry) === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => handleChangeStatus(status)}
                    className={`rounded-md border px-3 py-2 ${
                      selected ? `${accentClasses.border} ${accentClasses.bgSubtle}` : 'border-border bg-surface'
                    }`}>
                    <Text className={`text-sm ${selected ? accentClasses.text : 'text-ink-muted'}`}>
                      {PROJECT_STATUS_LABELS[status]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1 gap-2">
              <Text className="text-sm font-medium text-ink-muted">Start date</Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setStartPickerOpen(true)}
                  className="flex-1 rounded-md border border-border bg-surface px-3 py-2">
                  <Text className="text-sm text-ink">
                    {projectStartDate(entry) ? formatDateDisplay(projectStartDate(entry)!) : 'Not set'}
                  </Text>
                </Pressable>
                {projectStartDate(entry) && (
                  <Button variant="secondary" onPress={() => handleChangeStartDate(null)}>
                    Clear
                  </Button>
                )}
              </View>
            </View>

            <View className="flex-1 gap-2">
              <Text className="text-sm font-medium text-ink-muted">End date</Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setEndPickerOpen(true)}
                  className="flex-1 rounded-md border border-border bg-surface px-3 py-2">
                  <Text className="text-sm text-ink">
                    {projectEndDate(entry) ? formatDateDisplay(projectEndDate(entry)!) : 'Not set'}
                  </Text>
                </Pressable>
                {projectEndDate(entry) && (
                  <Button variant="secondary" onPress={() => handleChangeEndDate(null)}>
                    Clear
                  </Button>
                )}
              </View>
            </View>
          </View>

          <TextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            onBlur={handleSaveDescription}
            placeholder="Short description…"
          />

          <TextField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            onBlur={handleSaveNotes}
            placeholder="Notes…"
            multiline
            numberOfLines={6}
            className="min-h-32"
            textAlignVertical="top"
          />

          <View className="gap-2">
            <Text className="text-sm font-medium text-ink-muted">To-dos</Text>
            <View className="flex-row items-end gap-2">
              <View className="flex-1">
                <TextField
                  label=""
                  placeholder="Add a task…"
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  onSubmitEditing={handleAddTask}
                  returnKeyType="done"
                />
              </View>
              <Button accent={accentKey} onPress={handleAddTask} disabled={!newTaskTitle.trim()}>
                Add
              </Button>
            </View>

            {tasks.length === 0 ? (
              <Text className="text-xs text-ink-faint">No tasks yet.</Text>
            ) : (
              <View className="gap-2">
                {tasks.map((task) => {
                  const dueDate = taskDueDate(task);
                  const desc = taskDescription(task);
                  return (
                    <View
                      key={task.id}
                      className="flex-row items-center justify-between rounded-md border border-border bg-surface p-3">
                      <View className="flex-1 flex-row items-center gap-3">
                        <Pressable
                          onPress={() => handleToggleTask(task)}
                          hitSlop={8}
                          className={`h-5 w-5 items-center justify-center rounded border ${
                            task.status === 'done'
                              ? `${accentClasses.borderStrong} ${accentClasses.bgStrong}`
                              : 'border-border bg-surface'
                          }`}>
                          {task.status === 'done' && <Text className="text-xs text-on-accent">✓</Text>}
                        </Pressable>
                        <Pressable className="flex-1 gap-1" onPress={() => setEditingTask(task)}>
                          <Text
                            className={`text-sm ${
                              task.status === 'done' ? 'text-ink-faint line-through' : 'text-ink'
                            }`}>
                            {taskTitle(task)}
                          </Text>
                          {(dueDate || desc !== '') && (
                            <View className="gap-0.5">
                              {dueDate && (
                                <Text className="text-xs text-ink-faint">{formatDateDisplay(dueDate)}</Text>
                              )}
                              {desc !== '' && (
                                <Text className="text-xs text-ink-faint" numberOfLines={1}>
                                  {desc}
                                </Text>
                              )}
                            </View>
                          )}
                        </Pressable>
                      </View>
                      <Pressable onPress={() => setDeleteTaskTarget(task)} hitSlop={8}>
                        <Text className="text-xs text-danger">Delete</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {startPickerOpen && entry && (
        <Modal title="Start date" onClose={() => setStartPickerOpen(false)}>
          <View className="gap-4">
            <DateTimePicker
              value={projectStartDate(entry) ? parseDateOnly(projectStartDate(entry)!) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleStartPickerChange}
            />
            <View className="flex-row justify-end">
              <Button accent={accentKey} onPress={() => setStartPickerOpen(false)}>
                Done
              </Button>
            </View>
          </View>
        </Modal>
      )}

      {endPickerOpen && entry && (
        <Modal title="End date" onClose={() => setEndPickerOpen(false)}>
          <View className="gap-4">
            <DateTimePicker
              value={projectEndDate(entry) ? parseDateOnly(projectEndDate(entry)!) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleEndPickerChange}
            />
            <View className="flex-row justify-end">
              <Button accent={accentKey} onPress={() => setEndPickerOpen(false)}>
                Done
              </Button>
            </View>
          </View>
        </Modal>
      )}

      {editingTask && (
        <Modal title={taskTitle(editingTask)} onClose={() => setEditingTask(null)}>
          <ProjectTaskEditForm
            entry={editingTask}
            onSubmit={handleUpdateTask}
            onCancel={() => setEditingTask(null)}
            submitError={editTaskError}
            accent={accentKey}
          />
        </Modal>
      )}

      {deleteTaskTarget && (
        <ConfirmDialog
          title="Delete task"
          message={`Delete "${taskTitle(deleteTaskTarget)}"?`}
          confirmLabel="Delete"
          onConfirm={handleDeleteTask}
          onCancel={() => setDeleteTaskTarget(null)}
        />
      )}
    </SafeAreaScreen>
  );
}
