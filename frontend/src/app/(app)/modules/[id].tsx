import type { ApiError } from '@/api/client';
import * as modulesApi from '@/api/modules';
import type { Entry, Module } from '@/api/types';
import { EntryForm, type EntryFormValues } from '@/components/entries/EntryForm';
import { EntryListItem } from '@/components/entries/EntryListItem';
import { Pagination } from '@/components/entries/Pagination';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { TextField } from '@/components/ui/TextField';
import { useEntries } from '@/hooks/useEntries';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

const PAGE_SIZE = 20;

export default function ModuleEntriesScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Number(idParam);
  const navigation = useNavigation();

  const [module, setModule] = useState<Module | null>(null);
  const [moduleError, setModuleError] = useState<string | null>(null);

  useEffect(() => {
    modulesApi
      .getModule(id)
      .then((fetched) => {
        setModule(fetched);
        navigation.setOptions({ title: fetched.name });
      })
      .catch((err) => setModuleError((err as ApiError).detail));
  }, [id, navigation]);

  const [statusFilter, setStatusFilter] = useState('');
  const [offset, setOffset] = useState(0);

  const { entries, loading, error, create, update, remove } = useEntries({
    moduleId: id,
    status: statusFilter || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (moduleError) {
    return (
      <View className="flex-1 gap-4 bg-slate-50 p-4">
        <ErrorBanner message={moduleError} />
      </View>
    );
  }

  function openCreate() {
    setEditingEntry(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(entry: Entry) {
    setEditingEntry(entry);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit(values: EntryFormValues) {
    try {
      if (editingEntry) {
        await update(editingEntry.id, values);
      } else {
        await create(values);
      }
      setFormOpen(false);
    } catch (err) {
      setFormError((err as ApiError).detail);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteError(null);
    } catch (err) {
      setDeleteError((err as ApiError).detail);
    }
  }

  return (
    <View className="flex-1 bg-slate-50 p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-slate-900">{module?.name ?? '…'}</Text>
        <Button onPress={openCreate}>New entry</Button>
      </View>
      <View className="mb-4">
        <TextField
          label="Filter by status"
          value={statusFilter}
          onChangeText={(text) => {
            setOffset(0);
            setStatusFilter(text);
          }}
          placeholder="e.g. active"
          autoCapitalize="none"
        />
      </View>
      <ErrorBanner message={error} />
      {loading ? (
        <Spinner />
      ) : entries.length === 0 ? (
        <Text className="text-sm text-slate-500">No entries yet.</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(entry) => String(entry.id)}
          contentContainerClassName="gap-2"
          renderItem={({ item }) => (
            <EntryListItem
              entry={item}
              onEdit={() => openEdit(item)}
              onDelete={() => {
                setDeleteError(null);
                setDeleteTarget(item);
              }}
            />
          )}
        />
      )}
      <Pagination
        offset={offset}
        limit={PAGE_SIZE}
        hasMore={entries.length === PAGE_SIZE}
        onPrev={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
        onNext={() => setOffset((prev) => prev + PAGE_SIZE)}
      />
      {formOpen && (
        <Modal
          title={editingEntry ? 'Edit entry' : 'New entry'}
          onClose={() => setFormOpen(false)}>
          <EntryForm
            entry={editingEntry ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setFormOpen(false)}
            submitError={formError}
          />
        </Modal>
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete entry"
          message={`Delete entry #${deleteTarget.id}? This cannot be undone.`}
          confirmLabel="Delete"
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </View>
  );
}
