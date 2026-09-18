export interface ShogiAdvanceCatalogEntry {
  no: number;
  kind: string;
  name: string;
  glyph: string;
  family: string;
  description: string;
  restriction: string;
}

export type ShogiGimmickFamily =
  | 'NONE'
  | 'EXPLOSION'
  | 'WARP'
  | 'LASER'
  | 'CLONE'
  | 'TIME'
  | 'GRAVITY'
  | 'PULL'
  | 'PUSH'
  | 'REFLECT'
  | 'TERRAIN'
  | 'CHAIN'
  | 'REVIVE'
  | 'FORECAST'
  | 'SWAP'
  | 'SILENCE'
  | 'PHASE'
  | 'ROTATE'
  | 'BLACK_HOLE'
  | 'TELEPORT'
  | 'FREEZE'
  | 'BARRIER'
  | 'TRANSFORM';

export interface ShogiCatalogGimmickProfile {
  families: ShogiGimmickFamily[];
  tier: 0 | 1 | 2 | 3 | 4;
}
