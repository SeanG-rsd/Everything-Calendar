import type { Entry } from '@/api/types';
import { useEntries } from '@/hooks/useEntries';
import { useModulesContext } from '@/modules/ModulesContext';
import { getModuleAccentKey } from '@/theme/moduleAccent';
import { moduleClassNames } from '@/theme/moduleClassNames';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Spinner } from '../ui/Spinner';
import { TextField } from '../ui/TextField';

interface ChecklistModuleViewProps {
  moduleName: string;
}

function entryTitle(entry: Entry): string {
  return typeof entry.payload.title === 'string' ? entry.payload.title : `Entry #${entry.id}`;
}

export function ChecklistModuleView({ moduleName }: ChecklistModuleViewProps) {
  const { findByName, loading: modulesLoading, error: modulesError } = useModulesContext();
  const module = findByName(moduleName);
  const accentKey = getModuleAccentKey(moduleName);
  const accentClasses = moduleClassNames[accentKey];

  const { entries, loading, error, create, update, remove } = useEntries({ moduleId: module?.id });

  const [newTitle, setNewTitle] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);

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

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setPageError(null);
    try {
      await create({ payload: { title: newTitle.trim() } });
      setNewTitle('');
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

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setPageError((err as Error).message ?? 'Something went wrong.');
    }
  }

  const doneCount = entries.filter((entry) => entry.status === 'done').length;

  return (
    <View className="flex-1 bg-background p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className={`text-xl font-semibold ${accentClasses.text}`}>{moduleName}</Text>
        <Text className="text-sm text-ink-muted">
          {doneCount}/{entries.length} done
        </Text>
      </View>
      <ErrorBanner message={error} />
      <ErrorBanner message={pageError} />
      <View className="mb-4 flex-row items-end gap-2">
        <View className="flex-1">
          <TextField
            label=""
            placeholder="Add an item…"
            value={newTitle}
            onChangeText={setNewTitle}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
        </View>
        <Button accent={accentKey} onPress={handleAdd} disabled={!newTitle.trim()}>
          Add
        </Button>
      </View>
      {loading ? (
        <Spinner />
      ) : entries.length === 0 ? (
        <Text className="text-sm text-ink-muted">No items yet — add one above.</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(entry) => String(entry.id)}
          contentContainerClassName="gap-2"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleToggle(item)}
              className="flex-row items-center justify-between rounded-md border border-border bg-surface p-3">
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
                  {entryTitle(item)}
                </Text>
              </View>
              <Pressable onPress={() => setDeleteTarget(item)} hitSlop={8}>
                <Text className="text-xs text-danger">Delete</Text>
              </Pressable>
            </Pressable>
          )}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete item"
          message={`Delete "${entryTitle(deleteTarget)}"?`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </View>
  );
}
