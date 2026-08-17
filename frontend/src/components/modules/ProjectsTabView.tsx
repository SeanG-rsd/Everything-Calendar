import type { Entry } from '@/api/types';
import { useEntries } from '@/hooks/useEntries';
import {
  isProjectArchived,
  isProjectEntry,
  PROJECT_STATUS_LABELS,
  projectDescription,
  projectStatus,
  projectTitle,
  tasksForProject,
} from '@/lib/projects';
import { useModulesContext } from '@/modules/ModulesContext';
import { colors } from '@/theme/colors';
import { getModuleAccentKey } from '@/theme/moduleAccent';
import { moduleClassNames } from '@/theme/moduleClassNames';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Href } from 'expo-router';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { TextField } from '../ui/TextField';

const MODULE_NAME = 'Projects';
const accentKey = getModuleAccentKey(MODULE_NAME);
const accentClasses = moduleClassNames[accentKey];
const ALL_ENTRIES_LIMIT = 1000;

function ProjectRow({
  entry,
  taskCount,
  onPress,
  onDelete,
  muted,
}: {
  entry: Entry;
  taskCount: number;
  onPress: () => void;
  onDelete: () => void;
  muted?: boolean;
}) {
  const description = projectDescription(entry);
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-md border border-border bg-surface p-3 ${muted ? 'opacity-60' : ''}`}>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 gap-1">
          <Text className="text-sm font-medium text-ink">{projectTitle(entry)}</Text>
          {description !== '' && (
            <Text className="text-xs text-ink-muted" numberOfLines={2}>
              {description}
            </Text>
          )}
          <View className="flex-row items-center gap-2">
            <View className="rounded bg-surface-raised px-1.5 py-0.5">
              <Text className="text-xs text-ink-faint">{PROJECT_STATUS_LABELS[projectStatus(entry)]}</Text>
            </View>
            <Text className="text-xs text-ink-faint">{taskCount === 1 ? '1 task' : `${taskCount} tasks`}</Text>
          </View>
        </View>
        <Pressable onPress={onDelete} hitSlop={8}>
          <Text className="text-xs text-danger">Delete</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export function ProjectsTabView() {
  const router = useRouter();
  const { findByName, loading: modulesLoading, error: modulesError } = useModulesContext();
  const module = findByName(MODULE_NAME);

  const { entries, loading, error, refetch, create, remove } = useEntries({
    moduleId: module?.id,
    limit: ALL_ENTRIES_LIMIT,
  });

  // ProjectDetailView (a separate route, not a sibling in this render tree)
  // owns its own independent useEntries() call — edits made there (status,
  // description, tasks…) land in its own local state, not this one. Refetch
  // whenever this screen regains focus (e.g. navigating back from a
  // project's detail screen) so this list doesn't keep showing stale data.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const [formOpen, setFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [showArchived, setShowArchived] = useState(false);

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

  const allProjects = entries.filter(isProjectEntry);
  const activeProjects = allProjects.filter((p) => !isProjectArchived(p));
  const archivedProjects = allProjects.filter(isProjectArchived);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setFormError(null);
    try {
      await create({
        status: 'planning',
        payload: { kind: 'project', title: newTitle.trim(), description: newDescription.trim(), notes: '' },
      });
      setNewTitle('');
      setNewDescription('');
      setFormOpen(false);
    } catch (err) {
      setFormError((err as Error).message ?? 'Something went wrong.');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPageError(null);
    try {
      for (const task of tasksForProject(entries, deleteTarget.id)) {
        await remove(task.id);
      }
      await remove(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  return (
    <View className="flex-1 bg-background p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className={`text-xl font-semibold ${accentClasses.text}`}>Projects</Text>
        <Button accent={accentKey} onPress={() => setFormOpen(true)}>
          New project
        </Button>
      </View>
      <ErrorBanner message={error} />
      <ErrorBanner message={pageError} />
      {loading ? (
        <Spinner />
      ) : allProjects.length === 0 ? (
        <Text className="text-sm text-ink-muted">No projects yet — add one above.</Text>
      ) : (
        <FlatList
          data={activeProjects}
          keyExtractor={(entry) => String(entry.id)}
          contentContainerClassName="gap-2"
          renderItem={({ item }) => (
            <ProjectRow
              entry={item}
              taskCount={tasksForProject(entries, item.id).length}
              onPress={() => router.push(`/project/${item.id}` as Href)}
              onDelete={() => setDeleteTarget(item)}
            />
          )}
          ListEmptyComponent={<Text className="mb-2 text-sm text-ink-muted">No active projects.</Text>}
          ListFooterComponent={
            archivedProjects.length > 0 ? (
              <View className="mt-4 gap-2">
                <Pressable
                  onPress={() => setShowArchived((prev) => !prev)}
                  className="flex-row items-center gap-1 py-1">
                  <Ionicons
                    name={showArchived ? 'chevron-down-outline' : 'chevron-forward-outline'}
                    size={14}
                    color={colors.inkFaint}
                  />
                  <Text className="text-sm font-medium text-ink-muted">Archived ({archivedProjects.length})</Text>
                </Pressable>
                {showArchived && (
                  <View className="gap-2">
                    {archivedProjects.map((item) => (
                      <ProjectRow
                        key={item.id}
                        entry={item}
                        taskCount={tasksForProject(entries, item.id).length}
                        onPress={() => router.push(`/project/${item.id}` as Href)}
                        onDelete={() => setDeleteTarget(item)}
                        muted
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : null
          }
        />
      )}
      {formOpen && (
        <Modal title="New project" onClose={() => setFormOpen(false)}>
          <View className="gap-4">
            <ErrorBanner message={formError} />
            <TextField label="Title" value={newTitle} onChangeText={setNewTitle} placeholder="e.g. Everything Calendar" autoFocus />
            <TextField
              label="Short description"
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="One line about the project…"
            />
            <View className="flex-row justify-end gap-2">
              <Button variant="secondary" onPress={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button accent={accentKey} onPress={handleCreate} disabled={!newTitle.trim()}>
                Create
              </Button>
            </View>
          </View>
        </Modal>
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete project"
          message={`Delete "${projectTitle(deleteTarget)}" and its ${
            tasksForProject(entries, deleteTarget.id).length
          } task(s)?`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </View>
  );
}
