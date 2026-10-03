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
// Warped climate fields keep broad regions recognizable without straight borders.
export function biomeWeights(x: number, y: number): number[] {
  const wx = x + Math.sin(y / 10) * 9 + Math.sin(y / 4 + x / 30) * 3;
  const wy = y + Math.sin(x / 15) * 7 + Math.sin(x / 6) * 2;
  const scores = BIOMES.map(b => -(((wx-b.x)/38)**2 + ((wy-b.y)/28)**2) * 3);
  const peak = Math.max(...scores);
  const weights = scores.map(score => Math.exp(score-peak));
  const total = weights.reduce((a,b)=>a+b,0);
  return weights.map(w=>w/total);
}
export function biomeAt(x: number, y: number) {
  const weights=biomeWeights(x,y);
  return BIOMES[weights.indexOf(Math.max(...weights))];
}
const surfaces=new Map<string,{color:string;shade:string;trees:number}>();
export function biomeSurface(x:number,y:number) {
  const key=`${x}:${y}`,old=surfaces.get(key);if(old)return old;
  const weights=biomeWeights(x,y);
  const blend=(field:'color'|'shade')=>'#'+[1,3,5].map(offset=>Math.round(BIOMES.reduce((v,b,i)=>v+parseInt(b[field].slice(offset,offset+2),16)*weights[i],0)).toString(16).padStart(2,'0')).join('');
  const result={color:blend('color'),shade:blend('shade'),trees:BIOMES.reduce((v,b,i)=>v+b.trees*weights[i],0)};
  if(surfaces.size<20000)surfaces.set(key,result);return result;
}
export function riverAt(x:number,y:number) {
  const main=91+Math.sin(y/12)*11+Math.sin(y/5)*2;
  const tributary=58+Math.sin(x/18)*8+Math.sin(x/7)*2;
  return Math.abs(x-main)<1.8 || (x>18&&x<170&&Math.abs(y-tributary)<1.1);
}
export function biomeBattleBackground(site: {x:number;y:number}) {
  const biome = biomeAt(site.x, site.y);
  return {id:`rpg-${biome.id}`,image:assetUrl(`sprites/rpg/${biome.id}.webp`),flavorTexts:[biome.flavor]};
}

// Small warped ponds make every habitat fishable without straight rectangular shores.
export function fishingPondAt(x:number,y:number){return BIOMES.some((b,i)=>{const px=b.x+8,py=b.y+5,dx=x-px+Math.sin(y*.7+i)*.8,dy=y-py+Math.sin(x*.6+i)*.6;return (dx/5.2)**2+(dy/3.8)**2<1;});}
