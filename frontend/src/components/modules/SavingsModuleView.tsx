import type { ApiError } from '@/api/client';
import type { Entry } from '@/api/types';
import { useEntries } from '@/hooks/useEntries';
import { useModulesContext } from '@/modules/ModulesContext';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Modal } from '../ui/Modal';
import { ProgressRing } from '../ui/ProgressRing';
import { Spinner } from '../ui/Spinner';
import { FundsAdjustmentForm } from './FundsAdjustmentForm';
import { SavingsGoalForm, type SavingsGoalValues } from './SavingsGoalForm';

const MODULE_NAME = 'Savings Goals';

function goalProgress(entry: Entry): number {
  const target = entry.payload.target;
  const current = entry.payload.current;
  if (typeof target !== 'number' || target <= 0 || typeof current !== 'number') return 0;
  return Math.max(0, Math.min(1, current / target));
}

function goalTitle(entry: Entry): string {
  return typeof entry.payload.title === 'string' ? entry.payload.title : `Goal #${entry.id}`;
}

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

export function SavingsModuleView() {
  const { findByName, loading: modulesLoading, error: modulesError } = useModulesContext();
  const module = findByName(MODULE_NAME);

  const { entries, loading, error, create, update, remove } = useEntries({ moduleId: module?.id });

  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [fundingTarget, setFundingTarget] = useState<Entry | null>(null);
  const [fundingDirection, setFundingDirection] = useState<'add' | 'subtract'>('add');
  const [fundingError, setFundingError] = useState<string | null>(null);

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
        <ErrorBanner message={modulesError ?? `"${MODULE_NAME}" module isn't set up yet.`} />
      </View>
    );
  }

  const overallProgress =
    entries.length === 0
      ? 0
      : entries.reduce((sum, entry) => sum + goalProgress(entry), 0) / entries.length;

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

  async function handleSubmit(values: SavingsGoalValues) {
    try {
      if (editingEntry) {
        await update(editingEntry.id, { payload: { ...values } });
      } else {
        await create({ payload: { ...values } });
      }
      setFormOpen(false);
    } catch (err) {
      setFormError((err as ApiError).detail);
    }
  }

  async function handleFundsAdjustment(amount: number) {
    if (!fundingTarget) return;
    const current = typeof fundingTarget.payload.current === 'number' ? fundingTarget.payload.current : 0;
    const target = typeof fundingTarget.payload.target === 'number' ? fundingTarget.payload.target : 0;
    const signedAmount = fundingDirection === 'add' ? amount : -amount;
    const next = Math.max(0, Math.min(target, current + signedAmount));
    try {
      await update(fundingTarget.id, { payload: { ...fundingTarget.payload, current: next } });
      setFundingTarget(null);
    } catch (err) {
      setFundingError((err as ApiError).detail);
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

  return (
    <View className="flex-1 bg-slate-50 p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-slate-900">Savings Goals</Text>
        <Button onPress={openCreate}>Add goal</Button>
      </View>
      <View className="mb-4 items-center">
        <ProgressRing progress={overallProgress} label="overall" />
      </View>
      <ErrorBanner message={error} />
      <ErrorBanner message={pageError} />
      {loading ? (
        <Spinner />
      ) : entries.length === 0 ? (
        <Text className="text-sm text-slate-500">No savings goals yet — add one above.</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(entry) => String(entry.id)}
          contentContainerClassName="gap-2"
          renderItem={({ item }) => {
            const target = typeof item.payload.target === 'number' ? item.payload.target : 0;
            const current = typeof item.payload.current === 'number' ? item.payload.current : 0;
            return (
              <View className="rounded-md border border-slate-200 bg-white p-3">
                <Pressable
                  onPress={() => openEdit(item)}
                  className="mb-2 flex-row items-center justify-between">
                  <Text className="font-medium text-slate-900">{goalTitle(item)}</Text>
                  <Text className="text-xs text-slate-500">
                    {formatCurrency(current)} / {formatCurrency(target)}
                  </Text>
                </Pressable>
                <View className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <View
                    className="h-2 rounded-full bg-slate-900"
                    style={{ width: `${Math.round(goalProgress(item) * 100)}%` }}
                  />
                </View>
                <View className="mt-2 flex-row items-center justify-between">
                  <View className="flex-row gap-2">
                    <Button
                      variant="secondary"
                      onPress={() => {
                        setFundingError(null);
                        setFundingDirection('add');
                        setFundingTarget(item);
                      }}>
                      Add funds
                    </Button>
                    <Button
                      variant="secondary"
                      onPress={() => {
                        setFundingError(null);
                        setFundingDirection('subtract');
                        setFundingTarget(item);
                      }}>
                      Subtract
                    </Button>
                  </View>
                  <Pressable onPress={() => setDeleteTarget(item)} hitSlop={8}>
                    <Text className="text-xs text-red-600">Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
      {formOpen && (
        <Modal title={editingEntry ? 'Edit goal' : 'Add goal'} onClose={() => setFormOpen(false)}>
          <SavingsGoalForm
            entry={editingEntry ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setFormOpen(false)}
            submitError={formError}
          />
        </Modal>
      )}
      {fundingTarget && (
        <Modal
          title={`${fundingDirection === 'add' ? 'Add' : 'Subtract'} funds — ${goalTitle(fundingTarget)}`}
          onClose={() => setFundingTarget(null)}>
          <FundsAdjustmentForm
            mode={fundingDirection}
            onSubmit={handleFundsAdjustment}
            onCancel={() => setFundingTarget(null)}
            submitError={fundingError}
          />
        </Modal>
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete goal"
          message={`Delete "${goalTitle(deleteTarget)}"?`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </View>
  );
}
