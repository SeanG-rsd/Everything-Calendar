import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import type { Module } from '@/api/types';
import { Button } from '../ui/Button';

interface ModuleListItemProps {
  module: Module;
  onEdit: () => void;
  onToggleActive: () => void;
}

export function ModuleListItem({ module, onEdit, onToggleActive }: ModuleListItemProps) {
  return (
    <View className="rounded-md border border-slate-200 bg-white p-3">
      <View className="mb-2 flex-row items-center gap-2">
        <Link href={`/modules/${module.id}`} className="font-medium text-slate-900">
          {module.name}
        </Link>
        <View
          className={`rounded-full px-2 py-0.5 ${
            module.is_active ? 'bg-green-100' : 'bg-slate-100'
          }`}>
          <Text className={`text-xs ${module.is_active ? 'text-green-800' : 'text-slate-600'}`}>
            {module.is_active ? 'active' : 'inactive'}
          </Text>
        </View>
        <View
          className={`rounded-full px-2 py-0.5 ${
            module.category === 'totals' ? 'bg-blue-100' : 'bg-slate-100'
          }`}>
          <Text
            className={`text-xs ${
              module.category === 'totals' ? 'text-blue-800' : 'text-slate-600'
            }`}>
            {module.category}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <Button variant="secondary" onPress={onToggleActive}>
          {module.is_active ? 'Deactivate' : 'Activate'}
        </Button>
        <Button variant="secondary" onPress={onEdit}>
          Edit
        </Button>
      </View>
    </View>
  );
}
