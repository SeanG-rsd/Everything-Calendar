import { Pressable, Text, type PressableProps } from 'react-native';
import type { ModuleAccentKey } from '@/theme/colors';
import { moduleClassNames } from '@/theme/moduleClassNames';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends PressableProps {
  variant?: Variant;
  /** Only meaningful with variant="primary" — tints the button with a module's accent color. */
  accent?: ModuleAccentKey;
  children: string;
  className?: string;
}

const containerVariants: Record<Variant, string> = {
  primary: 'bg-ink active:opacity-80',
  secondary: 'bg-surface border border-border active:bg-surface-raised',
  danger: 'bg-danger active:opacity-80',
};

const textVariants: Record<Variant, string> = {
  primary: 'text-on-accent',
  secondary: 'text-ink',
  danger: 'text-ink',
};

export function Button({
  variant = 'primary',
  accent,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const isAccentedPrimary = variant === 'primary' && accent;
  const containerClass = isAccentedPrimary ? moduleClassNames[accent].bg : containerVariants[variant];
  const textClass = isAccentedPrimary ? 'text-on-accent' : textVariants[variant];

  return (
    <Pressable
      disabled={disabled}
      className={`rounded-md px-3 py-2 ${containerClass} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
      {...props}>
      <Text className={`text-center text-sm font-medium ${textClass}`}>
        {children}
      </Text>
    </Pressable>
  );
}
