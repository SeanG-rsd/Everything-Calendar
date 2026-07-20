import { Alert } from 'react-native';

const g = globalThis as unknown as {
  ErrorUtils?: {
    setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
  };
};

if (g.ErrorUtils) {
  g.ErrorUtils.setGlobalHandler((error, isFatal) => {
    Alert.alert(
      isFatal ? 'Fatal startup error (diagnostic)' : 'Error (diagnostic)',
      `${error?.message ?? String(error)}\n\n${error?.stack ?? ''}`,
    );
  });
}
