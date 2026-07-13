import { Text, View } from 'react-native';
import type { Entry } from '@/api/types';
import { Button } from '../ui/Button';

interface EntryListItemProps {
  entry: Entry;
  onEdit: () => void;
  onDelete: () => void;
}

export function EntryListItem({ entry, onEdit, onDelete }: EntryListItemProps) {
  const preview = JSON.stringify(entry.payload);
  return (
    <View className="rounded-md border border-slate-200 bg-white p-3">
      <View className="mb-1 flex-row items-center gap-2">
        <Text className="font-medium text-slate-900">#{entry.id}</Text>
        <View className="rounded-full bg-slate-100 px-2 py-0.5">
          <Text className="text-xs text-slate-600">{entry.status}</Text>
        </View>
      </View>
      <Text className="font-mono text-xs text-slate-500" numberOfLines={1}>
        {preview}
      </Text>
      <Text className="mt-1 text-xs text-slate-400">
        updated {new Date(entry.updated_at).toLocaleString()}
      </Text>
      <View className="mt-2 flex-row gap-2">
        <Button variant="secondary" onPress={onEdit}>
          Edit
        </Button>
        <Button variant="danger" onPress={onDelete}>
          Delete
        </Button>
      </View>
    </View>
  );
}
