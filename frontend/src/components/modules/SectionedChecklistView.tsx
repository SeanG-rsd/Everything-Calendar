import type { Entry } from '@/api/types';
import { useEntries } from '@/hooks/useEntries';
import { useModulesContext } from '@/modules/ModulesContext';
import { getModuleAccentKey } from '@/theme/moduleAccent';
import { moduleClassNames } from '@/theme/moduleClassNames';
import { useState } from 'react';
import { Pressable, SectionList, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { TextField } from '../ui/TextField';

interface SectionedChecklistViewProps {
  moduleName: string;
}

interface Group {
  key: string;
  title: string;
  sectionEntry: Entry | null;
  data: Entry[];
}

function isSectionEntry(entry: Entry): boolean {
  return entry.payload.kind === 'section';
}

function getSectionName(entry: Entry): string {
  return typeof entry.payload.name === 'string' ? entry.payload.name : 'Section';
}

function taskTitle(entry: Entry): string {
  return typeof entry.payload.title === 'string' ? entry.payload.title : `Task #${entry.id}`;
}

export function SectionedChecklistView({ moduleName }: SectionedChecklistViewProps) {
  const { findByName, loading: modulesLoading, error: modulesError } = useModulesContext();
  const module = findByName(moduleName);
  const accentKey = getModuleAccentKey(moduleName);
  const accentClasses = moduleClassNames[accentKey];

  const { entries, loading, error, create, update, remove } = useEntries({ moduleId: module?.id });

  const [pageError, setPageError] = useState<string | null>(null);

  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [sectionFormError, setSectionFormError] = useState<string | null>(null);

  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({});

  const [deleteSectionTarget, setDeleteSectionTarget] = useState<Entry | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Entry | null>(null);

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
        <ErrorBanner message={modulesError ?? `"${moduleName}" module isn't set up yet.`} />
      </View>
    );
  }

  const sectionEntries = entries.filter(isSectionEntry);
  const taskEntries = entries.filter((entry) => !isSectionEntry(entry));

  const groups: Group[] = [
    ...sectionEntries.map((sec) => ({
      key: `section-${sec.id}`,
      title: getSectionName(sec),
      sectionEntry: sec,
      data: taskEntries.filter((task) => task.payload.sectionId === sec.id),
    })),
    {
      key: 'general',
      title: 'General',
      sectionEntry: null,
      data: taskEntries.filter((task) => task.payload.sectionId == null),
    },
  ];

  async function handleCreateSection() {
    if (!newSectionName.trim()) return;
    setSectionFormError(null);
    try {
      await create({ payload: { kind: 'section', name: newSectionName.trim() } });
      setNewSectionName('');
      setSectionFormOpen(false);
    } catch (err) {
      setSectionFormError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleAddTask(group: Group) {
    const title = (draftTitles[group.key] ?? '').trim();
    if (!title) return;
    setPageError(null);
    try {
      await create({
        payload: {
          title,
          ...(group.sectionEntry ? { sectionId: group.sectionEntry.id } : {}),
        },
      });
      setDraftTitles((prev) => ({ ...prev, [group.key]: '' }));
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleToggle(entry: Entry) {
    setPageError(null);
    try {
      await update(entry.id, { status: entry.status === 'done' ? 'active' : 'done' });
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
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

  async function handleDeleteSection() {
    if (!deleteSectionTarget) return;
    const childTasks = taskEntries.filter(
      (task) => task.payload.sectionId === deleteSectionTarget.id,
    );
    try {
      for (const task of childTasks) {
        await remove(task.id);
      }
      await remove(deleteSectionTarget.id);
      setDeleteSectionTarget(null);
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  return (
    <View className="flex-1 bg-background p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className={`text-xl font-semibold ${accentClasses.text}`}>{moduleName}</Text>
        <Button accent={accentKey} onPress={() => setSectionFormOpen(true)}>
          New section
        </Button>
      </View>
      <ErrorBanner message={error} />
      <ErrorBanner message={pageError} />
      {loading ? (
        <Spinner />
      ) : (
        <SectionList
          sections={groups}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="gap-2"
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: group }) => (
            <View className="mb-2 mt-3 gap-2 bg-background">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-ink-muted">{group.title}</Text>
                {group.sectionEntry && (
                  <Pressable onPress={() => setDeleteSectionTarget(group.sectionEntry)} hitSlop={8}>
                    <Text className="text-xs text-danger">Delete section</Text>
                  </Pressable>
                )}
              </View>
              <View className="flex-row items-end gap-2">
                <View className="flex-1">
                  <TextField
                    label=""
                    placeholder="Add a task…"
                    value={draftTitles[group.key] ?? ''}
                    onChangeText={(text) =>
                      setDraftTitles((prev) => ({ ...prev, [group.key]: text }))
                    }
                    onSubmitEditing={() => handleAddTask(group)}
                    returnKeyType="done"
                  />
                </View>
                <Button
                  variant="secondary"
                  onPress={() => handleAddTask(group)}
                  disabled={!(draftTitles[group.key] ?? '').trim()}>
                  Add
                </Button>
              </View>
              {group.data.length === 0 && (
                <Text className="text-xs text-ink-faint">No tasks yet.</Text>
              )}
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleToggle(item)}
              className="mb-2 flex-row items-center justify-between rounded-md border border-border bg-surface p-3">
              <View className="flex-1 flex-row items-center gap-3">
                <View
                  className={`h-5 w-5 items-center justify-center rounded border ${
                    item.status === 'done'
                      ? `${accentClasses.borderStrong} ${accentClasses.bgStrong}`
                      : 'border-border bg-surface'
                  }`}>
                  {item.status === 'done' && <Text className="text-xs text-on-accent">✓</Text>}
                </View>
                <Text
                  className={`flex-1 text-sm ${
                    item.status === 'done' ? 'text-ink-faint line-through' : 'text-ink'
                  }`}>
                  {taskTitle(item)}
                </Text>
              </View>
              <Pressable onPress={() => setDeleteTaskTarget(item)} hitSlop={8}>
                <Text className="text-xs text-danger">Delete</Text>
              </Pressable>
            </Pressable>
          )}
        />
      )}
      {sectionFormOpen && (
        <Modal title="New section" onClose={() => setSectionFormOpen(false)}>
          <View className="gap-4">
            <ErrorBanner message={sectionFormError} />
            <TextField
              label="Section name"
              value={newSectionName}
              onChangeText={setNewSectionName}
              placeholder="e.g. Math"
              autoFocus
            />
            <View className="flex-row justify-end gap-2">
              <Button variant="secondary" onPress={() => setSectionFormOpen(false)}>
                Cancel
              </Button>
              <Button accent={accentKey} onPress={handleCreateSection} disabled={!newSectionName.trim()}>
                Create
              </Button>
            </View>
          </View>
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
      {deleteSectionTarget && (
        <ConfirmDialog
          title="Delete section"
          message={`Delete "${getSectionName(deleteSectionTarget)}" and its ${
            taskEntries.filter((task) => task.payload.sectionId === deleteSectionTarget.id).length
          } task(s)?`}
          confirmLabel="Delete"
          onConfirm={handleDeleteSection}
          onCancel={() => setDeleteSectionTarget(null)}
        />
      )}
    </View>
  );
}
