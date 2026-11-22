import type { Text } from './content';
import { floorKey, hash, type Address } from './world';

type Condition = {
  name: Text;
  hint: Text;
  light: number;
  patrol: number;
  caches: number;
  rest: number;
  checks: number;
};
const NORMAL: Condition = {
  name: ['静かな回廊', 'Quiet passages', 'しずかな かいろう'],
  hint: ['灯りを絶やさずに進もう。', 'Keep the lamp lit as you explore.', 'あかりを たやさず すすもう。'],
  light: 0, patrol: 0, caches: 0, rest: 0, checks: 0,
};
export const RUIN_CONDITIONS: readonly Condition[] = [
  { ...NORMAL, name: ['風抜きの亀裂', 'Wind fissures', 'かぜぬきの きれつ'],
    hint: ['風が強く、移動で灯りを余分に消費する。', 'Drafts burn extra lamp oil on each step.', 'かぜで あかりが はやく へる。'], light: 1 },
  { ...NORMAL, name: ['財の封印区', 'The sealed treasury', 'ざいの ふういんく'],
    hint: ['宝箱から拾える遺物片が多い。', 'Chests contain additional relic shards.', 'たからばこから いぶつへんが おおく でる。'], caches: 2 },
  { ...NORMAL, name: ['湧水の静寂', 'The stillwater spring', 'ゆうすいの せいじゃく'],
    hint: ['祭壇での瞑想は体力を多く回復する。', 'Meditating at an altar restores extra HP.', 'さいだんで たいりょくが おおく かいふく。'], rest: 6 },
  { ...NORMAL, name: ['残響の見張り', 'Echoing watchposts', 'ざんきょうの みはり'],
    hint: ['音が響き、魔物が群れやすい。', 'Echoes draw additional creatures into patrols.', 'おとが ひびき、まものが むれやすい。'], patrol: 1 },
  { ...NORMAL, name: ['古い設計の階', 'Rooms of old designs', 'ふるい せっけいの かい'],
    hint: ['仕掛けの判定は難しいが、宝箱の遺物片が増える。', 'Mechanisms are harder, but chests have extra shards.', 'しかけが むずかしいが いぶつへんが ふえる。'], checks: 2, caches: 1 },
  { ...NORMAL, name: ['守り火のすみか', 'Halls of steady flame', 'まもりびの すみか'],
    hint: ['移動しても灯りの消費を抑えられる。', 'The lamp burns less oil as you move.', 'いどうしても あかりが へりにくい。'], light: -1 },
  { ...NORMAL, name: ['刻み文の展示路', 'Hall of inscriptions', 'きざみぶみの てんじろ'],
    hint: ['刻まれた図解が仕掛けの判定を助ける。', 'Carved instructions make mechanisms easier.', 'きざまれた ずかいで しかけが やさしい。'], checks: -2 },
  { ...NORMAL, name: ['炉の名残り', 'Remnants of a furnace', 'ろの なごり'],
    hint: ['風が灯りを奪うが、祭壇で体力を戻しやすい。', 'Drafts consume lamp oil, while altars restore extra HP.', 'あかりが へるが さいだんで かいふく。'], light: 1, rest: 4 },
];

export function ruinCondition(address: Address, floor: number): Condition {
  return floor <= 1 ? NORMAL : RUIN_CONDITIONS[hash(floorKey(address, floor) + '/condition') % RUIN_CONDITIONS.length];
}
