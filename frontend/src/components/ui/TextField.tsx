import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label: string;
  className?: string;
}

export function TextField({ label, className = '', ...props }: TextFieldProps) {
  return (
    <View className="flex flex-col gap-1">
      <Text className="text-sm font-medium text-slate-700">{label}</Text>
      <TextInput
        className={`rounded-md border border-slate-300 px-3 py-2 text-sm ${className}`}
        placeholderTextColor="#94a3b8"
        {...props}
      />
    </View>
  );
}
