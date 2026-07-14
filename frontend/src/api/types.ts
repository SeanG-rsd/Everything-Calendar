export interface User {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export type ModuleCategory = 'list' | 'totals';

export interface Module {
  id: number;
  user_id: number;
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
