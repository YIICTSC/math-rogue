import type {Campaign,EndlessProgress,VoyageKind,VoyageRegion,VoyageSite} from './types';
export const VOYAGE_REGIONS:VoyageRegion[]=['emerald','glacier','ember','starlit'];
export const VOYAGE_REGION_NAMES:Record<VoyageRegion,string>={emerald:'翠海の群島',glacier:'白銀の海峡',ember:'灰燼の火山海',starlit:'星影の遺跡海'};
export const VOYAGE_KIND_NAMES:Record<VoyageKind,string>={island:'島の探索',coast:'沿岸上陸戦',naval:'海上遭遇戦',fortress:'海砦の攻略',ruins:'遺跡の対決',mainland:'大陸の野戦'};
export const VOYAGE_STEPS=6;
export function voyageSite(progress:Pick<EndlessProgress,'depth'>,route=0):VoyageSite{
 const depth=Math.max(1,Math.floor(progress.depth)),page=Math.floor((depth-1)/VOYAGE_STEPS),step=(depth-1)%VOYAGE_STEPS,lane=Math.max(0,Math.min(2,Math.trunc(route)||0)),region=VOYAGE_REGIONS[page%4];
 const kind:VoyageKind=lane===1?'naval':lane===0?(['island','ruins','island','mainland','ruins','island'] as const)[step]:(['coast','fortress','coast','mainland','fortress','coast'] as const)[step];
 return {id:`${page}:${step}:${lane}`,depth,page,step,route:lane,region,kind,x:[22,50,78][lane],y:90-step*16};
}
export function voyageChartSites(page:number){return Array.from({length:6},(_,step)=>[0,1,2].map(route=>voyageSite({depth:Math.max(0,page)*6+step+1},route))).flat();}
export const voyageMap=(page:number)=>`sprites/lantern-war/voyage/chart-${VOYAGE_REGIONS[Math.max(0,page)%4]}.webp`;
export const voyageBackground=(site:Pick<VoyageSite,'region'|'kind'>)=>`sprites/lantern-war/voyage/battle-${site.region}-${site.kind==='naval'?'naval':'land'}.webp`;
export function plotVoyage(s:Campaign,route:number){if(!s.endless?.active||s.phase!=='field'||![0,1,2].includes(route))return false;s.endless.route=route;s.endless.plottedDepth=s.endless.depth;return true;}
export function validVoyageSite(value:VoyageSite){return value&&Number.isSafeInteger(value.depth)&&value.depth>0&&Number.isSafeInteger(value.page)&&value.page>=0&&Number.isInteger(value.step)&&value.step>=0&&value.step<6&&[0,1,2].includes(value.route)&&VOYAGE_REGIONS.includes(value.region)&&Object.keys(VOYAGE_KIND_NAMES).includes(value.kind)&&Number.isFinite(value.x)&&value.x>=10&&value.x<=90&&Number.isFinite(value.y)&&value.y>=5&&value.y<=95&&JSON.stringify(value)===JSON.stringify({...value,...voyageSite({depth:value.depth},value.route)});}
