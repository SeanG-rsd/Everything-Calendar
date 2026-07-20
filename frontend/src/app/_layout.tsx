import '../errorHandler';
import '../global.css';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { colors } from '@/theme/colors';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ErrorBoundary>
        <Slot />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
