import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import type { Module, ModuleCategory, ModuleUpdate } from '@/api/types';
import { parseJsonSafe } from '@/lib/json';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { JsonTextArea } from '../ui/JsonTextArea';
import { TextField } from '../ui/TextField';

interface ModuleFormProps {
  module: Module;
  onSubmit: (payload: ModuleUpdate) => Promise<void>;
  onCancel: () => void;
  submitError?: string | null;
}

export function ModuleForm({ module, onSubmit, onCancel, submitError }: ModuleFormProps) {
  const [name, setName] = useState(module.name);
  const [category, setCategory] = useState<ModuleCategory>(module.category);
  const [schemaText, setSchemaText] = useState(
    JSON.stringify(module.schema_definition, null, 2),
  );
  const [isActive, setIsActive] = useState(module.is_active);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const parsed = parseJsonSafe(schemaText);
    if (!parsed.ok) {
      setJsonError(parsed.error);
      return;
    }
    setJsonError(null);
    setSubmitting(true);
    try {
      await onSubmit({ name, category, schema_definition: parsed.value, is_active: isActive });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="gap-4">
      <ErrorBanner message={submitError} />
      <TextField label="Name" value={name} onChangeText={setName} />
      <View className="gap-1">
        <Text className="text-sm font-medium text-slate-700">Category</Text>
        <View className="flex-row gap-2">
          <Button
            variant={category === 'list' ? 'primary' : 'secondary'}
            onPress={() => setCategory('list')}>
            List
          </Button>
          <Button
            variant={category === 'totals' ? 'primary' : 'secondary'}
            onPress={() => setCategory('totals')}>
            Totals
          </Button>
        </View>
      </View>
      <JsonTextArea
        label="Schema definition (JSON)"
        value={schemaText}
        onChange={setSchemaText}
        error={jsonError}
      />
      <View className="flex-row items-center gap-2">
        <Switch value={isActive} onValueChange={setIsActive} />
        <Text className="text-sm text-slate-700">Active</Text>
      </View>
      <View className="flex-row justify-end gap-2">
        <Button variant="secondary" onPress={onCancel}>
          Cancel
        </Button>
        <Button onPress={handleSubmit} disabled={submitting || !name.trim()}>
          Save
        </Button>
      </View>
    </View>
  );
}
