import type {Work} from './life';
export const FISHING_SOUNDS={cast:750,bite:550,hook:550,reel:500,good:500,perfect:850,miss:500,catch:1050,rare:1800,record:1850,escape:1200} as const;
export type FishingSound=keyof typeof FISHING_SOUNDS;
// Feedback follows accepted state transitions, never the client's estimated meter timing.
export function fishingFeedback(previous:Work|undefined,next:Work|undefined,caught:boolean,message:string):FishingSound|undefined{
 if(next?.kind==='fish'&&(!previous?.fishing||previous.fishing.nonce!==next.fishing?.nonce||previous.tile!==next.tile))return next.fishing?.phase==='bite'?'cast':undefined;
 if(previous?.fishing&&next?.fishing){
  if(previous.fishing.phase==='bite'&&next.fishing.phase==='reel')return next.fishing.perfect>previous.fishing.perfect?'perfect':'good';
  if(next.fishing.beat>previous.fishing.beat)return next.fishing.hits>previous.fishing.hits?(next.fishing.perfect>previous.fishing.perfect?'perfect':'good'):'miss';
 }
 if(previous?.kind==='fish'&&!next&&!caught&&(message==='魚が逃げました。浮きが沈んでから引き上げましょう。'||message==='糸が切れました。光る範囲で巻きましょう。'))return 'escape';
}
