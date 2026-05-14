import { StatusEffectKey, VFXType } from '../types';

export type StatusEffectDefinition = {
    key: StatusEffectKey;
    label: string;
    row: number;
    frames: number;
    frameMs: number;
};

export const STATUS_EFFECT_COLUMNS = 4;
export const STATUS_EFFECT_ROWS = 8;
export const STATUS_EFFECT_SHEET_PATH = 'sprites/status-vfx-sheet.png';

export const STATUS_EFFECTS: Record<StatusEffectKey, StatusEffectDefinition> = {
    block: { key: 'block', label: 'ブロック', row: 0, frames: 4, frameMs: 80 },
    heal: { key: 'heal', label: '回復', row: 1, frames: 4, frameMs: 90 },
    buff: { key: 'buff', label: 'バフ', row: 2, frames: 4, frameMs: 80 },
    strength: { key: 'strength', label: 'ムキムキ', row: 3, frames: 4, frameMs: 75 },
    debuff: { key: 'debuff', label: 'デバフ', row: 4, frames: 4, frameMs: 85 },
    weak: { key: 'weak', label: 'へろへろ', row: 5, frames: 4, frameMs: 85 },
    vulnerable: { key: 'vulnerable', label: 'びくびく', row: 6, frames: 4, frameMs: 85 },
    poison: { key: 'poison', label: 'ドクドク', row: 7, frames: 4, frameMs: 90 },
};

export const STATUS_EFFECT_LIST = Object.values(STATUS_EFFECTS);

export const getStatusEffectKeyForVfx = (type: VFXType): StatusEffectKey => {
    if (type === 'BLOCK') return 'block';
    if (type === 'HEAL') return 'heal';
    if (type === 'BUFF') return 'buff';
    if (type === 'DEBUFF') return 'debuff';
    return 'buff';
};
