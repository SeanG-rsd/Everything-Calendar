import type { Entry } from '@/api/types';

export type ProjectStatus = 'planning' | 'ready-to-start' | 'in-progress' | 'done';

export const PROJECT_STATUSES: readonly ProjectStatus[] = ['planning', 'ready-to-start', 'in-progress', 'done'];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  'ready-to-start': 'Ready to Start',
  'in-progress': 'In Progress',
  done: 'Done',
};

function isProjectStatus(value: unknown): value is ProjectStatus {
  return typeof value === 'string' && (PROJECT_STATUSES as readonly string[]).includes(value);
}

export function isProjectEntry(entry: Entry): boolean {
  return entry.payload.kind === 'project';
}

export function isProjectTaskEntry(entry: Entry): boolean {
  return entry.payload.kind === 'task';
}

export function projectTitle(entry: Entry): string {
  return typeof entry.payload.title === 'string' ? entry.payload.title : `Project #${entry.id}`;
}

export function projectDescription(entry: Entry): string {
  return typeof entry.payload.description === 'string' ? entry.payload.description : '';
}

export function projectNotes(entry: Entry): string {
  return typeof entry.payload.notes === 'string' ? entry.payload.notes : '';
}

export function projectStartDate(entry: Entry): string | null {
  return typeof entry.payload.startDate === 'string' ? entry.payload.startDate : null;
}

export function projectEndDate(entry: Entry): string | null {
  return typeof entry.payload.endDate === 'string' ? entry.payload.endDate : null;
}

/** Falls back to 'planning' for anything unrecognized, including pre-status-feature entries
 * (which default to the generic entries.status of 'active') and the legacy example seed row. */
export function projectStatus(entry: Entry): ProjectStatus {
  return isProjectStatus(entry.status) ? entry.status : 'planning';
}

/** A project is archived once its 'done' status has survived past the calendar month it was set
 * in (see dailyReset.ts's archiveCompletedProjects) — separate from status itself so changing the
 * status away from 'done' can un-archive it (see ProjectDetailView) without losing information. */
export function isProjectArchived(entry: Entry): boolean {
  return entry.payload.archived === true;
}

export function taskDescription(entry: Entry): string {
  return typeof entry.payload.description === 'string' ? entry.payload.description : '';
}

export function tasksForProject(entries: Entry[], projectId: number): Entry[] {
  return entries.filter((entry) => isProjectTaskEntry(entry) && entry.payload.projectId === projectId);
}
