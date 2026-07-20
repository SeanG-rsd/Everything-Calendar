// NOTE: keep these hex values in sync with tailwind.config.js `theme.extend.colors`.
// tailwind.config.js is plain CommonJS loaded by the build tooling and can't import
// this TS module, so the two are intentionally duplicated. Change one, change both.

export const colors = {
  background: '#0E1116',
  surface: '#171B22',
  surfaceRaised: '#1F242D',
  border: '#2B3140',
  borderSubtle: '#232833',
  ink: '#EDEFF4',
  inkMuted: '#98A2B3',
  inkFaint: '#626B7A',
  onAccent: '#12141A',
  danger: { default: '#F2555A', subtle: '#33191C', fg: '#FFC9C9' },
} as const;

export type ModuleAccentKey = 'tasks' | 'goals' | 'health' | 'daily-goals' | 'financial';

export const moduleAccents: Record<ModuleAccentKey, { default: string; strong: string; subtle: string }> = {
  tasks: { default: '#7EB6FF', strong: '#4A90E2', subtle: '#16233A' },
  goals: { default: '#C4A7F2', strong: '#9C6ADE', subtle: '#241B36' },
  health: { default: '#FF9E7A', strong: '#F4784E', subtle: '#33221B' },
  'daily-goals': { default: '#F5D67A', strong: '#E0B94A', subtle: '#332B15' },
  financial: { default: '#8FDCA6', strong: '#4FBF77', subtle: '#17301F' },
};
