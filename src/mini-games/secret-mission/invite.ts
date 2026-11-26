import { VR_ROOM_PARAM } from '../gakurogear/invite';
import { ENDPOINT } from './rules';
export const MISSION_PARAM='vrMode';

export function secretMissionCode(href:string){
  try{
    const u=new URL(href);
    if(u.searchParams.get(MISSION_PARAM)!==ENDPOINT)return '';
    const value=u.searchParams.get(VR_ROOM_PARAM)??'';
    return /^\d{6}$/.test(value)?value:'';
  }catch{return '';}
}
export function inviteUrl(code:string){
  const url=new URL(location.href);
  url.search='';url.hash='';
  url.searchParams.set(VR_ROOM_PARAM,code);
  url.searchParams.set(MISSION_PARAM,ENDPOINT);
  return url.href;
}
export function clearMissionInvite(){
  const url=new URL(location.href);
  if(url.searchParams.get(MISSION_PARAM)===ENDPOINT){
    url.searchParams.delete(MISSION_PARAM);url.searchParams.delete(VR_ROOM_PARAM);history.replaceState(null,'',url.href);
  }
}
