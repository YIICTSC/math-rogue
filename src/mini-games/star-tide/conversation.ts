import catalog from './voiceCatalog.json';
import type {ConversationActor,Reaction} from '../../components/dialogue/ConversationStage';
const names:Record<string,readonly[string,string]>={nagi:['ナギ','Nagi'],towa:['トワ','Towa'],mio:['ミオ','Mio'],sena:['セナ','Sena'],luca:['ルカ','Luca'],yui:['ユイ','Yui'],or:['オル','Or'],rito:['リト','Rito'],ema:['エマ','Ema'],other:['もう一人の航海士','The other navigator']};
const counterparts=['towa','mio','luca','sena','yui','or','nagi','rito','ema','towa','other','towa'];
const journeyMoods:Reaction[]=['neutral','concern','concern','resolve','resolve','concern','concern','resolve','neutral','joy','concern','resolve'];
export function starDialogue(chapter:number,id:string,en:boolean){
  const speaker=(catalog as Record<string,{speaker:string}>)[id]?.speaker||'narrator';
  const counterpart=id.startsWith('opening')||id.startsWith('glider')?'towa':counterparts[chapter]||'towa';
  const rightId=speaker!=='narrator'&&speaker!=='nagi'?speaker:counterpart;
  let reaction:Reaction=journeyMoods[chapter]||'neutral';
  if(id.startsWith('ending'))reaction='joy';
  else if(id==='glider-towa')reaction='joy';
  else if(id.startsWith('glider'))reaction='resolve';
  else if(id==='choice-question')reaction='resolve';
  else if(id.startsWith('opening-'))reaction=Number(id.slice(8))<2?'neutral':Number(id.slice(8))<4?'concern':'resolve';
  else if(id.endsWith('room-2'))reaction=chapter===6||chapter===10?'concern':chapter===11?'resolve':'joy';
  else if(id.endsWith('room-1'))reaction='concern';
  const actor=(key:string,mood:Reaction):ConversationActor=>({id:'star-'+key,name:(names[key]||names.towa)[en?1:0],reaction:mood});
  const left=actor('nagi',speaker==='nagi'?reaction:speaker==='narrator'?reaction:reaction==='joy'?'joy':reaction==='concern'?'concern':'neutral');
  const right=actor(rightId,speaker===rightId?reaction:speaker==='narrator'?reaction:'neutral');
  if(rightId==='nagi'){right.echo=true;right.name=en?"Nagi's memory":'記憶のナギ';}
  return {left,right,active:(speaker==='nagi'?'left':speaker==='narrator'?'narrator':'right') as 'left'|'right'|'narrator'};
}
export function conversationWords(text:string){return text.replace(/^[^「\n]{1,24}「([\s\S]*)」$/u,'$1').replace(/^(?:Towa|Mio|Luca|Sena|Yui|Or|Nagi|Rito|Ema|The other navigator):\s*/,'');}
