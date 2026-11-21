import { applyDelveAction } from './delve';
import { applyTownAction, declareInTown } from './life';
import { claimBadge } from './guild';
import { STAT_IDS } from './content';
import { note, type Action, type Adventure } from './state';

export function adventureTransition(state: Adventure, action: Action) {
  const next = structuredClone(state);
  let changed: boolean;
  switch (action.type) {
    case 'badge':
      changed = !next.delve?.encounter && claimBadge(next, action.id);
      break;
    case 'goal': {
      const value = action.text.trim().slice(0, 100);
      if (!value) return state;
      next.goals.push({ id: 'goal-' + state.revision, text: value, complete: false });
      changed = true;
      break;
    }
    case 'complete-goal': {
      const goal = next.goals.find((entry) => entry.id === action.id);
      if (!goal || goal.complete) return state;
      goal.complete = true;
      note(next, [`「${goal.text}」を達成した。`, `Completed your goal “${goal.text}”.`], 'good');
      changed = true;
      break;
    }
    case 'declare': {
      const statement = action.statement.trim().slice(0, 120);
      if (!statement || !STAT_IDS.includes(action.stat)) return state;
      const declaration = { ...action, statement };
      changed = next.delve ? applyDelveAction(next, declaration) : declareInTown(next, declaration);
      break;
    }
    default:
      changed =
        next.delve || action.type === 'enter'
          ? applyDelveAction(next, action)
          : applyTownAction(next, action);
  }
  if (!changed) return state;
  next.revision++;
  return next;
}
