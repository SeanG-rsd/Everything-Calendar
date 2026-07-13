import { useAuth } from '@/auth/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { Redirect, Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function AppLayout() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Spinner />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerRight: () => (
          <Pressable onPress={logout} hitSlop={8}>
            <Text className="text-sm font-medium text-slate-900">Log out</Text>
          </Pressable>
        ),
      }}>
      <Stack.Screen name="modules/index" options={{ title: 'Modules' }} />
      <Stack.Screen name="modules/[id]" options={{ title: 'Entries' }} />
    </Stack>
  );
}
