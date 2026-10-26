import {normalizeRoomInput} from '../../services/onlineTransport';
export const DODGEBALL_ROOM_PARAM='dodgeballRoom';
export function dodgeballInviteCode(href:string):string{try{const code=normalizeRoomInput(new URL(href,'https://invite.invalid').searchParams.get(DODGEBALL_ROOM_PARAM)||'');return /^(?:[HS]-)?[A-Z0-9]{6}$/.test(code)?code:'';}catch{return '';}}
export function dodgeballInviteUrl(href:string,value:string):string{const code=normalizeRoomInput(value);if(!/^(?:[HS]-)?[A-Z0-9]{6}$/.test(code))return '';try{const url=new URL(href);url.search='';url.hash='';url.searchParams.set(DODGEBALL_ROOM_PARAM,code);return url.toString();}catch{return '';}}
