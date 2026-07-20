import { Text, View } from 'react-native';

interface ErrorBannerProps {
  message: string | null | undefined;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <View className="rounded-md border border-danger bg-danger-subtle px-3 py-2">
      <Text className="text-sm text-danger-fg">{message}</Text>
    </View>
  );
}
