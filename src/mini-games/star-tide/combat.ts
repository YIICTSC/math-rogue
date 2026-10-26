/** Both face buttons equip the same eight weapons. Timing is in simulation seconds. */
export const WALK_SPEED = 3.8;
export const COMBO_GRACE = .28;
export type WeaponStyle = 'blade' | 'ranged' | 'heavy' | 'guard' | 'thrust';
export const WEAPON_ACTIONS: { style: WeaponStyle; durations: number[]; reach: number; damage: number; moves: readonly (readonly [string, string])[] }[] = [
  { style:'blade', durations:[.30,.32,.40], reach:1.7, damage:2, moves:[['潮斬り','Tide slash'],['返し波','Returning wave'],['星穿ち','Star pierce']] },
  { style:'ranged', durations:[.36,.36,.46], reach:0, damage:3, moves:[['環投げ','Ring cast'],['返し環','Return cast'],['双潮環','Twin tide rings']] },
  { style:'ranged', durations:[.34,.34,.44], reach:0, damage:3, moves:[['灯火弾','Lantern bolt'],['追い火','Following flame'],['三灯火','Triple lantern']] },
  { style:'thrust', durations:[.36,.36,.44], reach:2.2, damage:2, moves:[['鉤突き','Hook jab'],['引き潮','Undertow'],['風渡り','Wind crossing']] },
  { style:'heavy', durations:[.46,.48,.58], reach:1.9, damage:3, moves:[['岩打ち','Stone strike'],['地返し','Earth turn'],['砕星落とし','Falling star hammer']] },
  { style:'ranged', durations:[.34,.34,.44], reach:0, damage:3, moves:[['星矢','Star arrow'],['継ぎ矢','Following arrow'],['三日月射ち','Crescent volley']] },
  { style:'guard', durations:[.38,.38,.48], reach:1.3, damage:1, moves:[['月受け','Moon guard'],['鏡押し','Mirror bash'],['月輪返し','Moonwheel counter']] },
  { style:'thrust', durations:[.32,.34,.44], reach:2.6, damage:2, moves:[['暁突き','Dawn thrust'],['薙ぎ光','Sweeping light'],['一番星','First star']] },
];
export const weaponAction = (weapon: number) => WEAPON_ACTIONS[weapon] ?? WEAPON_ACTIONS[0];
