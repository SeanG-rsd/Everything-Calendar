import type { ApiError } from '@/api/client';
import type { Entry } from '@/api/types';
import { useEntries } from '@/hooks/useEntries';
import { useModulesContext } from '@/modules/ModulesContext';
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

  const { entries, loading, error, create, update, remove } = useEntries({ moduleId: module?.id });

  const [newTitle, setNewTitle] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);

  if (modulesLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Spinner />
      </View>
    );
  }

  if (modulesError || !module) {
    return (
      <View className="flex-1 gap-4 bg-slate-50 p-4">
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
      setPageError((err as ApiError).detail);
    }
  }

  async function handleToggle(entry: Entry) {
    setPageError(null);
    try {
      await update(entry.id, { status: entry.status === 'done' ? 'active' : 'done' });
    } catch (err) {
      setPageError((err as ApiError).detail);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setPageError((err as ApiError).detail);
    }
  }

  const doneCount = entries.filter((entry) => entry.status === 'done').length;

  return (
    <View className="flex-1 bg-slate-50 p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-slate-900">{moduleName}</Text>
        <Text className="text-sm text-slate-500">
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
        <Button onPress={handleAdd} disabled={!newTitle.trim()}>
          Add
        </Button>
      </View>
      {loading ? (
        <Spinner />
      ) : entries.length === 0 ? (
        <Text className="text-sm text-slate-500">No items yet — add one above.</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(entry) => String(entry.id)}
          contentContainerClassName="gap-2"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleToggle(item)}
              className="flex-row items-center justify-between rounded-md border border-slate-200 bg-white p-3">
              <View className="flex-1 flex-row items-center gap-3">
                <View
                  className={`h-5 w-5 items-center justify-center rounded border ${
                    item.status === 'done'
                      ? 'border-slate-900 bg-slate-900'
                      : 'border-slate-300 bg-white'
                  }`}>
                  {item.status === 'done' && <Text className="text-xs text-white">✓</Text>}
                </View>
                <Text
                  className={`flex-1 text-sm ${
                    item.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'
                  }`}>
                  {entryTitle(item)}
                </Text>
              </View>
              <Pressable onPress={() => setDeleteTarget(item)} hitSlop={8}>
                <Text className="text-xs text-red-600">Delete</Text>
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
