import {normalizeRoomInput} from '../../services/onlineTransport';
export const TENNIS_ROOM_PARAM='tennisRoom';
export function tennisInviteCode(href:string):string{try{const code=normalizeRoomInput(new URL(href,'https://invite.invalid').searchParams.get(TENNIS_ROOM_PARAM)||'');return /^(?:[HS]-)?[A-Z0-9]{6}$/.test(code)?code:'';}catch{return '';}}
export function tennisInviteUrl(href:string,value:string):string{const code=normalizeRoomInput(value);if(!/^(?:[HS]-)?[A-Z0-9]{6}$/.test(code))return '';try{const url=new URL(href);url.search='';url.hash='';url.searchParams.set(TENNIS_ROOM_PARAM,code);return url.toString();}catch{return '';}}
