export type ModuleCategory = 'list' | 'totals';

export interface Module {
  id: number;
  name: string;
  category: ModuleCategory;
  schema_definition: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface Entry {
  id: number;
  module_id: number;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EntryCreate {
  module_id: number;
  status?: string;
  payload?: Record<string, unknown>;
}

export interface EntryUpdate {
  status?: string;
  payload?: Record<string, unknown>;
}

export interface EntryListParams {
  module_id?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export type TabKey = 'tasks' | 'goals' | 'health' | 'daily-goals' | 'financial';

export interface TabPreference {
  tab_key: TabKey;
  in_bottom_nav: boolean;
  sort_order: number;
  updated_at: string;
}

export interface TabPreferenceUpsert {
  tab_key: TabKey;
  in_bottom_nav: boolean;
  sort_order: number;
}
