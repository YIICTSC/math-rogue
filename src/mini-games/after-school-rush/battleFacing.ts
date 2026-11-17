import type {CastId} from './direction';
/** Reviewed attack sheets: normalize their authored direction before gameplay mirroring. */
export const ATTACK_NATIVE_FACING:Record<CastId,1|-1>={
 'high-school-warrior':-1,'high-school-caretaker':-1,'high-school-assassin':1,'high-school-mage':-1,
 'high-school-dodgeball':-1,'high-school-bard':1,'high-school-librarian':1,'high-school-chef':-1,
 'high-school-gardener':-1,'magic-akari':-1,'magic-shizuku':-1,'magic-koharu':1,
};
