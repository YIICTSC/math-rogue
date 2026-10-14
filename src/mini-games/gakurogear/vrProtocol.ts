import type { OnlineWorld } from './onlineEngine';
// Terrain and lessons are metadata; shared co-op patrols are sent once, not 40 times.
export function vrPacket(w:OnlineWorld,full=false){
 const {mission,lesson,...state}=w;
 const guards=(w as OnlineWorld&{guards?:unknown}).guards;
 return {type:full?'world':'state',world:{...state,...(full?{mission,lesson}:{}),players:Object.fromEntries(Object.entries(w.players).map(([id,p])=>[id,{...p,run:{...p.run,guards:[]}}])),...(guards?{guards}: {})}};
}
export function readVrWorld(packet:any,previous:OnlineWorld|null):OnlineWorld|null{
 let raw=packet?.world;
 if(packet?.delta&&previous&&raw){const players:OnlineWorld['players']={};for(const id of packet.ids??Object.keys(previous.players)){const before=previous.players[id],patch=raw.players?.[id];if(!before&&!patch)return null;players[id]={...before,...patch,run:{...before?.run,...patch?.run}};}raw={...previous,...raw,players};}
 if(!raw||!['coop','royale','bomb'].includes(raw.mode)||!raw.players||!['lobby','playing','result'].includes(raw.phase))return null;
 const mission=raw.mission??previous?.mission,lesson=raw.lesson??previous?.lesson;if(!mission||!lesson)return null;
 const w={...raw,mission,lesson} as OnlineWorld;
 if(raw.guards?.guards)for(const p of Object.values(w.players))p.run.guards=raw.guards.guards;
 return w;
}
export class VrStateEncoder {
 private fields=new Map<string,string>();
 delta(w:OnlineWorld){const source=vrPacket(w).world as any,out:any={players:{}};
  const changed=(path:string,value:unknown)=>{const key=JSON.stringify(value);if(this.fields.get(path)===key)return false;this.fields.set(path,key);return true;};
  for(const[key,value]of Object.entries(source))if(key!=='players'&&changed(key,value))out[key]=value;
  for(const[id,p]of Object.entries(source.players) as [string,any][]){const patch:any={};for(const[key,value]of Object.entries(p)){if(key==='run'){const run:any={};for(const[k,v]of Object.entries(p.run))if(changed(`${id}.run.${k}`,v))run[k]=v;if(Object.keys(run).length)patch.run=run;}else if(changed(`${id}.${key}`,value))patch[key]=value;}if(Object.keys(patch).length)out.players[id]=patch;}
  return {type:'state',delta:true,ids:Object.keys(w.players),world:out};
 }
}
