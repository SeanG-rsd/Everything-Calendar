import { ModulesProvider } from '@/modules/ModulesContext';
import { TabPreferencesProvider } from '@/tabs/TabPreferencesContext';
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <ModulesProvider>
      <TabPreferencesProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="tab-modal/[key]" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="project/[id]" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
      </TabPreferencesProvider>
    </ModulesProvider>
  );
}
