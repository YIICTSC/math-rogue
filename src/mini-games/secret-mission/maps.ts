export interface Point { x: number; z: number }
export interface Rect extends Point { w: number; d: number }
export type Furniture = 'desk'|'lab'|'books'|'court'|'garden'|'control'|'forge'|'portal'|'clinic';
type Room = readonly [ja: string, en: string, furniture: Furniture];
export interface Facility extends Rect { id: number; ja: string; en: string; kind: Furniture }
export interface MissionMap {
  w:number; d:number; floor:string; hall:string; light:string; facilities:Facility[]; walls:Rect[]; doors:Rect[];
  meeting:Point; cameras:Point[]; tunnels:Point[]; repair:[number,number]; signal:number;
}
export const MAPS = {
  school: {
    ja:'夕暮れの学園', en:'Twilight Academy', floor:'#e4b17d', hall:'#587181', light:'#ffddb8', cols:5,
    critical:['設備管理システム停止','Campus power failure'],
    rooms:[
      ['普通教室','Classroom','desk'], ['職員室','Staff Room','desk'], ['校長室','Principal’s Office','desk'],
      ['理科室','Science Lab','lab'], ['音楽室','Music Room','court'], ['図工室','Art Room','forge'],
      ['家庭科室','Home Economics','lab'], ['図書室','Library','books'], ['保健室','Infirmary','clinic'],
      ['放送室','Broadcast Room','control'], ['体育館','Gym','court'], ['昇降口','Entrance','control'],
      ['校庭','Schoolyard','garden'], ['屋上','Roof Garden','garden'], ['設備管理室','Maintenance','forge'],
    ],
  },
  orbit: {
    ja:'軌道船こもれび', en:'Orbiter Komorebi', floor:'#81b5dd', hall:'#334763', light:'#9be1ff', cols:3,
    critical:['酸素供給・動力炉の異常','Oxygen and reactor failure'],
    rooms:[
      ['操縦室','Bridge','control'], ['通信室','Communications','control'], ['機関室','Engine Room','forge'],
      ['酸素供給室','Oxygen Supply','lab'], ['研究室','Research Lab','lab'], ['医務室','Medical Bay','clinic'],
      ['格納庫','Hangar','court'], ['監視室','Observation Deck','desk'], ['電力管理室','Power Control','portal'],
    ],
  },
  magic: {
    ja:'星図の魔法学校', en:'Astral School', floor:'#bc96d3', hall:'#55466a', light:'#efc0ff', cols:3,
    critical:['魔力供給の停止','Mana supply failure'],
    rooms:[
      ['魔法図書館','Arcane Library','books'], ['魔法実験室','Spell Lab','lab'], ['魔法薬調合室','Potion Room','clinic'],
      ['召喚室','Summoning Hall','portal'], ['魔法陣の間','Rune Chamber','portal'], ['魔力供給室','Mana Supply','control'],
      ['秘密の回廊','Secret Gallery','garden'],
    ],
  },
  ruins: {
    ja:'鐘灯の地下遺跡', en:'Bell Lantern Ruins', floor:'#92b38a', hall:'#3b584e', light:'#b5f2c9', cols:3,
    critical:['転送陣・魔力結界の異常','Portal and ward failure'],
    rooms:[
      ['冒険者ギルド','Adventurers’ Guild','desk'], ['地下牢','Dungeon Cells','forge'], ['宝物庫','Treasury','books'],
      ['鍛冶場','Forge','forge'], ['転送陣','Waygate','portal'], ['地下水路','Waterway','garden'],
      ['古代遺跡','Ancient Archive','control'],
    ],
  },
} satisfies Record<string,{ja:string;en:string;floor:string;hall:string;light:string;cols:number;critical:[string,string];rooms:Room[]}>;
export type MapId = keyof typeof MAPS;
const annex: Room[] = [
  ['東連絡室','East Relay','control'], ['標本室','Specimen Archive','lab'], ['中庭','Courtyard','garden'],
  ['予備保管庫','Supply Annex','books'], ['第二作業室','Workshop Annex','forge'], ['西連絡室','West Relay','control'],
];
const maps = new Map<string,MissionMap>();

