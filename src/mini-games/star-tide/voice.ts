import {audioService} from '../../services/audioService';
import catalog from './voiceCatalog.json';
import {STAR_VOICE_IDS} from './voiceIds';
let token=0,busy=false,last=0;const next=new Map<string,number>();
export function stopStarVoice(){token++;busy=false;audioService.stopStarTideVoices();}
export async function playStarStory(id:string){stopStarVoice();if(!STAR_VOICE_IDS.has(id)||!audioService.canPlayConversationVoice())return false;const generation=token;busy=true;try{return await audioService.playStarTideVoiceFile(id);}finally{if(token===generation)busy=false;}}
export function starActionVoice(action:string){if(busy||Date.now()-last<1800||!audioService.canPlayConversationVoice())return;const ids=Object.keys(catalog).filter(k=>k.startsWith('action-'+action+'-'));if(!ids.length)return;const n=next.get(action)||0;next.set(action,n+1);last=Date.now();void playStarStory(ids[n%ids.length]);}
