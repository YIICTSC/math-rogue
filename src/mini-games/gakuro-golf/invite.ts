import {normalizeRoomInput} from '../../services/onlineTransport';
export const GOLF_ROOM_PARAM='golfRoom';
export function golfInviteCode(href:string):string{try{const code=normalizeRoomInput(new URL(href,'https://invite.invalid').searchParams.get(GOLF_ROOM_PARAM)||'');return /^(?:[HS]-)?[A-Z0-9]{6}$/.test(code)?code:'';}catch{return '';}}
export function golfInviteUrl(href:string,value:string):string{const code=normalizeRoomInput(value);if(!/^(?:[HS]-)?[A-Z0-9]{6}$/.test(code))return '';try{const url=new URL(href);url.search='';url.hash='';url.searchParams.set(GOLF_ROOM_PARAM,code);return url.toString();}catch{return '';}}
