import type { ModuleAccentKey } from './colors';

// Maps DB module names (see db/seed.ts DEFAULT_MODULES) to the accent each one is
// themed with. Tasks' two modules (To-Dos/Homework) share the 'tasks' accent since
// they're just two lists in one tab; Health's three (Diet/Water/Workout) each get
// their own accent instead, matching their own third of the weekly bar (see
// components/ui/WeeklyHealthBar.tsx) — SegmentedModulesView colors each pill to match.
const MODULE_NAME_TO_ACCENT: Record<string, ModuleAccentKey> = {
  'To-Dos': 'tasks',
  Homework: 'tasks',
  'Long-Term Goals': 'goals',
  'Daily Diet': 'diet',
  Water: 'water',
  'Daily Workout': 'workout',
  'Daily Goals': 'daily-goals',
  'Savings Goals': 'financial',
};

export function getModuleAccentKey(moduleName: string): ModuleAccentKey {
  return MODULE_NAME_TO_ACCENT[moduleName] ?? 'tasks';
}
