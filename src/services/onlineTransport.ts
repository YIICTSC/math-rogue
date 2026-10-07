export type OnlineTransport='host'|'server';
export function roomAddress(value:string,fallback:OnlineTransport='host'){const normalized=value.trim().toUpperCase(),match=normalized.match(/^([HS])[- ]?([A-Z2-9]{6})$/);return {code:match?match[2]:normalized,transport:match?(match[1]==='H'?'host':'server') as OnlineTransport:fallback};}
export const validRoomAddress=(value:string)=>/^[A-Z2-9]{6}$/.test(roomAddress(value).code);
export const shareRoomCode=(code:string,transport:OnlineTransport)=>code?`${transport==='host'?'H':'S'}-${code}`:'';
export function initialTransport():OnlineTransport {if(typeof location==='undefined')return 'host';const p=new URLSearchParams(location.search);for(const key of ['rpgRoom','kartRoom','golfRoom']){const code=p.get(key);if(code)return roomAddress(code,'server').transport;}return 'host';}
