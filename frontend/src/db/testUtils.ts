import type { Entry, EntryListParams, Module } from '@/api/types';

import type { DataStore, EntryInsert, EntryPatch, ModuleInsert } from './types';

/**
 * In-memory DataStore used only by tests. expo-sqlite is a native module and
 * cannot run under Jest, so this mirrors the same filter/pagination/uniqueness
 * contract as sqliteStore.ts to validate business logic (seed.ts, query params)
 * independent of the real SQLite wiring, which is verified by running the app.
 */
export function createMemoryStore(now: () => Date = () => new Date()): DataStore {
  let modules: Module[] = [];
  let entries: Entry[] = [];
  let nextModuleId = 1;
  let nextEntryId = 1;

  return {
    async listModules(isActive) {
      const rows = isActive === undefined ? modules : modules.filter((m) => m.is_active === isActive);
      return rows.slice().sort((a, b) => a.id - b.id);
    },

    async getModuleByName(name) {
      return modules.find((m) => m.name === name) ?? null;
    },

    async insertModule(input: ModuleInsert) {
      if (modules.some((m) => m.name === input.name)) {
        throw new Error(`UNIQUE constraint failed: modules.name ('${input.name}')`);
      }
      const module: Module = {
        id: nextModuleId++,
        name: input.name,
        category: input.category,
        schema_definition: input.schema_definition ?? {},
        is_active: input.is_active ?? true,
        created_at: now().toISOString(),
      };
      modules.push(module);
      return module;
    },

    async countEntriesForModule(moduleId) {
      return entries.filter((e) => e.module_id === moduleId).length;
    },

    async listEntries(params: EntryListParams) {
      let rows = entries.slice();
      if (params.module_id !== undefined) {
        rows = rows.filter((e) => e.module_id === params.module_id);
      }
      if (params.status !== undefined) {
        rows = rows.filter((e) => e.status === params.status);
      }
      rows.sort((a, b) => a.id - b.id);
      const offset = params.offset ?? 0;
      const limit = params.limit ?? 20;
      return rows.slice(offset, offset + limit);
    },

    async insertEntry(input: EntryInsert) {
      const nowIso = now().toISOString();
      const entry: Entry = {
        id: nextEntryId++,
        module_id: input.module_id,
        status: input.status ?? 'active',
        payload: input.payload ?? {},
        created_at: nowIso,
        updated_at: nowIso,
      };
      entries.push(entry);
      return entry;
    },

    async getEntry(id) {
      return entries.find((e) => e.id === id) ?? null;
    },

    async updateEntry(id, patch: EntryPatch) {
      const existing = entries.find((e) => e.id === id);
      if (!existing) throw new Error(`Entry ${id} not found`);
      const updated: Entry = {
        ...existing,
        status: patch.status ?? existing.status,
        payload: patch.payload !== undefined ? patch.payload : existing.payload,
        updated_at: now().toISOString(),
      };
      entries = entries.map((e) => (e.id === id ? updated : e));
      return updated;
    },

    async deleteEntry(id) {
      entries = entries.filter((e) => e.id !== id);
    },
  };
}
