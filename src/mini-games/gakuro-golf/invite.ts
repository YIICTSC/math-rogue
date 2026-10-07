export const GOLF_ROOM_PARAM='golfRoom';
export function golfInviteCode(href:string):string{try{const code=(new URL(href,'https://invite.invalid').searchParams.get(GOLF_ROOM_PARAM)||'').trim().toUpperCase();return /^(?:[HS]-)?[A-Z2-9]{6}$/.test(code)?code:'';}catch{return '';}}
export function golfInviteUrl(href:string,code:string):string{if(!/^(?:[HS]-)?[A-Z2-9]{6}$/.test(code))return '';try{const url=new URL(href);url.search='';url.hash='';url.searchParams.set(GOLF_ROOM_PARAM,code);return url.toString();}catch{return '';}}
