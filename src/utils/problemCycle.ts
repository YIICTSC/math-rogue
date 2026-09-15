import { storageService } from '../services/storageService';

type ProblemCycleFilter = {
  kind: string;
  values: string[];
};

export const getProblemCycleScope = (mode: string, filter?: ProblemCycleFilter | null) => {
  if (!filter) return mode;
  return `${mode}|${filter.kind}:${[...filter.values].sort().join(',')}`;
};

const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

/**
 * Selects only problems that have not been answered correctly in this unit's
 * current cycle. A cycle is reset only when every currently available problem
 * in that unit has already been answered correctly.
 */
export const selectProblemsForCycle = <T,>(
  items: T[],
  count: number,
  getScope: (item: T) => string,
  getKey: (item: T) => string,
): T[] => {
  const groups = new Map<string, Map<string, T>>();
  items.forEach((item) => {
    const scope = getScope(item);
    const key = getKey(item);
    if (!scope || !key) return;
    const group = groups.get(scope) || new Map<string, T>();
    if (!group.has(key)) group.set(key, item);
    groups.set(scope, group);
  });

  const candidates: T[] = [];
  groups.forEach((group, scope) => {
    const values = Array.from(group.entries());
    const solved = new Set(storageService.getSolvedProblemKeys(scope));
    const unsolved = values.filter(([key]) => !solved.has(key)).map(([, item]) => item);

    if (unsolved.length === 0 && values.length > 0) {
      storageService.resetProblemCycle(scope);
      candidates.push(...values.map(([, item]) => item));
    } else {
      candidates.push(...unsolved);
    }
  });

  return shuffle(candidates).slice(0, Math.max(0, count));
};
