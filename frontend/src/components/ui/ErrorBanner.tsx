import { Text, View } from 'react-native';

interface ErrorBannerProps {
  message: string | null | undefined;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <View className="rounded-md border border-red-300 bg-red-50 px-3 py-2">
      <Text className="text-sm text-red-800">{message}</Text>
    </View>
  );
}
