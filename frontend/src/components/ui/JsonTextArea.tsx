import { Text, TextInput, View } from 'react-native';

interface JsonTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

export function JsonTextArea({ label, value, onChange, error }: JsonTextAreaProps) {
  return (
    <View className="flex flex-col gap-1">
      <Text className="text-sm font-medium text-slate-700">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline
        numberOfLines={6}
        autoCapitalize="none"
        autoCorrect={false}
        textAlignVertical="top"
        className="min-h-32 rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
      />
      {error && <Text className="text-sm text-red-600">{error}</Text>}
    </View>
  );
}
