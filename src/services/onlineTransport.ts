export type OnlineTransport='host'|'server';
// NFKC accepts mixed full-width digits/letters without guessing a mistyped code.
export const normalizeRoomInput=(value:string)=>value.normalize('NFKC').trim().toUpperCase();
export function roomAddress(value:string,fallback:OnlineTransport='host'){const normalized=normalizeRoomInput(value),match=normalized.match(/^([HS])[- ]?([A-Z0-9]{6})$/);return {code:match?match[2]:normalized,transport:match?(match[1]==='H'?'host':'server') as OnlineTransport:/^\d{6}$/.test(normalized)?(Number(normalized[0])<5?'host':'server') as OnlineTransport:fallback};}
export const validRoomAddress=(value:string)=>/^[A-Z0-9]{6}$/.test(roomAddress(value).code);
export const shareRoomCode=(code:string,transport:OnlineTransport)=>code?(/^\d{6}$/.test(code)?code:`${transport==='host'?'H':'S'}-${code}`):'';
export function initialTransport():OnlineTransport {if(typeof location==='undefined')return 'host';const p=new URLSearchParams(location.search);for(const key of ['rpgRoom','kartRoom','golfRoom','vrRoom','tennisRoom','dodgeballRoom','basketballRoom']){const code=p.get(key);if(code)return roomAddress(code,'server').transport;}return 'host';}

/** Numeric namespaces preserve transport routing without a visible H-/S- prefix. */
export function createHostRoomCode(){const n=crypto.getRandomValues(new Uint32Array(1))[0];return String(n%500000).padStart(6,'0');}
