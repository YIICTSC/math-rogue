/** Each beacon key concludes a different route, with no timer or repeat-kill requirements. */
export const KEY_ROUTES=[
 {chest:17,rooms:[8,9,10,11,17],ja:'記録の航路',en:'Route of records'},
 {chest:19,rooms:[12,13,14,15,19],ja:'守りの航路',en:'Route of protection'},
 {chest:21,rooms:[16,18,20,21,22],ja:'共鳴の航路',en:'Route of resonance'},
] as const;
export const routeReady=(chapter:number,route:typeof KEY_ROUTES[number],cleared:string[],solved:string[])=>route.rooms.filter(room=>cleared.includes(`${chapter}:${room}`)||solved.includes(`${chapter}:${room}`)).length>=3;
