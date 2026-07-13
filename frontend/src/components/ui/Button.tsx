import { Pressable, Text, type PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends PressableProps {
  variant?: Variant;
  children: string;
  className?: string;
}

const containerVariants: Record<Variant, string> = {
  primary: 'bg-slate-900 active:bg-slate-700',
  secondary: 'bg-white border border-slate-300 active:bg-slate-50',
  danger: 'bg-red-600 active:bg-red-500',
};

const textVariants: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-slate-900',
  danger: 'text-white',
};

export function Button({
  variant = 'primary',
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      className={`rounded-md px-3 py-2 ${containerVariants[variant]} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
      {...props}>
      <Text className={`text-center text-sm font-medium ${textVariants[variant]}`}>
        {children}
      </Text>
    </Pressable>
  );
}
