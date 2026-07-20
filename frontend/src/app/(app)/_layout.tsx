import { ModulesProvider } from '@/modules/ModulesContext';
import { Slot } from 'expo-router';

export default function AppLayout() {
  return (
    <ModulesProvider>
      <Slot />
    </ModulesProvider>
  );
}
