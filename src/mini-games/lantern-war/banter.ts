import type {Campaign,Line} from './types';

// Stable manuscript order, independent of UI sorting and future roster additions.
export const BANTER_CAST=[
 'aster','lyra','high-school-warrior','high-school-caretaker','high-school-assassin',
 'high-school-mage','high-school-dodgeball','high-school-bard','high-school-librarian',
 'high-school-chef','high-school-gardener','magic-akari','magic-shizuku','magic-hiyori',
 'magic-tsubasa','magic-rei','magic-madoka','magic-koharu','magic-mirai','magic-sera',
 'magic-ren','magic-soma','magic-minato','magic-riku','magic-yamato','magic-leon',
 'magic-elliot','magic-sakuya','dungeons2-lyria','dungeons2-celis','dungeons2-flora',
 'dungeons2-noctia','dungeons2-aurene','dungeons2-ignis','dungeons2-leon',
 'dungeons2-orion','dungeons2-leif','nagi','mio','sena','end-vesper','end-sable',
 'end-hikari','end-ren',
] as const;
type Raw=[number,string,string,string?];
export interface Banter{id:string;actors:[string,string];lines:Line[];}
const reactions={n:'neutral',j:'joy',c:'concern',r:'resolve'} as const;
const manuscripts=import.meta.glob<Raw[]>('./banter/*.json',{eager:true,import:'default'});
export const BANTERS:Banter[]=Object.entries(manuscripts).sort(([a],[b])=>a.localeCompare(b)).flatMap(([path,rows])=>{
 const a=Number(/(\d+)\.json$/.exec(path)![1]);
 return rows.map(([b,first,reply,moods='nn'])=>{
  const actors:[string,string]=[BANTER_CAST[a],BANTER_CAST[b]],id=actors.join('|');
  return {id,actors,lines:[first,reply].map((text,i)=>({who:actors[i],text,cast:actors,banterId:id,reaction:reactions[moods[i] as keyof typeof reactions]||'neutral'}))};
 });
});
const index=new Map(BANTERS.map(b=>[b.id,b]));
export const banterById=(id:string)=>index.get(id);
function hash(text:string,seed:number){let h=seed>>>0;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;}
/** Selection changes neither the script nor the save; previews never mark a reading. */
export function selectBanter(s:Campaign){
 const p=s.endless;if(!p?.active)return undefined;
 const deployed=new Set(s.formations.flatMap(f=>f.slots).filter((id):id is string=>!!id&&s.recruited.includes(id)));
 let eligible=BANTERS.filter(b=>b.actors.every(id=>deployed.has(id)));
 if(eligible.length>1)eligible=eligible.filter(b=>b.id!==p.banterLast);
 const seed=(p.seed^Math.imul(p.depth,2654435761)^Math.imul((p.route||0)+1,2246822519))>>>0;
 const count=(b:Banter)=>p.banterSeen?.[b.id]||0;
 eligible.sort((a,b)=>count(a)-count(b)||hash(a.id,seed)-hash(b.id,seed)||a.id.localeCompare(b.id));
 return eligible[0];
}
/** Called only when the reader advances beyond the last original line. */
export function markBanterRead(s:Campaign){
 const p=s.endless,m=s.battle?.endless;
 if(!p||!m?.banterId||m.banterRecorded||s.phase!=='story'||s.storyKind!=='intro'||s.storyIndex!==m.story.length-1||!index.has(m.banterId))return false;
 p.banterSeen??={};p.banterSeen[m.banterId]=Math.min(1_000_000_000,(p.banterSeen[m.banterId]||0)+1);
 p.banterLast=m.banterId;m.banterRecorded=true;return true;
}
export function validBanterProgress(value:unknown,last:unknown){
 if(last!==undefined&&(typeof last!=='string'||!index.has(last)))return false;
 if(value===undefined)return true;
 return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length<=BANTERS.length&&Object.entries(value).every(([id,n])=>index.has(id)&&Number.isSafeInteger(n)&&(n as number)>0&&(n as number)<=1_000_000_000);
}
export function validBanterMission(m:{story?:unknown;banterId?:unknown;banterRecorded?:unknown}){
 if(!Array.isArray(m.story))return false;
 const lines=m.story.filter(l=>l?.banterId!==undefined);
 if(m.banterId===undefined)return lines.length===0&&m.banterRecorded===undefined;
 if(typeof m.banterId!=='string'||m.banterRecorded!==undefined&&typeof m.banterRecorded!=='boolean')return false;
 const b=index.get(m.banterId);if(!b||lines.length!==2)return false;
 return lines.every((l,i)=>l.banterId===b.id&&l.who===b.actors[i]&&Array.isArray(l.cast)&&l.cast.length===2&&l.cast.every((id:string,j:number)=>id===b.actors[j]));
}
