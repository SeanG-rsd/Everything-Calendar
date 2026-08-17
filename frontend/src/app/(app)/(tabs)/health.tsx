import { SafeAreaScreen } from '@/components/layout/SafeAreaScreen';
import { TabContent } from '@/tabs/TabContent';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function HealthScreen() {
  const router = useRouter();
  const { action } = useLocalSearchParams<{ action?: string }>();

  // Deep links (e.g. the "Log Food" Shortcut) pass ?action=addFood to jump
  // straight into the Add-food prompt. Strip it once consumed so returning
  // to Health later in the session doesn't reopen the modal from a stale URL.
  useEffect(() => {
    if (action) router.setParams({ action: undefined });
  }, [action, router]);

  return (
    <SafeAreaScreen>
      <TabContent tabKey="health" action={action} />
    </SafeAreaScreen>
  );
}
