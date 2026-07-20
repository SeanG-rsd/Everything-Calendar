import type { SQLiteDatabase } from 'expo-sqlite';
import * as SQLite from 'expo-sqlite';

import type { Entry, EntryListParams, Module } from '@/api/types';

import { SCHEMA_SQL } from './schema';
import type { DataStore, EntryInsert, EntryPatch, ModuleInsert } from './types';

interface ModuleRawRow {
  id: number;
  name: string;
  category: string;
  schema_definition: string;
  is_active: number;
  created_at: string;
}

interface EntryRawRow {
  id: number;
  module_id: number;
  status: string;
  payload: string;
  created_at: string;
  updated_at: string;
}

function toModule(row: ModuleRawRow): Module {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Module['category'],
    schema_definition: JSON.parse(row.schema_definition),
    is_active: row.is_active === 1,
    created_at: row.created_at,
  };
}

function toEntry(row: EntryRawRow): Entry {
  return {
    id: row.id,
    module_id: row.module_id,
    status: row.status,
    payload: JSON.parse(row.payload),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createSqliteStore(db: SQLiteDatabase): DataStore {
  return {
    async listModules(isActive) {
      const rows =
        isActive === undefined
          ? await db.getAllAsync<ModuleRawRow>('SELECT * FROM modules ORDER BY id')
          : await db.getAllAsync<ModuleRawRow>('SELECT * FROM modules WHERE is_active = ? ORDER BY id', [
              isActive ? 1 : 0,
            ]);
      return rows.map(toModule);
    },

    async getModuleByName(name) {
      const row = await db.getFirstAsync<ModuleRawRow>('SELECT * FROM modules WHERE name = ?', [name]);
      return row ? toModule(row) : null;
    },

    async insertModule(input: ModuleInsert) {
      const createdAt = nowIso();
      const result = await db.runAsync(
        'INSERT INTO modules (name, category, schema_definition, is_active, created_at) VALUES (?, ?, ?, ?, ?)',
        [
          input.name,
          input.category,
          JSON.stringify(input.schema_definition ?? {}),
          input.is_active === false ? 0 : 1,
          createdAt,
        ],
      );
      const row = await db.getFirstAsync<ModuleRawRow>('SELECT * FROM modules WHERE id = ?', [
        result.lastInsertRowId,
      ]);
      if (!row) throw new Error('Failed to read back inserted module');
      return toModule(row);
    },

    async countEntriesForModule(moduleId) {
      const row = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM entries WHERE module_id = ?',
        [moduleId],
      );
      return row?.count ?? 0;
    },

    async listEntries(params: EntryListParams) {
      const clauses: string[] = [];
      const values: (string | number)[] = [];
      if (params.module_id !== undefined) {
        clauses.push('module_id = ?');
        values.push(params.module_id);
      }
      if (params.status !== undefined) {
        clauses.push('status = ?');
        values.push(params.status);
      }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const limit = params.limit ?? 20;
      const offset = params.offset ?? 0;
      const rows = await db.getAllAsync<EntryRawRow>(
        `SELECT * FROM entries ${where} ORDER BY id LIMIT ? OFFSET ?`,
        [...values, limit, offset],
      );
      return rows.map(toEntry);
    },

    async insertEntry(input: EntryInsert) {
      const createdAt = nowIso();
      const result = await db.runAsync(
        'INSERT INTO entries (module_id, status, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [input.module_id, input.status ?? 'active', JSON.stringify(input.payload ?? {}), createdAt, createdAt],
      );
      const row = await db.getFirstAsync<EntryRawRow>('SELECT * FROM entries WHERE id = ?', [
        result.lastInsertRowId,
      ]);
      if (!row) throw new Error('Failed to read back inserted entry');
      return toEntry(row);
    },

    async getEntry(id) {
      const row = await db.getFirstAsync<EntryRawRow>('SELECT * FROM entries WHERE id = ?', [id]);
      return row ? toEntry(row) : null;
    },

    async updateEntry(id, patch: EntryPatch) {
      const existingRow = await db.getFirstAsync<EntryRawRow>('SELECT * FROM entries WHERE id = ?', [id]);
      if (!existingRow) throw new Error(`Entry ${id} not found`);
      const status = patch.status ?? existingRow.status;
      const payload = patch.payload !== undefined ? JSON.stringify(patch.payload) : existingRow.payload;
      const updatedAt = nowIso();
      await db.runAsync('UPDATE entries SET status = ?, payload = ?, updated_at = ? WHERE id = ?', [
        status,
        payload,
        updatedAt,
        id,
      ]);
      const row = await db.getFirstAsync<EntryRawRow>('SELECT * FROM entries WHERE id = ?', [id]);
      if (!row) throw new Error('Failed to read back updated entry');
      return toEntry(row);
    },

    async deleteEntry(id) {
      await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
    },
  };
}

export async function openSqliteStore(): Promise<DataStore> {
  const db = await SQLite.openDatabaseAsync('everything-calendar.db');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(SCHEMA_SQL);
  return createSqliteStore(db);
}
