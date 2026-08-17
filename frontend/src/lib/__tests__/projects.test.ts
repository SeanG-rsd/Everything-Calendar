import type { Entry } from '@/api/types';
import {
  isProjectArchived,
  isProjectEntry,
  isProjectTaskEntry,
  projectDescription,
  projectEndDate,
  projectNotes,
  projectStartDate,
  projectStatus,
  projectTitle,
  taskDescription,
  tasksForProject,
} from '../projects';

function makeEntry(id: number, payload: Record<string, unknown>, status = 'active'): Entry {
  return {
    id,
    module_id: 1,
    status,
    payload,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('isProjectEntry / isProjectTaskEntry', () => {
  it('distinguishes project entries from task entries', () => {
    const project = makeEntry(1, { kind: 'project' });
    const task = makeEntry(2, { kind: 'task' });
    expect(isProjectEntry(project)).toBe(true);
    expect(isProjectEntry(task)).toBe(false);
    expect(isProjectTaskEntry(task)).toBe(true);
    expect(isProjectTaskEntry(project)).toBe(false);
  });
});

describe('projectTitle / projectDescription / projectNotes', () => {
  it('reads string fields and falls back sensibly', () => {
    const entry = makeEntry(1, { kind: 'project', title: 'Everything Calendar', description: 'Desc', notes: 'Note' });
    expect(projectTitle(entry)).toBe('Everything Calendar');
    expect(projectDescription(entry)).toBe('Desc');
    expect(projectNotes(entry)).toBe('Note');

    const bare = makeEntry(2, { kind: 'project' });
    expect(projectTitle(bare)).toBe('Project #2');
    expect(projectDescription(bare)).toBe('');
    expect(projectNotes(bare)).toBe('');
  });
});

describe('taskDescription', () => {
  it('reads a string description and ignores anything else', () => {
    expect(taskDescription(makeEntry(1, { description: 'Do the thing' }))).toBe('Do the thing');
    expect(taskDescription(makeEntry(2, { description: 42 }))).toBe('');
    expect(taskDescription(makeEntry(3, {}))).toBe('');
  });
});

describe('projectStatus', () => {
  it('reads each recognized status value as-is', () => {
    expect(projectStatus(makeEntry(1, {}, 'planning'))).toBe('planning');
    expect(projectStatus(makeEntry(2, {}, 'ready-to-start'))).toBe('ready-to-start');
    expect(projectStatus(makeEntry(3, {}, 'in-progress'))).toBe('in-progress');
    expect(projectStatus(makeEntry(4, {}, 'done'))).toBe('done');
  });

  it('falls back to planning for unrecognized values, including the legacy default of active', () => {
    expect(projectStatus(makeEntry(1, {}, 'active'))).toBe('planning');
    expect(projectStatus(makeEntry(2, {}, 'archived'))).toBe('planning');
  });
});

describe('projectStartDate / projectEndDate', () => {
  it('reads string fields and falls back to null', () => {
    const entry = makeEntry(1, { kind: 'project', startDate: '2026-08-01', endDate: '2026-08-31' });
    expect(projectStartDate(entry)).toBe('2026-08-01');
    expect(projectEndDate(entry)).toBe('2026-08-31');

    const bare = makeEntry(2, { kind: 'project' });
    expect(projectStartDate(bare)).toBeNull();
    expect(projectEndDate(bare)).toBeNull();
  });
});

describe('isProjectArchived', () => {
  it('is true only when payload.archived is exactly true', () => {
    expect(isProjectArchived(makeEntry(1, { archived: true }))).toBe(true);
    expect(isProjectArchived(makeEntry(2, { archived: false }))).toBe(false);
    expect(isProjectArchived(makeEntry(3, {}))).toBe(false);
  });
});

describe('tasksForProject', () => {
  it('filters task entries down to the given project id', () => {
    const entries = [
      makeEntry(1, { kind: 'project' }),
      makeEntry(2, { kind: 'task', projectId: 1, title: 'A' }),
      makeEntry(3, { kind: 'task', projectId: 2, title: 'B' }),
      makeEntry(4, { kind: 'task', projectId: 1, title: 'C' }),
    ];

    expect(tasksForProject(entries, 1).map((e) => e.id)).toEqual([2, 4]);
    expect(tasksForProject(entries, 2).map((e) => e.id)).toEqual([3]);
    expect(tasksForProject(entries, 3)).toEqual([]);
  });
});
