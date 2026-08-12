import type { Module, TabPreference } from '@/api/types';
import { MAX_BOTTOM_NAV_TABS, TAB_DEFINITIONS, type TabDefinition } from '@/lib/tabs';

export interface ResolvedTab {
  def: TabDefinition;
  /** Unchanged module-inactive logic: hidden regardless of nav placement. */
  hidden: boolean;
  /** Preference, after the defensive MAX_BOTTOM_NAV_TABS cap below. */
  inBottomNav: boolean;
  order: number;
}

export function resolveTabs(
  preferences: TabPreference[],
  findByName: (name: string) => Module | undefined,
): ResolvedTab[] {
  const prefByKey = new Map(preferences.map((p) => [p.tab_key, p]));

  const resolved: ResolvedTab[] = TAB_DEFINITIONS.map((def) => {
    const hidden = def.governingModuleNames.every((name) => {
      const module = findByName(name);
      return module ? !module.is_active : false;
    });
    const pref = prefByKey.get(def.key);
    return {
      def,
      hidden,
      inBottomNav: pref?.in_bottom_nav ?? def.defaultInBottomNav,
      order: pref?.sort_order ?? def.defaultSortOrder,
    };
  }).sort((a, b) => a.order - b.order);

  // Defensive cap: even if stored data is somehow inconsistent, never surface
  // more than MAX_BOTTOM_NAV_TABS in the bottom nav. Rendering-only — nothing
  // is persisted here.
  let slotsUsed = 0;
  for (const tab of resolved) {
    if (!tab.inBottomNav || tab.hidden) continue;
    slotsUsed += 1;
    if (slotsUsed > MAX_BOTTOM_NAV_TABS) tab.inBottomNav = false;
  }

  return resolved;
}
