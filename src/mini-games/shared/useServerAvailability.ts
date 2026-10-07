import {useEffect,useState} from 'react';
import {probeServer,type OnlineGameEndpoint} from '../../services/serverAvailability';
import {onlineServerUrl} from '../../services/dedicatedConnection';
export function useServerAvailability(game:OnlineGameEndpoint){
 const [state,setState]=useState<'checking'|'available'|'unavailable'>('checking'),[version,setVersion]=useState(0);
 useEffect(()=>{
  const abort=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  const run=async()=>{const ok=await probeServer(game,abort.signal);if(abort.signal.aborted)return;setState(ok?'available':'unavailable');timer=setTimeout(run,ok?30000:5000);};
  setState('checking');void run();
  // Wake a sleeping Render service; only an actual WebSocket pong enables selection.
  const base=onlineServerUrl();if(base)try{const health=new URL(base);health.protocol=['ws:','http:'].includes(health.protocol)?'http:':'https:';health.pathname='/health';health.search='';health.hash='';void fetch(health,{mode:'no-cors',signal:AbortSignal.any([abort.signal,AbortSignal.timeout(180000)])}).catch(()=>{});}catch{}
  const retry=()=>setVersion(v=>v+1);window.addEventListener('online',retry);window.addEventListener('offline',retry);window.addEventListener('focus',retry);
  return()=>{abort.abort();clearTimeout(timer);window.removeEventListener('online',retry);window.removeEventListener('offline',retry);window.removeEventListener('focus',retry);};
 },[game,version]);
 return {state,recheck:()=>setVersion(v=>v+1)};
}
