/** Losing matchmaking signalling does not close an established WebRTC match. */
export function shouldReportPeerError(type:string,liveMatch:boolean,openChannels:number){
  return !(['network','socket-error','socket-closed','server-error'].includes(type)&&liveMatch&&openChannels>0);
}
