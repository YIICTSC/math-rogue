import catalog from './voiceCatalog.json';
import {JOURNEY_TALKS, ROOM_TALKS} from './quests';

export const ACTOR_NAMES:Record<string,readonly [string,string]>={nagi:['ナギ','Nagi'],towa:['トワ','Towa'],mio:['ミオ','Mio'],sena:['セナ','Sena'],luca:['ルカ','Luca'],yui:['ユイ','Yui'],or:['オル','Or'],rito:['リト','Rito'],ema:['エマ','Ema'],other:['もう一人の航海士','The other navigator']};
export const COUNTERPARTS=['towa','mio','luca','sena','yui','or','nagi','rito','ema','towa','other','towa'];
/** The field, prompt, portrait, words and recorded voice share one identity. */
export function encounterFor(chapter:number,room:number){
 if(![0,4,12,20].includes(room))return null;
 const index=room===4?0:room===12?1:2;
 const id=`npc-${chapter}-${room===0?'journey':'room-'+index}`;
 const speaker=(catalog as Record<string,{speaker:string}>)[id]?.speaker||'narrator';
 const kind=speaker==='narrator'?'record':speaker==='nagi'?'memory':'person';
 const name=kind==='record'?['航海の石碑','Voyage tablet']:kind==='memory'?['ナギの記憶','Nagi’s memory']:ACTOR_NAMES[speaker];
 return {id,speaker,kind,name,x:room>=8?3.5:8.2,y:room>=8?2.5:4.5,text:room===0?JOURNEY_TALKS[chapter]:ROOM_TALKS[chapter][index]};
}
