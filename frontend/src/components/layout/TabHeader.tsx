import { useAuth } from '@/auth/useAuth';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function TabHeader() {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="flex-row items-center justify-end gap-4 border-b border-slate-200 bg-white px-4 py-2">
      <Pressable onPress={logout} hitSlop={8}>
        <Text className="text-sm font-medium text-slate-900">Log out</Text>
      </Pressable>
    </View>
  );
}
