/** Small authoritative presentation log. Gameplay never depends on its contents. */
export type Sport = 'golf'|'tennis'|'basketball'|'dodgeball';
export type SportsEvent = {id:number;kind:'action'|'special'|'referee';actor?:string;call?:string;at:number};
export interface SportsEventBuffer {sportsSerial?:number;sportsEvents?:SportsEvent[]}
export const OFFICIAL_CALLS = {
 golf:['nice','perfect','birdie','eagle','albatross','par','bogey','double-bogey','over-par','hole-in-one','ob','water'],
 tennis:['fault','double-fault','let','out','deuce','advantage-server','advantage-receiver','game','set'],
 basketball:['two','three','shot-clock','game'],dodgeball:['out','catch','perfect','game'],
} as const;
export function sportsEvent(buffer:SportsEventBuffer,kind:SportsEvent['kind'],at:number,actor?:string,call?:string){
 const event:SportsEvent={id:(buffer.sportsSerial??0)+1,kind,at,...(actor?{actor}:{}),...(call?{call}:{})};
 buffer.sportsSerial=event.id;buffer.sportsEvents=[...(buffer.sportsEvents??[]),event].slice(-12);return event;
}
export function validSportsEvents(buffer:any,sport:Sport){
 if(buffer.sportsSerial===undefined&&buffer.sportsEvents===undefined)return true;
 if(!Number.isSafeInteger(buffer.sportsSerial)||buffer.sportsSerial<0||!Array.isArray(buffer.sportsEvents)||buffer.sportsEvents.length>12)return false;
 let prior=0;
 return buffer.sportsEvents.every((e:any)=>{
  if(!e||!Number.isSafeInteger(e.id)||e.id<=prior||e.id>buffer.sportsSerial||typeof e.at!=='number'||!Number.isFinite(e.at)||e.at<0||!['action','special','referee'].includes(e.kind)||e.actor!==undefined&&(typeof e.actor!=='string'||e.actor.length>100))return false;
  prior=e.id;return e.kind==='referee'?(OFFICIAL_CALLS[sport] as readonly string[]).includes(e.call):typeof e.actor==='string'&&e.call===undefined;
 });
}
