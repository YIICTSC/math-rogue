import { applyDelveAction } from './delve';
import type { BattleEvent } from './battleFeedback';
import { ADVANCED_IDS } from './advancedTechniques';
import { meetsTechniqueUnlock, techniqueFor } from './battleTechniques';
import { applyTownAction, declareInTown } from './life';
import { claimBadge } from './guild';
import { STAT_IDS } from './content';
import { applyExpeditionAction, observeExpedition } from './expeditions';
import { pledgeHelp } from './factions';
import { applyField } from './frontierActions';
import { FORMATIONS } from './journeyState';
import { fileHistory } from './ruinSystems';
import { finishDefeat, note, type Action, type Adventure } from './state';

export function adventureTransition(state: Adventure, action: Action, events?: BattleEvent[]) {
  if (state.fallenAt !== null) return state;
  const next = structuredClone(state);
  let changed: boolean;
  switch (action.type) {
    case 'field':
      changed = next.delve ? applyDelveAction(next, action, events) : applyField(next, action.operation);
      break;
    case 'file-history':
      changed = fileHistory(next, action.key, action.choice);
      break;
    case 'faction-favor':
      changed = !next.delve && pledgeHelp(next, action.resident);
      break;
    case 'expedition-start':
    case 'expedition-scout':
    case 'expedition-finish':
    case 'expedition-abandon':
    case 'equip-relic':
      changed = applyExpeditionAction(next, action);
      break;
    case 'formation':
      if (!Object.hasOwn(FORMATIONS, action.id) || next.journey.formation === action.id) return state;
      next.journey.formation = action.id;
      changed = true;
      break;
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
      changed = next.delve ? applyDelveAction(next, declaration, events) : declareInTown(next, declaration);
      break;
    }
    default:
      changed =
        next.delve || action.type === 'enter'
          ? applyDelveAction(next, action, events)
          : applyTownAction(next, action);
  }
  if (!changed) return state;
  finishDefeat(next);
  observeExpedition(state, next, action);
  const learned = ADVANCED_IDS.map((id) => techniqueFor(id)!).filter((tech) =>
    tech.unlock?.kind !== 'equipment' && !meetsTechniqueUnlock(state, tech) && meetsTechniqueUnlock(next, tech),
  );
  if (learned.length) note(next, [
    learned.map((tech) => tech.name[0]).join('、') + 'を習得した。',
    'You learned ' + learned.map((tech) => tech.name[1]).join(', ') + '.',
    learned.map((tech) => tech.name[2] ?? tech.name[0]).join('、') + 'を おぼえた。',
  ], 'good');
  next.revision++;
  return next;
}
