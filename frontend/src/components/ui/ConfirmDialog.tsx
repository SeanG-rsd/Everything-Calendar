import { Text, View } from 'react-native';
import { Button } from './Button';
import { ErrorBanner } from './ErrorBanner';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <Text className="mb-4 text-sm text-slate-600">{message}</Text>
      {error && (
        <View className="mb-4">
          <ErrorBanner message={error} />
        </View>
      )}
      <View className="flex-row justify-end gap-2">
        <Button variant="secondary" onPress={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onPress={onConfirm}>
          {confirmLabel}
        </Button>
      </View>
    </Modal>
  );
}
