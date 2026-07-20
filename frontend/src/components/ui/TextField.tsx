import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label: string;
  className?: string;
}

export function TextField({ label, className = '', ...props }: TextFieldProps) {
  return (
    <View className="flex flex-col gap-1">
      <Text className="text-sm font-medium text-ink-muted">{label}</Text>
      <TextInput
        className={`rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink ${className}`}
        placeholderTextColor="#626B7A"
        {...props}
      />
    </View>
  );
}
