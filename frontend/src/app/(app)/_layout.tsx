import { useAuth } from '@/auth/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { ModulesProvider } from '@/modules/ModulesContext';
import { Redirect, Slot } from 'expo-router';
import { View } from 'react-native';

export default function AppLayout() {
  const { user, isLoading } = useAuth();

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
    <ModulesProvider>
      <Slot />
    </ModulesProvider>
  );
}
