import {onlineServerUrl} from './dedicatedConnection';
export type OnlineGameEndpoint='online'|'kart'|'golf';
/** A real browser WebSocket/pong check includes origin restrictions, without creating a room. */
export async function probeServer(game:OnlineGameEndpoint,signal:AbortSignal,timeout=15000):Promise<boolean>{
 const base=onlineServerUrl();if(!base||signal.aborted||navigator.onLine===false)return false;
 let url:URL;try{url=new URL(base);url.protocol=['http:','ws:'].includes(url.protocol)?'ws:':'wss:';url.pathname='/'+game;url.search='';url.hash='';}catch{return false;}
 return new Promise(resolve=>{
  let socket:WebSocket|undefined,settled=false;
  const finish=(ok:boolean)=>{if(settled)return;settled=true;clearTimeout(timer);signal.removeEventListener('abort',abort);if(socket){socket.onopen=socket.onmessage=socket.onerror=socket.onclose=null;socket.close();}resolve(ok);};
  const abort=()=>finish(false),timer=setTimeout(()=>finish(false),timeout);signal.addEventListener('abort',abort,{once:true});
  try{socket=new WebSocket(url);socket.onopen=()=>socket?.send(JSON.stringify({type:'ping'}));socket.onmessage=e=>{try{if(JSON.parse(e.data).type==='pong')finish(true);}catch{/* Ignore unrelated packets. */}};socket.onerror=()=>finish(false);socket.onclose=()=>finish(false);}catch{finish(false);}
 });
}
