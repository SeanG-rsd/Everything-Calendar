import type { ApiError } from '@/api/client';
import type { Module, ModuleUpdate } from '@/api/types';
import { ModuleForm } from '@/components/modules/ModuleForm';
import { ModuleListItem } from '@/components/modules/ModuleListItem';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useModules } from '@/hooks/useModules';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';

export default function ModulesScreen() {
  const { modules, loading, error, update } = useModules();

  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [pageError, setPageError] = useState<string | null>(null);

  function openEdit(module: Module) {
    setEditingModule(module);
    setFormError(null);
  }

  async function handleSubmit(payload: ModuleUpdate) {
    if (!editingModule) return;
    try {
      await update(editingModule.id, payload);
      setEditingModule(null);
    } catch (err) {
      setFormError((err as ApiError).detail);
    }
  }

  async function handleToggleActive(module: Module) {
    setPageError(null);
    try {
      await update(module.id, { is_active: !module.is_active });
    } catch (err) {
      setPageError((err as ApiError).detail);
    }
  }

  return (
    <View className="flex-1 bg-slate-50 p-4">
      <Text className="mb-4 text-xl font-semibold text-slate-900">Modules</Text>
      <ErrorBanner message={error} />
      <ErrorBanner message={pageError} />
      {loading ? (
        <Spinner />
      ) : modules.length === 0 ? (
        <Text className="text-sm text-slate-500">No modules yet.</Text>
      ) : (
        <FlatList
          data={modules}
          keyExtractor={(module) => String(module.id)}
          contentContainerClassName="gap-2"
          renderItem={({ item }) => (
            <ModuleListItem
              module={item}
              onEdit={() => openEdit(item)}
              onToggleActive={() => handleToggleActive(item)}
            />
          )}
        />
      )}
      {editingModule && (
        <Modal title="Edit module" onClose={() => setEditingModule(null)}>
          <ModuleForm
            module={editingModule}
            onSubmit={handleSubmit}
            onCancel={() => setEditingModule(null)}
            submitError={formError}
          />
        </Modal>
      )}
    </View>
  );
}
