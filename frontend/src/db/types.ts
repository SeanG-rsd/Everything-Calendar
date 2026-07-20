import type { Entry, EntryListParams, Module, ModuleCategory } from '@/api/types';

export interface ModuleInsert {
  name: string;
  category: ModuleCategory;
  schema_definition?: Record<string, unknown>;
  is_active?: boolean;
}

export interface EntryInsert {
  module_id: number;
  status?: string;
  payload?: Record<string, unknown>;
}

export interface EntryPatch {
  status?: string;
  payload?: Record<string, unknown>;
}

export interface DataStore {
  listModules(isActive?: boolean): Promise<Module[]>;
  getModuleByName(name: string): Promise<Module | null>;
  insertModule(input: ModuleInsert): Promise<Module>;
  countEntriesForModule(moduleId: number): Promise<number>;

  listEntries(params: EntryListParams): Promise<Entry[]>;
  insertEntry(input: EntryInsert): Promise<Entry>;
  getEntry(id: number): Promise<Entry | null>;
  updateEntry(id: number, patch: EntryPatch): Promise<Entry>;
  deleteEntry(id: number): Promise<void>;
}
