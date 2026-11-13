import bank from './battleVoiceBank.json';
import type {BattleVoiceKind} from './battleVoiceLines';

export type BattleVoiceClip={id:string;path:string;duration:number;text:string;source:string};
// Original game recordings are referenced in place; only missing reactions are synthesized.
export const crossGameBattleVoices=bank as Record<string,Partial<Record<Exclude<BattleVoiceKind,'technique'>,BattleVoiceClip>>>;
export const crossGameBattleClips=Object.values(crossGameBattleVoices).flatMap(clips=>Object.values(clips));