export function missionMap(id:MapId, large=false):MissionMap {
  const key = id+large, cached = maps.get(key);
  if(cached) return cached;
  const spec=MAPS[id], rooms=large?[...spec.rooms,...annex]:spec.rooms;
  const cols=large?Math.max(4,spec.cols):spec.cols, step=large?10.8:9.4;
  const rw=6.9, rd=6.05, w=cols*step+3, d=Math.ceil(rooms.length/cols)*step+3;
  const walls:Rect[]=[
    {x:w/2,z:.25,w,d:.5},{x:w/2,z:d-.25,w,d:.5},{x:.25,z:d/2,w:.5,d},{x:w-.25,z:d/2,w:.5,d},
  ], doors:Rect[]=[];
  const facilities=rooms.map(([ja,en,kind],i):Facility=>{
    const x=(i%cols+.5)*step+1.5, z=(Math.floor(i/cols)+.5)*step+1.5;
    const gate=x+((i%3)-1)*.85;
    const doorway=(z:number)=>{
      const left=gate-.99-(x-rw/2), right=x+rw/2-gate-.99;
      walls.push({x:x-rw/2+left/2,z,w:left,d:.3},{x:x+rw/2-right/2,z,w:right,d:.3});
    };
    doorway(z-rd/2);
    if(i%4===1||kind==='court'||kind==='garden') doorway(z+rd/2);
    else walls.push({x,z:z+rd/2,w:rw,d:.3});
    walls.push({x:x-rw/2,z,w:.28,d:rd},{x:x+rw/2,z,w:.28,d:rd});
    if(kind==='books'||kind==='forge'||kind==='lab') walls.push({x:x+1.9,z:z+1,w:.66,d:2.5});
    doors.push({x:gate,z:z-rd/2,w:1.98,d:.3});
    return {id:i,x,z,w:rw,d:rd,ja,en,kind};
  });
  const result:MissionMap={
    w,d,floor:spec.floor,hall:spec.hall,light:spec.light,facilities,walls,doors,meeting:{x:step+1.5,z:step+1.5},
    cameras:[1,Math.ceil(cols/2),cols-.36].map((c,i)=>({x:Math.min(w-1.25,c*step+1.5),z:step*(i===1?2:1)+1.5})),
    tunnels:[{x:1.35,z:step+1.5},{x:w-1.4,z:d-1.5},{x:1.35,z:d-1.5}],
    repair:[0,facilities.length-1],signal:facilities.filter(f=>f.kind==='control').at(-1)?.id??facilities.length-1,
  };
  maps.set(key,result);
  return result;
}

export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
const radius=.32;
const solid=(r:Rect,a:Point)=>Math.abs(a.x-r.x)<r.w/2+radius&&Math.abs(a.z-r.z)<r.d/2+radius;
export function canStand(map:MissionMap,a:Point,door=-1){
  return a.x>radius&&a.z>radius&&a.x<map.w-radius&&a.z<map.d-radius
    && !map.walls.some(w=>solid(w,a))&&(!map.doors[door]||!solid(map.doors[door],a));
}
function crosses(a:Point,b:Point,r:Rect){
  let start=0,end=1;
  for(const axis of ['x','z'] as const){
    const half=(axis==='x'?r.w:r.d)/2, delta=b[axis]-a[axis], relative=a[axis]-r[axis];
    if(Math.abs(delta)<1e-7){if(Math.abs(relative)>=half)return false;continue;}
    const enter=(-half-relative)/delta, exit=(half-relative)/delta;
    start=Math.max(start,Math.min(enter,exit));end=Math.min(end,Math.max(enter,exit));
    if(start>end)return false;
  }
  return true;
}
export function sight(map:MissionMap,a:Point,b:Point,door=-1){
  return !map.walls.some(w=>crosses(a,b,w))&&(!map.doors[door]||!crosses(a,b,map.doors[door]));
}
export const near=(map:MissionMap,a:Point,b:Point,limit:number,door=-1)=>distance(a,b)<=limit&&sight(map,a,b,door);
