import type { ModuleAccentKey } from './colors';

// Tailwind's JIT scanner does a raw text scan for class-shaped substrings and never
// evaluates JS, so a dynamically built string like `bg-module-${key}` would never be
// found and that utility's CSS would silently never generate. Every accent-derived
// class must come from this lookup table, never string concatenation.
interface ModuleClassSet {
  text: string;
  bg: string;
  bgStrong: string;
  bgSubtle: string;
  border: string;
  borderStrong: string;
}

export const moduleClassNames: Record<ModuleAccentKey, ModuleClassSet> = {
  tasks: {
    text: 'text-module-tasks',
    bg: 'bg-module-tasks',
    bgStrong: 'bg-module-tasks-strong',
    bgSubtle: 'bg-module-tasks-subtle',
    border: 'border-module-tasks',
    borderStrong: 'border-module-tasks-strong',
  },
  goals: {
    text: 'text-module-goals',
    bg: 'bg-module-goals',
    bgStrong: 'bg-module-goals-strong',
    bgSubtle: 'bg-module-goals-subtle',
    border: 'border-module-goals',
    borderStrong: 'border-module-goals-strong',
  },
  health: {
    text: 'text-module-health',
    bg: 'bg-module-health',
    bgStrong: 'bg-module-health-strong',
    bgSubtle: 'bg-module-health-subtle',
    border: 'border-module-health',
    borderStrong: 'border-module-health-strong',
  },
  'daily-goals': {
    text: 'text-module-daily-goals',
    bg: 'bg-module-daily-goals',
    bgStrong: 'bg-module-daily-goals-strong',
    bgSubtle: 'bg-module-daily-goals-subtle',
    border: 'border-module-daily-goals',
    borderStrong: 'border-module-daily-goals-strong',
  },
  financial: {
    text: 'text-module-financial',
    bg: 'bg-module-financial',
    bgStrong: 'bg-module-financial-strong',
    bgSubtle: 'bg-module-financial-subtle',
    border: 'border-module-financial',
    borderStrong: 'border-module-financial-strong',
  },
};
