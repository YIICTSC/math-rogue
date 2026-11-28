import type { Pulse } from './battle';
import { assetUrl } from '../../utils/assetPaths';
import registry from './generatedBattleArt.json';
import extents from './generatedActionExtents.json';

export const BATTLE_ACTIONS = ['attack','skill','damage'] as const;
export type BattleAction = typeof BATTLE_ACTIONS[number];
type ActorAtlas={file:string;costumes:Record<string,Partial<Record<BattleAction,number>>>};
const actors=new Map(Object.entries(registry.actors) as [string,ActorAtlas][]);
const sheets = new Map<string,HTMLImageElement>();
const standing = new Map<string, HTMLImageElement>();
const verticalBounds:Readonly<Record<string,readonly (readonly number[])[]>>=extents;

export function battleActionForActor(pulses:readonly Pulse[],id:string,limit=false):BattleAction|undefined {
  if(pulses.some(p=>p.to===id&&(p.value??0)>0&&(p.art==='hit'||p.art==='status')))return 'damage';
  if(limit)return 'skill';
  const actorPulses=pulses.filter(p=>p.from===id);
  if(actorPulses.some(p=>p.art==='blade'||p.art==='critical'&&p.element==='steel'))return 'attack';
  if(actorPulses.some(p=>p.art!=='victory'&&p.art!=='hit'))return 'skill';
}

export function actionFrame(id:string,job:string,action:BattleAction):number|undefined {
  return actors.get(id)?.costumes[job]?.[action];
}

export function actionFrameBounds(id:string,index:number){
  const atlas=actors.get(id);
  if(!atlas)return;
  const bounds=verticalBounds[atlas.file]?.[index];
  if(!bounds)return;
  const [top,bottom]=bounds;
  return {top,height:bottom-top};
}

export function preloadBattleActionArt(id:string) {
  const asset=actors.get(id)?.file;
  if(!asset)return;
  const cached=sheets.get(asset);
  if(cached)return cached;
  const image=new Image();
  image.src=assetUrl(`sprites/pixel-rpg/actions/${asset}`);
  if(sheets.size>=12){
    const oldest=sheets.keys().next().value;
    if(oldest!==undefined)sheets.delete(oldest);
  }
  sheets.set(asset,image);
  return image;
}

export function drawBattleActor(c:CanvasRenderingContext2D,id:string,job:string,source:string,x:number,y:number,scale:number,action:BattleAction|undefined,progress:number,reduced:boolean) {
  const width=registry.frameWidth,height=registry.frameHeight;
  const index=action?actionFrame(id,job,action):undefined;
  const sheet=preloadBattleActionArt(id);
  const frame=index!==undefined?actionFrameBounds(id,index):undefined;
  const direct=!!frame&&sheet?.complete&&sheet.naturalWidth>0;
  let portrait=standing.get(source);
  if(!portrait){
    if(standing.size>=96)standing.delete(standing.keys().next().value!);
    portrait=new Image();
    portrait.src=source;
    standing.set(source,portrait);
  }
  if(!direct&&!(portrait.complete&&portrait.naturalWidth))return false;
  const travel=Math.sin(progress*Math.PI);
  const move=reduced?0:travel;
  const advance=action==='attack'?-15:action==='damage'?10:0;
  const lift=action==='skill'?-4:0;
  c.save();
  c.translate(Math.round(x+advance*move),Math.round(y+lift*move));
  if(!direct&&!reduced){
    // Every outfit still responds immediately while a dedicated frame is unavailable.
    const angle=action==='attack'?-.13:action==='damage'?.18:0;
    c.rotate(angle*move);
    if(action==='skill')c.scale(1+.05*move,1+.10*move);
  }
  const dh=Math.ceil(44*scale);
  if(direct){
    // Match the visible standing height rather than the height of the padded atlas cell.
    const dw=Math.ceil(dh*width/frame.height);
    c.drawImage(sheet!,index!%registry.columns*width,Math.floor(index!/registry.columns)*height+frame.top,width,frame.height,Math.round(-dw/2),-dh,dw,dh);
  }else{
    const dw=Math.ceil(dh*portrait.naturalWidth/portrait.naturalHeight);
    c.drawImage(portrait,Math.round(-dw/2),-dh,dw,dh);
  }
  c.restore();
  return true;
}
