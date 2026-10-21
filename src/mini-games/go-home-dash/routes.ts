import type { LanguageMode } from '../../types';

export type RouteId = 'school' | 'rooftops' | 'canal' | 'garden' | 'clockwork' | 'skyway' | 'storm';
export const OPENING_DISTANCE = 4200;
export const ROUTE_LENGTH = 5200;
const routes: RouteId[] = ['rooftops', 'canal', 'garden', 'clockwork', 'skyway', 'storm'];
const hash = (n: number) => { n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); return (n ^ (n >>> 16)) >>> 0; };
const routeBags = new Map<number, RouteId[]>();
function routeBag(seed: number) {
  const cached = routeBags.get(seed);
  if (cached) return cached;
  const bag = [...routes];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = hash(seed + i * 8191) % (i + 1);
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  if (routeBags.size >= 32) routeBags.delete(routeBags.keys().next().value!);
  routeBags.set(seed, bag);
  return bag;
}
export function routeAt(seed: number, distance: number) {
  if (distance < OPENING_DISTANCE) return { id: 'school' as RouteId, index: -1, progress: Math.max(0, distance), flight: false };
  const index = Math.floor((distance - OPENING_DISTANCE) / ROUTE_LENGTH);
  // A shuffled bag visits every route before repeating, without adjacent
  // repeats. Cache it because terrain rendering samples the same run often.
  const bag = routeBag(seed);
  const id = bag[index % bag.length];
  const progress = (distance - OPENING_DISTANCE) % ROUTE_LENGTH;
  return { id, index, progress, flight: (id === 'skyway' || id === 'storm') && progress > 650 && progress < ROUTE_LENGTH - 650 };
}

export function floorAt(seed: number, distance: number) {
  const r = routeAt(seed, distance);
  if (r.id === 'school') return 340;
  // Smooth entrances and exits prevent sudden terrain walls or drops.
  const edge = Math.min(1, r.progress / 650, (ROUTE_LENGTH - r.progress) / 650);
  const envelope = edge * edge * (3 - 2 * edge);
  const wave = (1 - Math.cos(r.progress / ROUTE_LENGTH * Math.PI * 8)) / 2;
  const height = r.id === 'rooftops' ? 40 + wave * 72 : r.id === 'canal' ? 18 + wave * 54 : r.id === 'clockwork' ? 36 + wave * 55 : r.id === 'garden' ? 12 + wave * 34 : 54 + wave * 36;
  return 340 - height * envelope;
}
export function routeCopy(id: RouteId, mode: LanguageMode, hint = false) {
  const copy: Record<RouteId, [string, string, string, string, string, string]> = {
    school: ['放課後の通学路', 'After-school avenue', 'ほうかごのつうがくろ', 'タップでジャンプ・長押しで高く', 'Tap to jump · hold to jump higher', 'タップでジャンプ・ながおしでたかく'],
    rooftops: ['夕焼けルーフトップ', 'Sunset rooftops', 'ゆうやけルーフトップ', '坂道と屋上を駆け抜けよう', 'Race over rising and falling rooftops', 'さかみちとおくじょうをかけぬけよう'],
    canal: ['水辺のスカイ橋', 'Canal skybridges', 'みずべのスカイばし', '橋の高低差と水玉スライムに注意', 'Watch the bridge slopes and water slimes', 'はしのこうていさとみずたまスライムにちゅうい'],
    garden: ['跳躍のグリーン回廊', 'Spring garden', 'ちょうやくのグリーンかいろう', '光る跳躍台で大ジャンプ', 'Bounce high from glowing spring pads', 'ひかるちょうやくだいでだいジャンプ'],
    clockwork: ['時計塔の空中回廊', 'Clocktower causeway', 'とけいとうのくうちゅうかいろう', '動く足場へ飛び乗ろう', 'Jump onto moving lift platforms', 'うごくあしばへとびのろう'],
    skyway: ['雲上グライド', 'Cloudtop glide', 'うんじょうグライド', '飛行中は長押しで上昇・離して下降', 'In flight: hold to rise · release to descend', 'ひこうちゅうはながおしでじょうしょう・はなしてかこう'],
    storm: ['星風エアレーン', 'Starlight air lanes', 'ほしかぜエアレーン', '上昇気流に乗って飛ぼう', 'Ride the updrafts through the sky', 'じょうしょうきりゅうにのってとぼう'],
  };
  const index = mode === 'ENGLISH' ? 1 : mode === 'HIRAGANA' ? 2 : 0;
  return copy[id][index + (hint ? 3 : 0)];
}
export const ROUTE_COLORS: Record<RouteId, { sky: string; glow: string; ground: string }> = {
  school: { sky: '#24163a', glow: '#ffad66', ground: '#653e45' },
  rooftops: { sky: '#472243', glow: '#ffbc80', ground: '#6e5176' },
  canal: { sky: '#163b5a', glow: '#73f3ee', ground: '#3f728c' },
  garden: { sky: '#193a45', glow: '#b5fa87', ground: '#477356' },
  clockwork: { sky: '#302851', glow: '#ffd77b', ground: '#716178' },
  skyway: { sky: '#354c83', glow: '#bceeff', ground: '#8299c1' },
  storm: { sky: '#221c55', glow: '#d0a4ff', ground: '#656492' },
};
