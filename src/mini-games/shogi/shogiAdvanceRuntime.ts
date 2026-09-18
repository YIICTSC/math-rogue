import type { ShogiCatalogGimmickProfile, ShogiGimmickFamily } from './shogiAdvanceCatalogTypes';

export interface ShogiRuntimeVector {
  dr: number;
  dc: number;
  max?: number;
  slide?: boolean;
  jump?: boolean;
  special?: boolean;
  captureOnly?: boolean;
  moveOnly?: boolean;
}

const FAMILY_PATTERNS: Array<[ShogiGimmickFamily, RegExp]> = [
  ['BLACK_HOLE', /ブラックホール|事象の地平|事象界|特異点|暗黒重力|黒陽/],
  ['EXPLOSION', /爆発|爆風|爆破|火炎|新星|炸裂|連鎖爆|衝撃波|雷爆|隕石/],
  ['LASER', /レーザー|光線|射撃|光射|ビーム|砲撃|光弾|光壁|陽線|月光射|日砲/],
  ['WARP', /ワープ|転移|瞬間移動|空間跳躍|異次元|門を作|ポータル|星移動/],
  ['TELEPORT', /テレポート|転送|送還|入れ替え転移/],
  ['CLONE', /分身|残像|複製|コピー体|二重存在|双相|幻像/],
  ['TIME', /時間|時空|巻き戻|時龍|時錨|秒針|クロノ|タイム|時帝|時獄|時終/],
  ['FREEZE', /凍結|停止|凍時|時間停止|行動不能|移動不能|固定する|その升に固定/],
  ['GRAVITY', /重力|重圧|引力|落下|圧縮/],
  ['PULL', /引き寄せ|吸引|引寄せ|磁力|磁石|引く/],
  ['PUSH', /押し出|押出|吹き飛|弾き|後退させ|押す/],
  ['REFLECT', /反射|跳ね返|反鏡|鏡返|屈折|跳光/],
  ['TERRAIN', /地形|穴に|裂け目|封鎖升|罠|光床|光橋|氷床|炎床|壁を|結界|マスを.*(?:封鎖|変化)|ポータル.*(?:生成|作|結び|化)|門を作る|地雷門|風路|泥地|溶岩|聖域/],
  ['CHAIN', /連鎖|追撃|追加除去|二体目|次の敵|さらに.*捕獲/],
  ['REVIVE', /復活|蘇生|蘇|復帰|不死|再生|鳳種|フェニックス/],
  ['FORECAST', /未来予知|先見|予測|予知|合法手.*表示|マーキング/],
  ['SWAP', /交換|入替|位置を入れ替|位置交換|換僧|鏡換/],
  ['SILENCE', /無効化|封印|能力を使え|特殊能力.*不可|沈黙|捕獲を伴う移動ができない/],
  ['PHASE', /透過|すり抜|盤面から消え|位相|透明|幽体/],
  ['ROTATE', /回転|盤面.*回|行.*回|列.*回|90度|180度/],
  ['BARRIER', /障壁|バリア|結界|光壁|防護膜|力場|斜め方向からこの駒を捕獲できない|王の利きは妨げない/],
  ['TRANSFORM', /変身|変化|コピー|同じ移動形|移動形を.*得る|姿を変/],
];

export const deriveShogiGimmickProfile = (
  no: number,
  family: string,
  description: string,
  restriction: string,
): ShogiCatalogGimmickProfile => {
  const text = `${family} ${description} ${restriction}`;
  const families = FAMILY_PATTERNS
    .filter(([, pattern]) => pattern.test(text))
    .map(([key]) => key);
  const uniqueFamilies = Array.from(new Set(families));
  const tier: ShogiCatalogGimmickProfile['tier'] = no >= 451 ? 4 : no >= 351 ? 3 : no >= 301 ? 2 : no >= 251 ? 1 : 0;
  return { families: uniqueFamilies.length ? uniqueFamilies : ['NONE'], tier };
};

const uniqueVectors = (vectors: ShogiRuntimeVector[]): ShogiRuntimeVector[] => {
  const map = new Map<string, ShogiRuntimeVector>();
  vectors.forEach(vector => {
    const key = [vector.dr, vector.dc, vector.max || 1, vector.slide ? 1 : 0, vector.jump ? 1 : 0, vector.captureOnly ? 1 : 0, vector.moveOnly ? 1 : 0].join(':');
    map.set(key, vector);
  });
  return [...map.values()];
};

const addOrthogonal = (vectors: ShogiRuntimeVector[], distance = 1, options: Partial<ShogiRuntimeVector> = {}) => {
  vectors.push(
    { dr: -distance, dc: 0, ...options },
    { dr: distance, dc: 0, ...options },
    { dr: 0, dc: -distance, ...options },
    { dr: 0, dc: distance, ...options },
  );
};

const addDiagonal = (vectors: ShogiRuntimeVector[], distance = 1, options: Partial<ShogiRuntimeVector> = {}) => {
  vectors.push(
    { dr: -distance, dc: -distance, ...options },
    { dr: -distance, dc: distance, ...options },
    { dr: distance, dc: -distance, ...options },
    { dr: distance, dc: distance, ...options },
  );
};

