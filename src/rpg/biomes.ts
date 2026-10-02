import { assetUrl } from '../utils/assetPaths';
export const BIOMES = [
  { id: 'meadow', name: '木漏れ日の草原', color: '#799c60', shade: '#6b8d53', trees: .08, x: 30, y: 64, flavor: '風車の音と草の香り。旅人たちの道がここで交わる。' },
  { id: 'forest', name: 'ささやきの森', color: '#37664e', shade: '#305842', trees: .38, x: 30, y: 20, flavor: '枝葉の隙間に、小さな道しるべが光っている。' },
  { id: 'wetland', name: '鏡水の湿原', color: '#528e8b', shade: '#457b7c', trees: .12, x: 94, y: 64, flavor: '水面に映る空が揺れ、葦の奥から歌声が聞こえる。' },
  { id: 'desert', name: '琥珀の砂丘', color: '#c2a066', shade: '#ad8b56', trees: .03, x: 94, y: 20, flavor: '砂に埋もれた石柱が、忘れられた道を指している。' },
  { id: 'snow', name: '星霜の高原', color: '#c4dbe0', shade: '#acc6d0', trees: .08, x: 158, y: 64, flavor: '雪の足跡の先に、消えかけた灯がまたたく。' },
  { id: 'ruins', name: '暁の古代遺跡', color: '#827b99', shade: '#6d6984', trees: .04, x: 158, y: 20, flavor: '止まった時計と石の回廊。古い約束が目を覚ます。' },
] as const;
export type BiomeId = typeof BIOMES[number]['id'];
export function biomeAt(x: number, y: number) {
  return BIOMES[x < 64 ? (y < 44 ? 1 : 0) : x < 128 ? (y < 44 ? 3 : 2) : (y < 44 ? 5 : 4)];
}
export function biomeBattleBackground(site: {x:number;y:number}) {
  const biome = biomeAt(site.x, site.y);
  return {id:`rpg-${biome.id}`,image:assetUrl(`sprites/rpg/${biome.id}.svg`),flavorTexts:[biome.flavor]};
}
