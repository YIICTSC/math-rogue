import type { PlacementCardKind, PlacementTcgEdition } from './placementTcgCards';
import type {
  PlacementEffectProgram,
  PlacementEffectStep,
} from './placementTcgEffectDsl';

export type PlacementUniqueProgramSpec = {
  legacyEffect: PlacementEffectProgram['legacyEffect'];
  trigger: PlacementEffectProgram['trigger'];
  resetRule: PlacementEffectProgram['resetRule'];
  steps: PlacementEffectStep[];
  identityNote: string;
  tags?: string[];
};

const stepSignature = (step: PlacementEffectStep): string => [
  step.action,
  step.target,
  step.condition,
  step.amount,
  step.action === 'BUFF_ATTACK' || step.action === 'BUFF_HEALTH' ? step.duration : 0,
].join(':');

export const definePlacementUniqueProgram = (
  cardId: string,
  edition: PlacementTcgEdition,
  kind: PlacementCardKind,
  spec: PlacementUniqueProgramSpec,
): PlacementEffectProgram => {
  const programId = cardId.replace(/^MTCG_/, '');
  const normalizedSignature = [
    kind,
    edition,
    spec.trigger,
    spec.resetRule,
    ...spec.steps.map(stepSignature),
  ].join('|');

  return {
    id: `DSL_${programId}`,
    trigger: spec.trigger,
    resetRule: spec.resetRule,
    memoryKey: `tcg:${programId}`,
    steps: spec.steps,
    legacyEffect: spec.legacyEffect,
    identityNote: spec.identityNote,
    normalizedSignature,
    tags: spec.tags || [edition, kind, spec.trigger, spec.steps[0]?.action || 'MARK'],
    edition,
    kind,
  };
};

export const defineElementaryUnitProgram = (
  cardId: string,
  spec: PlacementUniqueProgramSpec,
): PlacementEffectProgram => definePlacementUniqueProgram(cardId, 'ELEMENTARY', 'UNIT', spec);

export const defineHighSchoolUnitProgram = (
  cardId: string,
  spec: PlacementUniqueProgramSpec,
): PlacementEffectProgram => definePlacementUniqueProgram(cardId, 'HIGH_SCHOOL', 'UNIT', spec);

export const defineMagicUnitProgram = (
  cardId: string,
  spec: PlacementUniqueProgramSpec,
): PlacementEffectProgram => definePlacementUniqueProgram(cardId, 'MAGIC', 'UNIT', spec);

export const definePlacementSupportProgram = (
  cardId: string,
  edition: PlacementTcgEdition,
  spec: PlacementUniqueProgramSpec,
): PlacementEffectProgram => definePlacementUniqueProgram(cardId, edition, 'SUPPORT', spec);

export const definePlacementEventProgram = (
  cardId: string,
  edition: PlacementTcgEdition,
  spec: PlacementUniqueProgramSpec,
): PlacementEffectProgram => definePlacementUniqueProgram(cardId, edition, 'EVENT', spec);
