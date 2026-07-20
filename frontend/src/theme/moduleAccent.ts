import type { ModuleAccentKey } from './colors';

// Maps DB module names (see db/seed.ts DEFAULT_MODULES) to the tab/accent identity
// they belong to. Tasks and Health each host two DB modules via SegmentedModulesView
// but share one accent since they share one tab.
const MODULE_NAME_TO_ACCENT: Record<string, ModuleAccentKey> = {
  'To-Dos': 'tasks',
  Homework: 'tasks',
  'Long-Term Goals': 'goals',
  'Daily Diet': 'health',
  'Daily Workout': 'health',
  'Daily Goals': 'daily-goals',
  'Savings Goals': 'financial',
};

export function getModuleAccentKey(moduleName: string): ModuleAccentKey {
  return MODULE_NAME_TO_ACCENT[moduleName] ?? 'tasks';
}
