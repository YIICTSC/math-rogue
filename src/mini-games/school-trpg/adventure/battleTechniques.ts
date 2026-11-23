import type { BattleArt } from './battleFeedback';
import type { Calling, DamageType, Stat, Text, Weapon } from './content';
import { equipped, maxHp, type Adventure } from './state';

export type Maneuver =
  | 'sweep'
  | 'push'
  | 'drive'
  | 'pin'
  | 'mark'
  | 'reveal'
  | 'chain'
  | 'guard'
  | 'interrupt'
  | 'ignite'
  | 'heal'
  | 'rally';
type Technique = {
  name: Text;
  short: Text;
  hint: Text;
  cost: number;
  range: number;
  art: BattleArt;
  weapon?: Weapon;
  calling?: Calling;
  attack?: { stat: Stat; style: DamageType; power: number };
  needsKnown?: boolean;
  effects: readonly Maneuver[];
};

export const TECHNIQUES = {
  sabreSweep: {
    name: ['弧月の払い', 'Crescent sweep', 'こげつの はらい'],
    short: ['払い', 'Sweep', 'はらい'],
    hint: [
      '狙った敵を斬り、その近くにいる敵にも届く。',
      'Slash the target and hit creatures beside it.',
      'ねらった てきと、その となりの てきも きる。',
    ],
    weapon: 'sabre',
    cost: 2,
    range: 1,
    art: 'slash',
    attack: { stat: 'might', style: 'steel', power: 2 },
    effects: ['sweep'],
  },
  knifeFeint: {
    name: ['死角の小刃', 'Blindside feint', 'しかくの こば'],
    short: ['死角突き', 'Feint', 'しかくづき'],
    hint: [
      '素早く突き、相手の大技を止めて次の一撃を通しやすくする。',
      'Interrupt a heavy windup and expose the target to the next hit.',
      'おおわざを とめ、つぎの こうげきが とおりやすく なる。',
    ],
    weapon: 'knife',
    cost: 1,
    range: 1,
    art: 'thrust',
    attack: { stat: 'finesse', style: 'steel', power: 1 },
    effects: ['interrupt', 'mark'],
  },
  wandPulse: {
    name: ['星灰の脈動', 'Star-ash pulse', 'ほしはいの みゃくどう'],
    short: ['星灰弾', 'Pulse', 'ほしはいだん'],
    hint: [
      '離れた敵へ術を放ち、その弱点を明らかにする。',
      'Cast at range and reveal the target’s weakness.',
      'はなれた てきに じゅつを はなし、じゃくてんを みつける。',
    ],
    weapon: 'wand',
    cost: 2,
    range: 4,
    art: 'arcane',
    attack: { stat: 'insight', style: 'arcane', power: 2 },
    effects: ['reveal'],
  },
  hammerDrive: {
    name: ['地鳴り打ち', 'Rumbling blow', 'じなりうち'],
    short: ['地鳴り', 'Rumble', 'じなり'],
    hint: [
      '最大2マス押し出す。壁や別の敵との衝突で追加ダメージ。',
      'Push up to two tiles. Collisions with a wall or creature add damage.',
      'てきを 2マスまで おす。かべや てきに ぶつかると ダメージ。',
    ],
    weapon: 'hammer',
    cost: 3,
    range: 1,
    art: 'crush',
    attack: { stat: 'might', style: 'steel', power: 3 },
    effects: ['drive'],
  },
  pikeShove: {
    name: ['一本槍の押し出し', 'Pike shove', 'いっぽんやりの おしだし'],
    short: ['槍押し', 'Shove', 'やりおし'],
    hint: [
      '直線上の2マス先まで突ける。敵を1マス押し、後ろへの衝突を狙う。',
      'Thrust up to two tiles in a straight line and shove the target one tile.',
      'まっすぐ 2マスまで つき、てきを 1マス おす。',
    ],
    weapon: 'spear',
    cost: 2,
    range: 2,
    art: 'thrust',
    attack: { stat: 'might', style: 'wind', power: 2 },
    effects: ['push'],
  },
  bowPin: {
    name: ['縫い留めの矢', 'Pinning arrow', 'ぬいとめの や'],
    short: ['足止め矢', 'Pin', 'あしどめや'],
    hint: [
      '矢で足を止め、戦術戦闘で2手番近づけなくする。狙い撃ちで射程が延びる。',
      'Stop a foe from approaching for two turns. Marksmanship extends the range.',
      'やで てきの あしを 2ターン とめる。ねらいうちで とおくまで とどく。',
    ],
    weapon: 'bow',
    cost: 2,
    range: 4,
    art: 'arrow',
    attack: { stat: 'finesse', style: 'wind', power: 1 },
    effects: ['pin'],
  },
  staffChain: {
    name: ['月読の連雷', 'Moonreader chain lightning', 'つきよみの れんらい'],
    short: ['連雷', 'Chain', 'れんらい'],
    hint: [
      '水たまりや帯電床を伝い、近くの別の敵にも放電する。',
      'Send lightning through puddles or live conductors to hit nearby creatures.',
      'みずたまりや たいでんした ゆかを つたって、ほかの てきにも とどく。',
    ],
    weapon: 'staff',
    cost: 3,
    range: 3,
    art: 'shock',
    attack: { stat: 'insight', style: 'arcane', power: 3 },
    effects: ['chain'],
  },
  vanguardBash: {
    name: ['盾押しの構え', 'Shield bash', 'たておしの かまえ'],
    short: ['盾押し', 'Bash', 'たておし'],
    hint: [
      '敵を1マス押し出し、自分は防御の構えを取る。',
      'Push a creature one tile and guard against the response.',
      'てきを 1マス おし、ぼうぎょする。',
    ],
    calling: 'vanguard',
    cost: 2,
    range: 1,
    art: 'guard',
    attack: { stat: 'might', style: 'steel', power: 1 },
    effects: ['guard', 'push'],
  },
  scoutMark: {
    name: ['斥候の目印', 'Scout’s mark', 'せっこうの めじるし'],
    short: ['目印', 'Mark', 'めじるし'],
    hint: [
      '狙った敵の守りに隙を作る。次の主人公の攻撃が当たると追加ダメージ。',
      'Expose a creature so your next successful hit deals additional damage.',
      'てきに すきを つくり、つぎの こうげきが あたると ダメージが ふえる。',
    ],
    calling: 'scout',
    cost: 1,
    range: 4,
    art: 'wind',
    effects: ['mark'],
  },
  scholarSeal: {
    name: ['解紋の一手', 'Sealbreaker', 'かいもんの いって'],
    short: ['解紋', 'Seal', 'かいもん'],
    hint: [
      '弱点を調べた敵に有効。その敵の弱点属性で強く攻撃する。',
      'Study the target first, then strike powerfully with its own weakness.',
      'じゃくてんを みた てきに、その じゃくてんで つよく こうげき。',
    ],
    calling: 'scholar',
    cost: 3,
    range: 3,
    art: 'arcane',
    needsKnown: true,
    attack: { stat: 'insight', style: 'arcane', power: 4 },
    effects: [],
  },
  envoyDistract: {
    name: ['問いかけの間', 'Disarming question', 'といかけの ま'],
    short: ['問いかけ', 'Distract', 'といかけ'],
    hint: [
      '敵をひるませ、弱点を見抜く。交渉を有利に進められる。',
      'Stagger a creature and reveal its weakness, helping you parley.',
      'てきを ひるませ、じゃくてんを みる。こうしょうに やくだつ。',
    ],
    calling: 'envoy',
    cost: 2,
    range: 3,
    art: 'wind',
    effects: ['interrupt', 'reveal'],
  },
  artisanSpark: {
    name: ['工匠の火花', 'Gearwright spark', 'こうしょうの ひばな'],
    short: ['火花', 'Ignite', 'ひばな'],
    hint: [
      '火花を撃ち込む。敵の足元に油膜があれば引火して、地形ダメージを重ねる。',
      'Strike with sparks. An oil slick under the target catches fire and adds terrain damage.',
      'ひばなで こうげき。てきの あしもとに あぶらが あれば ひが つく。',
    ],
    calling: 'artisan',
    cost: 2,
    range: 3,
    art: 'fire',
    attack: { stat: 'insight', style: 'arcane', power: 2 },
    effects: ['ignite'],
  },
  medicAid: {
    name: ['野辺の手当て', 'Field dressing', 'のべの てあて'],
    short: ['手当て', 'Dress', 'てあて'],
    hint: [
      '自分と、最も弱った意識のある仲間の体力を回復する。',
      'Restore your HP and treat the most injured conscious ally.',
      'じぶんと、いちばん けがを している なかまを かいふく。',
    ],
    calling: 'naturalist',
    cost: 3,
    range: 0,
    art: 'heal',
    effects: ['heal'],
  },
  courierShoulder: {
    name: ['荷運びの肩当て', 'Courier’s shoulder check', 'にはこびの かたあて'],
    short: ['肩当て', 'Check', 'かたあて'],
    hint: [
      '近くの敵に体当たりし、武器に関係なく最大2マス押し出す。',
      'Shoulder a nearby creature up to two tiles with any weapon.',
      'ちかくの てきを ぶきに かかわらず 2マスまで おす。',
    ],
    calling: 'captain',
    cost: 2,
    range: 1,
    art: 'crush',
    attack: { stat: 'might', style: 'steel', power: 0 },
    effects: ['drive'],
  },
  bardRally: {
    name: ['灯街の合奏', 'Lantern rally', 'とうがいの がっそう'],
    short: ['合奏', 'Rally', 'がっそう'],
    hint: [
      '集中を回復して連携を2増やす。「崩しの一撃」の準備に使える。',
      'Restore Focus and add two combo. Use it to prepare a Break guard attack.',
      'しゅうちゅうを かいふくし、れんけいを 2ふやす。くずしの いちげきに つなげる。',
    ],
    calling: 'bard',
    cost: 1,
    range: 0,
    art: 'heal',
    effects: ['rally'],
  },
} satisfies Record<string, Technique>;

export type TechniqueId = keyof typeof TECHNIQUES;

export function techniqueFor(move: string): Technique | undefined {
  return Object.hasOwn(TECHNIQUES, move) ? TECHNIQUES[move as TechniqueId] : undefined;
}

export function loadoutTechniques(s: Adventure) {
  const weapon = equipped(s, 'weapon')?.weapon;
  return (Object.keys(TECHNIQUES) as TechniqueId[]).filter((move) => {
    const tech: Technique = TECHNIQUES[move];
    return tech.weapon ? tech.weapon === weapon : tech.calling === s.character.calling;
  });
}

export function techniqueReady(s: Adventure, move: TechniqueId, target: number) {
  const tech = techniqueFor(move)!;
  const battle = s.delve?.encounter;
  return Boolean(
    battle &&
      s.focus >= tech.cost &&
      loadoutTechniques(s).includes(move) &&
      (!tech.needsKnown || battle.enemies[target]?.known) &&
      (move !== 'medicAid' ||
        s.hp < maxHp(s) ||
        battle.allies?.some((ally) => ally.hp > 0 && ally.hp < ally.max)),
  );
}
