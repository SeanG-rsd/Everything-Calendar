import type { ModuleCategory } from '@/api/types';

import type { DataStore } from './types';

const DEFAULT_MODULES: readonly (readonly [string, ModuleCategory])[] = [
  ['To-Dos', 'list'],
  ['Homework', 'list'],
  ['Long-Term Goals', 'list'],
  ['Daily Diet', 'totals'],
  ['Daily Goals', 'totals'],
  ['Daily Workout', 'totals'],
  ['Savings Goals', 'totals'],
];

interface SeedEntry {
  status: string;
  payload: Record<string, unknown>;
}

const DEFAULT_ENTRIES: Readonly<Record<string, readonly SeedEntry[]>> = {
  'To-Dos': [
    { status: 'active', payload: { title: 'Buy groceries' } },
    { status: 'done', payload: { title: 'Reply to emails' } },
    { status: 'active', payload: { title: 'Walk the dog' } },
  ],
  Homework: [
    { status: 'active', payload: { title: 'Finish math worksheet' } },
    { status: 'active', payload: { title: 'Read chapter 4' } },
    { status: 'done', payload: { title: 'Submit lab report' } },
  ],
  'Long-Term Goals': [
    { status: 'active', payload: { title: 'Learn to play guitar' } },
    { status: 'active', payload: { title: 'Run a half marathon' } },
  ],
  'Daily Diet': [
    { status: 'active', payload: { name: 'Banana', calories: 105 } },
    { status: 'active', payload: { name: 'Grilled chicken breast', calories: 231 } },
    { status: 'active', payload: { calories: 350 } },
  ],
  'Daily Goals': [
    { status: 'active', payload: { title: 'Read 20 pages', target: 20, current: 20, unit: 'pages' } },
    { status: 'active', payload: { title: 'Meditate', target: 10, current: 5, unit: 'min' } },
    { status: 'active', payload: { title: 'Drink water', target: 8, current: 6, unit: 'cups' } },
  ],
  'Daily Workout': [
    { status: 'active', payload: { kind: 'template', day: 'Push', title: 'Bench Press', targetSets: 3, targetReps: 8 } },
    { status: 'active', payload: { kind: 'template', day: 'Push', title: 'Overhead Press', targetSets: 3, targetReps: 8 } },
    {
      status: 'active',
      payload: { kind: 'template', day: 'Push', title: 'Triceps Pushdown', targetSets: 3, targetReps: 12 },
    },
    { status: 'active', payload: { kind: 'template', day: 'Pull', title: 'Deadlift', targetSets: 3, targetReps: 5 } },
    { status: 'active', payload: { kind: 'template', day: 'Pull', title: 'Pull-ups', targetSets: 3, targetReps: 8 } },
    { status: 'active', payload: { kind: 'template', day: 'Pull', title: 'Barbell Row', targetSets: 3, targetReps: 8 } },
    { status: 'active', payload: { kind: 'template', day: 'Legs', title: 'Squat', targetSets: 3, targetReps: 5 } },
    { status: 'active', payload: { kind: 'template', day: 'Legs', title: 'Leg Press', targetSets: 3, targetReps: 10 } },
    { status: 'active', payload: { kind: 'template', day: 'Legs', title: 'Calf Raise', targetSets: 3, targetReps: 15 } },
  ],
  'Savings Goals': [
    { status: 'active', payload: { title: 'Emergency Fund', target: 5000, current: 1200 } },
    { status: 'active', payload: { title: 'New Laptop', target: 1500, current: 600 } },
    { status: 'active', payload: { title: 'Vacation', target: 3000, current: 450 } },
  ],
};

export async function ensureDefaultModules(store: DataStore): Promise<void> {
  const existingNames = new Set((await store.listModules()).map((module) => module.name));

  for (const [name, category] of DEFAULT_MODULES) {
    if (existingNames.has(name)) continue;

    // Only newly-created modules get seed entries — once a module exists, its
    // entries are the user's, so this must not re-add them after the user
    // deletes them all (this runs on every app launch, not just first launch).
    const module = await store.insertModule({ name, category, schema_definition: {} });
    for (const seed of DEFAULT_ENTRIES[name] ?? []) {
      await store.insertEntry({ module_id: module.id, status: seed.status, payload: seed.payload });
    }
  }
}
