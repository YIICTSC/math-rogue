import {assetUrl} from '../../utils/assetPaths';
export const BOMB_ICON_PATH=assetUrl('sprites/gakuro-vr/bomb-upgrades-v1.webp');
export const BOMB_ICON_ORDER=['flame','remote','kick','speed','capacity'] as const;
export const BOMB_ICON_NAMES={flame:['炎の強化','Blast range'],remote:['リモート起爆','Remote bombs'],kick:['爆弾キック','Bomb kick'],speed:['移動速度','Move speed'],capacity:['同時設置数','Bomb capacity']} as const;