const fallbackVectors = (no: number, forward: number): ShogiRuntimeVector[] => {
  switch (no % 10) {
    case 0: return [{ dr: forward, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
    case 1: return [{ dr: forward, dc: -1 }, { dr: forward, dc: 1 }, { dr: -forward, dc: 0 }];
    case 2: return [{ dr: forward * 2, dc: -1, jump: true }, { dr: forward * 2, dc: 1, jump: true }];
    case 3: return [{ dr: 0, dc: -1, max: 2, slide: true }, { dr: 0, dc: 1, max: 2, slide: true }, { dr: forward, dc: 0 }];
    case 4: return [{ dr: forward, dc: -1 }, { dr: forward, dc: 0 }, { dr: forward, dc: 1 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
    case 5: return [{ dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 }];
    case 6: return [{ dr: -1, dc: 0, max: 2, slide: true }, { dr: 1, dc: 0, max: 2, slide: true }];
    case 7: return [{ dr: -2, dc: 0, jump: true }, { dr: 2, dc: 0, jump: true }, { dr: 0, dc: -2, jump: true }, { dr: 0, dc: 2, jump: true }];
    case 8: return [{ dr: forward, dc: 0, max: 3, slide: true }, { dr: -forward, dc: -1 }, { dr: -forward, dc: 1 }];
    default: {
      const result: ShogiRuntimeVector[] = [];
      addOrthogonal(result);
      addDiagonal(result);
      return result;
    }
  }
};

/**
 * Converts the catalog's compact Japanese movement sentence into ordinary
 * vectors.  Exceptional effects (warp, laser, explosion, etc.) are added by
 * the engine separately; this function only guarantees a usable base move.
 */
export const getCatalogMovementVectors = (
  no: number,
  description: string,
  side: 'P' | 'C',
): ShogiRuntimeVector[] => {
  const f = side === 'P' ? -1 : 1;
  const movement = description.split('。')[0] || description;
  const vectors: ShogiRuntimeVector[] = [];
  const jumpText = /跳|ワープ|転移|瞬間移動/.test(movement);
  const maxMatch = movement.match(/最大([234])マス/);
  const rangeMatch = movement.match(/([234])マス(?:まで|以内)/);
  const slideMax = Number(maxMatch?.[1] || rangeMatch?.[1] || 0) || undefined;
  const longSlide = /任意距離|何マスでも|滑走|直進/.test(movement);
  const slideOptions = longSlide || slideMax ? { slide: true, max: slideMax || 5 } : {};

  if (/周囲8|8方向1|王と同じ|縦横斜め1/.test(movement)) {
    addOrthogonal(vectors);
    addDiagonal(vectors);
  }

  if (/前後左右|縦横|直交|上下左右/.test(movement)) {
    if (/2マス先|2マスちょうど|直交2|前後左右2/.test(movement) && jumpText) addOrthogonal(vectors, 2, { jump: true, special: true });
    else if (/3マス先|直交3|前後左右3/.test(movement) && jumpText) addOrthogonal(vectors, 3, { jump: true, special: true });
    else addOrthogonal(vectors, 1, slideOptions);
  }

  if (/斜め4方向|斜めへ|斜め1|斜め方向/.test(movement)) {
    if (/斜め.*2マス先|斜め2.*跳/.test(movement)) addDiagonal(vectors, 2, { jump: true, special: true });
    else addDiagonal(vectors, 1, /斜め.*(?:任意距離|滑走|最大[234]マス)/.test(movement) ? { slide: true, max: slideMax || 5 } : {});
  }

  if (/前(?:へ|方へ|方)?(?:1|1マス)/.test(movement) || /^前1/.test(movement)) vectors.push({ dr: f, dc: 0 });
  if (/後(?:へ|方へ|方)?(?:1|1マス)/.test(movement) || /後1/.test(movement)) vectors.push({ dr: -f, dc: 0 });
  if (/左右(?:へ)?1|左右1/.test(movement)) vectors.push({ dr: 0, dc: -1 }, { dr: 0, dc: 1 });
  if (/前(?:方)?斜め|斜め前/.test(movement)) vectors.push({ dr: f, dc: -1 }, { dr: f, dc: 1 });
  if (/後(?:方)?斜め|斜め後/.test(movement)) vectors.push({ dr: -f, dc: -1 }, { dr: -f, dc: 1 });

  if (/桂馬|前2\s*[＋+]\s*左右1|前方2マス.*左右1/.test(movement)) {
    vectors.push({ dr: f * 2, dc: -1, jump: true, special: true }, { dr: f * 2, dc: 1, jump: true, special: true });
  }

  const exactOrthogonalJump = movement.match(/(?:前後|左右|直交)[^。]*?([234])(?:マス)?(?:先)?へ?(?:直線)?跳/);
  if (exactOrthogonalJump) addOrthogonal(vectors, Number(exactOrthogonalJump[1]), { jump: true, special: true });

  const exactDiagonalJump = movement.match(/斜め[^。]*?([234])(?:マス)?(?:先)?へ?跳/);
  if (exactDiagonalJump) addDiagonal(vectors, Number(exactDiagonalJump[1]), { jump: true, special: true });

  if (/捕獲専用/.test(movement)) vectors.forEach(vector => { vector.captureOnly = true; });
  if (/移動専用|捕獲不可/.test(movement)) vectors.forEach(vector => { vector.moveOnly = true; });

  return uniqueVectors(vectors.length ? vectors : fallbackVectors(no, f));
};

export const isOncePerBattleCatalogEffect = (restriction: string, description: string) =>
  /1局1回|対局中1回|各局1回/.test(`${description} ${restriction}`);
