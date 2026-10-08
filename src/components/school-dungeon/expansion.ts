import type {SchoolItem} from './adventure';
export const EXTRA_ITEMS:Record<string,Omit<SchoolItem,'id'>>={
 SUPPLY_RAIN_WAND:{type:'SUPPLY_RAIN_WAND',category:'CONSUMABLE',name:'雨ふらしの傘',desc:'正面の一直線にいる最初の敵へ20ダメージ。3回使える。',charges:3,value:650},
 SUPPLY_WHISTLE:{type:'SUPPLY_WHISTLE',category:'CONSUMABLE',name:'おやすみホイッスル',desc:'周囲2マスの敵を8ターン眠らせる。',value:350},
 SUPPLY_CRANE:{type:'SUPPLY_CRANE',category:'CONSUMABLE',name:'とびだす折り鶴',desc:'敵と罠のない床へワープ。ピンチを抜け出す。',value:400},
 SUPPLY_LENS:{type:'SUPPLY_LENS',category:'CONSUMABLE',name:'探検虫めがね',desc:'この階の罠を全て発見。',value:300},
 SUPPLY_RAINCOAT:{type:'SUPPLY_RAINCOAT',category:'ACCESSORY',name:'雨よけバッジ',desc:'雨の日でも紙の道具が濡れない。',value:600},
 SUPPLY_MAT:{type:'SUPPLY_MAT',category:'CONSUMABLE',name:'ピクニックシート',desc:'周囲3マスに敵がいなければHP30とお腹20回復。',value:250},
 SUPPLY_REPAIR:{type:'SUPPLY_REPAIR',category:'CONSUMABLE',name:'お手入れセット',desc:'装備中の武器と防具を+1。道具の水濡れも直す。',value:500},
 SUPPLY_MEDAL:{type:'SUPPLY_MEDAL',category:'CONSUMABLE',name:'探検の金メダル',desc:'先生に見せるとおこづかい300。',value:300},
};
export const EXTRA_ITEM_SPRITES:Record<string,number>={SUPPLY_RAIN_WAND:0,SUPPLY_WHISTLE:1,SUPPLY_CRANE:2,SUPPLY_LENS:3,SUPPLY_RAINCOAT:4,SUPPLY_MAT:5,SUPPLY_REPAIR:6,SUPPLY_MEDAL:7};
export const EXTRA_ENEMIES:Record<string,{sprite:number;name:string;en:string;type:string}>={MIMIC:{sprite:8,name:'びっくり宝箱',en:'Surprise chest',type:'GOLEM'},UMBRELLA:{sprite:9,name:'夜ふかし傘おばけ',en:'Night umbrella',type:'GHOST'},MUD:{sprite:10,name:'どろんこ長ぐつ',en:'Muddy boot',type:'SLIME'},SPROUT:{sprite:11,name:'元気な芽ばえ',en:'Lively sprout',type:'MANDRAKE'}};
export const TOWN_SERVICES=[{kind:'INN',x:3,y:3,name:'川辺の宿',en:'Riverside inn',sprite:12},{kind:'SMITH',x:7,y:3,name:'工作工房',en:'Craft smith',sprite:13},{kind:'BANK',x:3,y:6,name:'郵便・預かり所',en:'Mail and savings',sprite:14},{kind:'SHOP',x:7,y:6,name:'旅のお店',en:'Travel shop',sprite:14},{kind:'FESTIVAL',x:5,y:4,name:'町のお祭り',en:'Town festival',sprite:15}];
export function journeyLayout(width:number,height:number,town:boolean,variant:number){
 const map=Array.from({length:height},()=>Array(width).fill('WALL'));
 for(let y=1;y<=9;y++)for(let x=1;x<=10;x++)map[y][x]='FLOOR';
 // A river and an explicit bridge frame the scenery without sealing the route.
 if(!town){for(let y=1;y<=9;y++)if(y!==4&&y!==7)map[y][5]='WALL';for(let x=7;x<=9;x++)map[2][x]='WALL';}
 map[8][9]='STAIRS';return {map,start:{x:2,y:8},scene:town?0:2+variant%4};
}
