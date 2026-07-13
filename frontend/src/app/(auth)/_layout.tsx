import { useAuth } from '@/auth/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Spinner />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/modules" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
