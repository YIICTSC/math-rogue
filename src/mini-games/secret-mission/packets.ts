import type { Actor, View } from './rules';
type Keys=keyof View;
type Motion=[id:string,x:number,z:number,face:number,presence:Actor['presence'],animation:Actor['animation'],emote:Actor['emote']|null,shield:0|1];
export type ViewPacket={type:'view';full?:View;patch?:Partial<View>;remove?:Keys[];motion?:Motion[]};
const sample=(a:Actor):Motion=>[a.id,a.x,a.z,a.face,a.presence,a.animation,a.emote??null,a.shield?1:0];

export function patchView(packet:ViewPacket,before:View|null){
  if(packet.full)return packet.full;
  if(!before||!packet.patch)return before;
  const next={...before,...packet.patch};
  for(const key of packet.remove??[])delete (next as Partial<View>)[key];
  if(packet.motion?.length){
    const positions=new Map(packet.motion.map(entry=>[entry[0],entry]));
    const apply=(a:Actor)=>{
      const move=positions.get(a.id);if(!move)return a;
      const [,x,z,face,presence,animation,emote,shield]=move;
      return {...a,x,z,face,presence,animation,emote:emote??undefined,shield:shield?true:undefined};
    };
    if(next.self)next.self=apply(next.self);
    next.actors=next.actors.map(apply);
  }
  return next;
}

/** One encoder per connection, after the authority has projected a private view. */
export class ViewEncoder {
  private prior=new Map<Keys,string>();
  private poses=new Map<string,string>();
  private initialized=false;
  encode(view:View):ViewPacket {
    const patch:Partial<View>={},remove:Keys[]=[],motion:Motion[]=[];
    const nextPoses=new Map<string,string>();
    for(const key of this.prior.keys())if(view[key]===undefined){this.prior.delete(key);remove.push(key);}
    for(const key of Object.keys(view) as Keys[]){
      if(view[key]===undefined)continue;
      if(key==='self'||key==='actors'){
        const actors=key==='self'?[view.self!]:view.actors;
        const identity=JSON.stringify(actors.map(a=>[a.id,a.name,a.avatar]));
        const changed=this.prior.get(key)!==identity;
        for(const actor of actors){
          const frame=sample(actor),serialized=JSON.stringify(frame);
          nextPoses.set(actor.id,serialized);
          if(!changed&&this.poses.get(actor.id)!==serialized)motion.push(frame);
        }
        if(changed){this.prior.set(key,identity);Object.assign(patch,{[key]:view[key]});}
        continue;
      }
      const s=JSON.stringify(view[key]);
      if(this.prior.get(key)===s)continue;
      this.prior.set(key,s);Object.assign(patch,{[key]:view[key]});
    }
    this.poses=nextPoses;
    if(!this.initialized){this.initialized=true;return {type:'view',full:view};}
    return {type:'view',patch,remove,motion:motion.length?motion:undefined};
  }
}
