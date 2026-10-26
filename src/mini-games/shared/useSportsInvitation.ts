import {useEffect,useRef} from 'react';
import {validRoomAddress} from '../../services/onlineTransport';

/** A submitted club invitation joins once; URL invitations still ask for a name. */
export function useSportsInvitation(code:string,name:string|undefined,join:()=>Promise<void>){
 const action=useRef(join),attempted=useRef('');action.current=join;
 useEffect(()=>{
  const key=code+'\0'+name;
  if(!name?.trim()||!validRoomAddress(code)||attempted.current===key)return;
  // Deferring one task lets StrictMode cancel its rehearsal without connecting twice.
  const timer=setTimeout(()=>{attempted.current=key;void action.current();},0);
  return()=>clearTimeout(timer);
 },[code,name]);
}
