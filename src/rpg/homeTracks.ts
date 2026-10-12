/** Serializable home music choices; no browser/audio dependencies in server actions. */
export const HOME_TRACKS = [
 {id:'home',ja:'くつろぎの自宅',en:'Cozy home',hira:'くつろぎのじたく'},
 {id:'map',ja:'冒険の風',en:'Adventure breeze',hira:'ぼうけんのかぜ'},
 {id:'hero',ja:'星明かりの部屋',en:'Starlit room',hira:'ほしあかりのへや'},
 {id:'social',ja:'友だちの集い',en:'Friends together',hira:'ともだちのつどい'},
 {id:'farm',ja:'のんびり休日',en:'Lazy holiday',hira:'のんびりきゅうじつ'},
 {id:'fishing',ja:'静かな水辺',en:'Quiet waterside',hira:'しずかなみずべ'},
 {id:'arcade',ja:'にぎやかな遊び場',en:'Lively playroom',hira:'にぎやかなあそびば'},
 {id:'games',ja:'音楽のひととき',en:'Musical moments',hira:'おんがくのひととき'},
] as const;
export type HomeTrackId=typeof HOME_TRACKS[number]['id'];
export const isHomeTrack=(value:unknown):value is HomeTrackId=>HOME_TRACKS.some(t=>t.id===value);
export const MUSIC_FURNITURE=new Set(['musicBox','piano','harp','gramophone','radio','recordCabinet','cello','organ','drum']);
export function homeMusic(room:{music?:HomeTrackId;placed?:{item:string}[];furniture?:{item:string}[]}|undefined):HomeTrackId {
 return room&&(room.placed||room.furniture||[]).some(f=>MUSIC_FURNITURE.has(f.item))&&isHomeTrack(room.music)?room.music:'home';
}
