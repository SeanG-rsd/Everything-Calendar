import { useState } from 'react';
import { View } from 'react-native';
import type { Entry } from '@/api/types';
import { parseJsonSafe } from '@/lib/json';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { JsonTextArea } from '../ui/JsonTextArea';
import { TextField } from '../ui/TextField';

export interface EntryFormValues {
  status: string;
  payload: Record<string, unknown>;
}

interface EntryFormProps {
  entry?: Entry;
  onSubmit: (values: EntryFormValues) => Promise<void>;
  onCancel: () => void;
  submitError?: string | null;
}

export function EntryForm({ entry, onSubmit, onCancel, submitError }: EntryFormProps) {
  const [status, setStatus] = useState(entry?.status ?? 'active');
  const [payloadText, setPayloadText] = useState(
    entry ? JSON.stringify(entry.payload, null, 2) : '{}',
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const parsed = parseJsonSafe(payloadText);
    if (!parsed.ok) {
      setJsonError(parsed.error);
      return;
    }
    setJsonError(null);
    setSubmitting(true);
    try {
      await onSubmit({ status, payload: parsed.value });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="gap-4">
      <ErrorBanner message={submitError} />
      <TextField label="Status" value={status} onChangeText={setStatus} />
      <JsonTextArea
        label="Payload (JSON)"
        value={payloadText}
        onChange={setPayloadText}
        error={jsonError}
      />
      <View className="flex-row justify-end gap-2">
        <Button variant="secondary" onPress={onCancel}>
          Cancel
        </Button>
        <Button onPress={handleSubmit} disabled={submitting || !status.trim()}>
          {entry ? 'Save' : 'Create'}
        </Button>
      </View>
    </View>
  );
}
