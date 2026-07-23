import type { Priority } from '@/lib/tasks';

// Same rationale as moduleClassNames.ts: Tailwind's JIT scanner needs literal
// class-shaped substrings, so priority-derived classes must come from this
// lookup table, never string concatenation.
interface PriorityClassSet {
  text: string;
  bg: string;
  border: string;
}

export const priorityClassNames: Record<Priority, PriorityClassSet> = {
  high: {
    text: 'text-priority-high',
    bg: 'bg-priority-high-subtle',
    border: 'border-priority-high',
  },
  medium: {
    text: 'text-priority-medium',
    bg: 'bg-priority-medium-subtle',
    border: 'border-priority-medium',
  },
  low: {
    text: 'text-priority-low',
    bg: 'bg-priority-low-subtle',
    border: 'border-priority-low',
  },
};
