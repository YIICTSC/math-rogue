import type{Campaign}from'./types';
export type Climate='default'|'snow'|'drydock'|'canal'|'marsh';
type Site={x:number;y:number;background:string;battleBackground?:string;climate:Climate;theme:number};
const site=(x:number,y:number,background:string,climate:Climate='default',theme=0):Site=>({x,y,background,climate,theme});
/** Coordinates were reviewed against the actual expedition illustration, not an abstract grid. */
export const MAIN_SITES:Site[]=[
 site(10,64,'story-ruins','default',2),site(48,64,'battle-bg-bridge'),site(30,61,'battle-bg-forest','default',1),site(78,72,'story-drydock','drydock',2),site(90,33,'story-seal','default',2),site(65,56,'battle-bg-forest','default',1),
 site(18,34,'story-snow','snow'),site(49,39,'story-canal','canal',2),site(36,49,'story-workshop','default',2),site(55,57,'story-theater','default',2),site(68,31,'battle-bg-library','default',2),site(84,41,'scenery-0','default',2),
 site(25,19,'story-marsh','marsh',1),site(47,15,'story-ruins','default',2),site(69,13,'story-skybridge','default',3),site(57,22,'battle-bg-meadow'),site(52,9,'story-ruins','default',3),site(89,9,'battle-bg-final','default',3),
];
const grounded=['battle-ruins','battle-bg-bridge','battle-bg-forest','battle-drydock','battle-seal','battle-bg-forest','battle-snow','battle-canal','battle-workshop','battle-theater','battle-bg-library','battle-bg-bridge','battle-marsh','battle-ruins','battle-bg-final','battle-bg-meadow','battle-ruins','battle-bg-final'];
MAIN_SITES.forEach((site,i)=>{site.battleBackground=grounded[i];});
export const SIDE_SITES:Site[]=[site(27,56,'battle-bg-bridge'),site(26,51,'story-workshop'),site(37,75,'battle-bg-meadow'),site(78,79,'battle-bg-harbor'),site(70,94,'story-ruins'),site(22,59,'battle-bg-forest'),site(94,68,'battle-bg-harbor'),site(29,39,'story-snow','snow'),site(59,41,'battle-bg-library','canal'),site(58,49,'battle-bg-forest'),site(36,43,'story-workshop'),site(57,30,'battle-bg-library'),site(60,65,'battle-bg-meadow'),site(24,23,'story-marsh','marsh'),site(37,16,'story-ruins'),site(47,27,'story-theater'),site(60,16,'scenery-0'),site(72,25,'story-camp')];
export const mainSite=(chapter:number)=>MAIN_SITES[Math.max(0,Math.min(17,chapter))];
export const siteForLocation=(id:string)=>id.startsWith('side-')?SIDE_SITES[Number(id.slice(5))]||MAIN_SITES[0]:mainSite(Number(id.slice(5))||0);
export function storyBackground(s:Campaign){const scene=s.storyKind==='support'?'story-camp':s.storyKind==='side'&&s.fieldQuest?siteForLocation(s.fieldQuest).background:mainSite(s.battle?.chapter??s.chapter).background;return 'sprites/lantern-war/'+scene+'.webp';}
