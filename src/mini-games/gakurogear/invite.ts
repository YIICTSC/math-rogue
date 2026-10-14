export const VR_ROOM_PARAM='vrRoom';
export function normalizeVrCode(value:string){const code=value.trim().toUpperCase();return /^(?:[HS]-)?[A-Z2-9]{6}$/.test(code)?code:'';}
export function vrInviteCode(href:string){try{return normalizeVrCode(new URL(href,'https://invite.invalid').searchParams.get(VR_ROOM_PARAM)||'');}catch{return '';}}
export function vrInviteUrl(href:string,value:string){const code=normalizeVrCode(value);if(!code)return '';try{const url=new URL(href);url.search='';url.hash='';url.searchParams.set(VR_ROOM_PARAM,code);return url.toString();}catch{return '';}}
