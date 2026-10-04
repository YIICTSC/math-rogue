import type {GameKind} from '../mini-games/gakuro-craft/homeGames';
import type {Bag} from './life';
export const ROOM_WIDTH=18,ROOM_HEIGHT=14;
export const ROOM_DOOR={x:9,y:13};
export const ROOM_SPAWN={x:9,y:11};
export interface Furnishing {id:string;name:string;cost:Bag;width:number;height:number;floor?:boolean;game?:GameKind}
export const FURNISHINGS: Furnishing[] = [
 {id:'bed',name:'木のベッド',cost:{plank:4,reed:3},width:2,height:2},
 {id:'sofa',name:'森色のソファ',cost:{plank:3,herb:2,reed:2},width:2,height:1},
 {id:'chair',name:'木のチェア',cost:{plank:1},width:1,height:1},
 {id:'table',name:'丸いテーブル',cost:{plank:2},width:2,height:2},
 {id:'bookshelf',name:'本棚',cost:{plank:3,reed:2},width:2,height:1},
 {id:'wardrobe',name:'木のクローゼット',cost:{plank:3,ore:1},width:2,height:1},
 {id:'fireplace',name:'石の暖炉',cost:{brick:3,wood:2},width:2,height:1},
 {id:'plant',name:'観葉植物',cost:{herb:3,brick:1},width:1,height:1},
 {id:'flowers',name:'花の花瓶',cost:{herb:4,stone:1},width:1,height:1},
 {id:'floorlamp',name:'フロアランプ',cost:{plank:1,crystal:1},width:1,height:1},
 {id:'blueRug',name:'青いラグ',cost:{reed:4},width:3,height:2,floor:true},
 {id:'redRug',name:'赤いラグ',cost:{reed:4,herb:2},width:3,height:2,floor:true},
 {id:'plushBear',name:'くまのぬいぐるみ',cost:{reed:3,wood:1},width:1,height:1},
 {id:'plushBunny',name:'うさぎのぬいぐるみ',cost:{reed:3,herb:1},width:1,height:1},
 {id:'plushCat',name:'ねこのぬいぐるみ',cost:{reed:3,ore:1},width:1,height:1},
 {id:'plushFox',name:'きつねのぬいぐるみ',cost:{reed:3,wood:2},width:1,height:1},
 {id:'plushPenguin',name:'ペンギンのぬいぐるみ',cost:{reed:3,frostwood:1},width:1,height:1},
 {id:'plushSlime',name:'スライムのぬいぐるみ',cost:{reed:3,herb:2},width:1,height:1},
 {id:'painting',name:'風景画',cost:{plank:2,herb:2},width:1,height:1},
 {id:'clock',name:'柱時計',cost:{plank:2,ore:2},width:1,height:1},
 {id:'crystalDisplay',name:'魔晶石の飾り台',cost:{plank:1,crystal:3},width:1,height:1},
 {id:'armorStand',name:'騎士のよろい飾り',cost:{ore:4,plank:1},width:1,height:1},
 {id:'aquarium',name:'水槽',cost:{crystal:2,fish:2,plank:2},width:2,height:1},
 {id:'musicBox',name:'オルゴール',cost:{plank:2,ore:2,crystal:1},width:1,height:1},
 {id:'workbench',name:'作業台',cost:{plank:3,ore:1},width:2,height:1},
 {id:'darts',name:'ダーツ台',cost:{plank:3,ore:1},width:1,height:1,game:'darts'},
 {id:'billiards',name:'ビリヤード台',cost:{plank:4,stone:4},width:3,height:2,game:'billiards'},
 {id:'arcade',name:'ゲーム機',cost:{plank:3,crystal:2},width:1,height:1,game:'arcade'},
 {id:'stove',name:'料理用ストーブ',cost:{brick:3,ore:2},width:2,height:1},
 {id:'sink',name:'流し台',cost:{plank:2,ore:2},width:2,height:1},
 {id:'refrigerator',name:'木の冷蔵庫',cost:{plank:3,frostwood:2},width:1,height:2},
 {id:'counter',name:'ダイニングカウンター',cost:{plank:4},width:3,height:1},
 {id:'rockingChair',name:'ロッキングチェア',cost:{plank:2,reed:1},width:1,height:1},
 {id:'desk',name:'書きもの机',cost:{plank:3,reed:1},width:2,height:1},
 {id:'mirror',name:'姿見',cost:{plank:2,crystal:2},width:1,height:1},
 {id:'shoeCabinet',name:'くつの棚',cost:{plank:2},width:2,height:1},
 {id:'coatRack',name:'コート掛け',cost:{plank:2,ore:1},width:1,height:1},
 {id:'lantern',name:'吊りランタン',cost:{plank:1,ore:1,crystal:1},width:1,height:1},
 {id:'wovenRug',name:'編み込みラグ',cost:{reed:5},width:3,height:2,floor:true},
 {id:'plushSheep',name:'ひつじのぬいぐるみ',cost:{reed:3,herb:1},width:1,height:1},
 {id:'plushDragon',name:'ドラゴンのぬいぐるみ',cost:{reed:4,crystal:1},width:1,height:1},
 {id:'plushOwl',name:'ふくろうのぬいぐるみ',cost:{reed:3,wood:1},width:1,height:1},
 {id:'plushPanda',name:'パンダのぬいぐるみ',cost:{reed:3,herb:2},width:1,height:1},
 {id:'plushWolf',name:'おおかみのぬいぐるみ',cost:{reed:3,frostwood:1},width:1,height:1},
 {id:'plushFrog',name:'かえるのぬいぐるみ',cost:{reed:3,herb:1},width:1,height:1},
 {id:'plushMushroom',name:'きのこのぬいぐるみ',cost:{reed:3,herb:2},width:1,height:1},
 {id:'treasureChest',name:'宝箱',cost:{plank:3,ore:2},width:2,height:1},
 {id:'telescope',name:'天体望遠鏡',cost:{ore:3,crystal:2},width:1,height:1},
 {id:'globe',name:'地球儀',cost:{plank:2,ore:1},width:1,height:1},
 {id:'bonsai',name:'盆栽',cost:{herb:4,stone:2},width:1,height:1},
 {id:'fountain',name:'小さな噴水',cost:{brick:3,crystal:1},width:2,height:2},
 {id:'snowGlobe',name:'スノードーム',cost:{crystal:2,frostwood:2},width:1,height:1},
 {id:'reversi',name:'リバーシ台',cost:{plank:3,stone:2},width:2,height:2,game:'reversi'},
 {id:'connectfour',name:'四目並べ台',cost:{plank:3,ore:1},width:2,height:1,game:'connectfour'},
 {id:'memory',name:'神経衰弱テーブル',cost:{plank:2,reed:3},width:2,height:2,game:'memory'},
 {id:'race',name:'すごろくテーブル',cost:{plank:3,crystal:1},width:2,height:2,game:'race'},
 {id:'bowling',name:'ボウリングレーン',cost:{plank:5,ore:3},width:2,height:3,game:'bowling'},
 {id:'rhythm',name:'音ゲー筐体',cost:{plank:5,ore:3,crystal:4},width:2,height:1,game:'rhythm'},
 {id:'reaction',name:'反応ゲーム機',cost:{plank:3,ore:2,crystal:2},width:1,height:1,game:'reaction'},
 {id:'piano',name:'アップライトピアノ',cost:{plank:4,ore:2},width:2,height:1},
 {id:'harp',name:'ハープ',cost:{plank:3,ore:2,reed:2},width:1,height:1},
];
export const furnitureImage=(id:string)=>`sprites/rpg/furniture/${id}.webp`;
export const furnishing=(id:string)=>FURNISHINGS.find(f=>f.id===id);
export interface PlacedFurniture {id:string;item:string;x:number;y:number;rotation:0|1;slot?:number}
export interface Interior {stock:Record<string,number>;placed:PlacedFurniture[]}
export const newInterior=():Interior=>({stock:{},placed:[{id:'starter-workbench',item:'workbench',x:2,y:2,rotation:0,slot:0},{id:'starter-table',item:'table',x:13,y:3,rotation:0,slot:1}]});
export function furnitureSize(p:PlacedFurniture){const f=furnishing(p.item);return {width:p.rotation?f?.height||1:f?.width||1,height:p.rotation?f?.width||1:f?.height||1};}
export function furnitureDistance(pos:{x:number;y:number},p:PlacedFurniture){const size=furnitureSize(p);return Math.max(p.x-pos.x,0,pos.x-(p.x+size.width-1))+Math.max(p.y-pos.y,0,pos.y-(p.y+size.height-1));}
export function covers(p:PlacedFurniture,x:number,y:number){const s=furnitureSize(p);return x>=p.x&&x<p.x+s.width&&y>=p.y&&y<p.y+s.height;}
export function roomWalkable(room:Interior,x:number,y:number){return x===ROOM_DOOR.x&&y===ROOM_DOOR.y||x>=1&&x<ROOM_WIDTH-1&&y>=1&&y<ROOM_HEIGHT-1&&!room.placed.some(p=>!furnishing(p.item)?.floor&&covers(p,x,y));}
export function roomRoute(room:Interior,start:{x:number;y:number},target:{x:number;y:number}){
 if(!Number.isInteger(target.x)||!Number.isInteger(target.y)||target.x<0||target.y<0||target.x>=ROOM_WIDTH||target.y>=ROOM_HEIGHT)return [];
 const key=(x:number,y:number)=>y*ROOM_WIDTH+x,first=key(start.x,start.y),end=key(target.x,target.y),queue=[first],previous=new Map([[first,-1]]);let closest=first,best=Math.abs(start.x-target.x)+Math.abs(start.y-target.y);
 for(let i=0;i<queue.length;i++){const n=queue[i],x=n%ROOM_WIDTH,y=Math.floor(n/ROOM_WIDTH),d=Math.abs(x-target.x)+Math.abs(y-target.y);if(d<best){best=d;closest=n;}if(n===end){closest=n;break;}for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,k=key(xx,yy);if(!previous.has(k)&&roomWalkable(room,xx,yy)){previous.set(k,n);queue.push(k);}}}
 const path:Array<{x:number;y:number}>=[];for(let n=closest;n!==first;n=previous.get(n)!)path.push({x:n%ROOM_WIDTH,y:Math.floor(n/ROOM_WIDTH)});return path.reverse();
}
export function placementFits(room:Interior,p:PlacedFurniture,occupants:Array<{x:number;y:number}>=[]){
 const f=furnishing(p.item);if(!f)return false;const s=furnitureSize(p);
 if(!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<1||p.y<1||p.x+s.width>ROOM_WIDTH-1||p.y+s.height>ROOM_HEIGHT-1)return false;
 for(let y=p.y;y<p.y+s.height;y++)for(let x=p.x;x<p.x+s.width;x++){
  if(y>=ROOM_HEIGHT-3&&Math.abs(x-ROOM_DOOR.x)<=1)return false;
  if(room.placed.some(other=>other.id!==p.id&&!!furnishing(other.item)?.floor===!!f.floor&&covers(other,x,y)))return false;
  if(!f.floor&&occupants.some(o=>o.x===x&&o.y===y))return false;
 }
 const next={...room,placed:room.placed.filter(q=>q.id!==p.id).concat(p)};
 return occupants.every(o=>roomRoute(next,o,ROOM_DOOR).at(-1)?.y===ROOM_DOOR.y);
}
