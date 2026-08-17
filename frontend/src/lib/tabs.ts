import type { ModuleAccentKey } from '@/theme/colors';

export type TabKey = 'tasks' | 'goals' | 'health' | 'daily-goals' | 'financial' | 'projects' | 'weight';

export interface TabDefinition {
  key: TabKey;
  label: string;
  /** Ionicons glyph name for <VectorIcon family={Ionicons} name={...} />. */
  icon: string;
  accent: ModuleAccentKey;
  /**
   * Module names (see db/seed.ts DEFAULT_MODULES) whose combined inactivity
   * hides this tab — mirrors the isInactive() logic that used to live inline
   * in (tabs)/_layout.tsx.
   */
  governingModuleNames: string[];
  defaultInBottomNav: boolean;
  defaultSortOrder: number;
}

export const TAB_DEFINITIONS: readonly TabDefinition[] = [
  {
    key: 'tasks',
    label: 'Tasks',
    icon: 'checkbox-outline',
    accent: 'tasks',
    governingModuleNames: ['To-Dos', 'Homework'],
    defaultInBottomNav: true,
    defaultSortOrder: 0,
  },
  {
    key: 'health',
    label: 'Health',
    icon: 'heart-outline',
    accent: 'health',
    governingModuleNames: ['Daily Diet', 'Daily Workout'],
    defaultInBottomNav: true,
    defaultSortOrder: 1,
  },
  {
    key: 'daily-goals',
    label: 'Daily Goals',
    icon: 'checkmark-done-outline',
    accent: 'daily-goals',
    governingModuleNames: ['Daily Goals'],
    defaultInBottomNav: true,
    defaultSortOrder: 2,
  },
  {
    key: 'financial',
    label: 'Financial',
    icon: 'wallet-outline',
    accent: 'financial',
    governingModuleNames: ['Savings Goals'],
    defaultInBottomNav: true,
    defaultSortOrder: 3,
  },
  {
    key: 'goals',
    label: 'Goals',
    icon: 'flag-outline',
    accent: 'goals',
    governingModuleNames: ['Long-Term Goals'],
    defaultInBottomNav: false,
    defaultSortOrder: 4,
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: 'briefcase-outline',
    accent: 'projects',
    governingModuleNames: ['Projects'],
    defaultInBottomNav: false,
    defaultSortOrder: 5,
  },
  {
    key: 'weight',
    label: 'Weight',
    icon: 'trending-up-outline',
    accent: 'weight',
    governingModuleNames: ['Weight'],
    defaultInBottomNav: false,
    defaultSortOrder: 6,
  },
] as const;

export const MAX_BOTTOM_NAV_TABS = 4;
