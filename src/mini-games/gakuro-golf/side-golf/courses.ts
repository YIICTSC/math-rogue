export type V={x:number;y:number};
export type Material='grass'|'sand'|'ice'|'sticky'|'fragile';
export type Power='normal'|'sticky'|'ice'|'heavy'|'bounce'|'float'|'phase';
export type Item=Power|'brake'|'undo';
export type Rect={x:number;y:number;w:number;h:number};
export interface Solid {points:V[];material:Material;move?:{x:number;y:number;speed:number;phase:number}}
export interface Device extends Rect {kind:'water'|'lava'|'fan'|'gravity'|'portal'|'spring'|'bumper';force?:V;pair?:number}
export interface SideCourse {id:number;tour:number;number:number;name:string;par:number;width:number;height:number;tee:V;cup:V;solids:Solid[];devices:Device[];coins:V[];theme:Tour}
export interface Tour {name:string;english:string;hiragana:string;sky:string;rock:string;turf:string;accent:string;hint:string;hintEn:string;hintHi:string}
export const TOURS:Tour[]=[
 {name:'そよ風の丘',english:'Breezy Meadows',hiragana:'そよかぜの おか',sky:'#90dadd',rock:'#7b8362',turf:'#a7df77',accent:'#ffe3a3',hint:'まずは角度とパワー。安全な足場から狙おう。',hintEn:'Choose angle and power. Aim from safe footholds.',hintHi:'まずは かくどと パワー。あんぜんな あしばから ねらおう。'},
 {name:'氷晶の洞',english:'Crystal Caverns',hiragana:'ひょうしょうの ほら',sky:'#223c66',rock:'#54718c',turf:'#a3edfa',accent:'#c4fcff',hint:'氷はよく滑る。吸着でぴたりと止まろう。',hintEn:'Ice is slippery. Anchor the ball to stop.',hintHi:'こおりは よくすべる。きゅうちゃくで ぴたりと とまろう。'},
 {name:'砂漠遺跡',english:'Amber Ruins',hiragana:'さばく いせき',sky:'#e6bba0',rock:'#a87657',turf:'#ead486',accent:'#ffe8b2',hint:'砂は止まりやすい。遺跡の壁を反射に使おう。',hintEn:'Sand slows the ball. Bank shots off the ruins.',hintHi:'すなは とまりやすい。いせきの かべを はんしゃに つかおう。'},
 {name:'雲海列島',english:'Cloud Archipelago',hiragana:'うんかい れっとう',sky:'#869fda',rock:'#9292bd',turf:'#dcf2ff',accent:'#fff0bd',hint:'落下に注意。ふわり球で島から島へ。',hintEn:'Mind the gaps. Float from island to island.',hintHi:'らっかに ちゅうい。ふわりだまで しまから しまへ。'},
 {name:'時計塔工房',english:'Clockwork Heights',hiragana:'とけいとう こうぼう',sky:'#293d52',rock:'#676d76',turf:'#e2b970',accent:'#88f6da',hint:'動く足場とバネで、上のルートを開拓。',hintEn:'Ride moving platforms and springs to the upper route.',hintHi:'うごく あしばと バネで、うえの ルートを かいたく。'},
 {name:'星屑重力圏',english:'Stardust Orbit',hiragana:'ほしくず じゅうりょくけん',sky:'#211c48',rock:'#69648e',turf:'#bcafff',accent:'#9fffee',hint:'重力の光を読もう。重い球は風に強い。',hintEn:'Read gravity fields. Heavy balls resist the wind.',hintHi:'じゅうりょくの ひかりを よもう。おもい たまは かぜに つよい。'},
 {name:'紅蓮の峡谷',english:'Ember Canyon',hiragana:'ぐれんの きょうこく',sky:'#592d4c',rock:'#8f554c',turf:'#f5b080',accent:'#ffde8c',hint:'溶岩を越え、壊せる壁を貫いて近道へ。',hintEn:'Cross the lava and break fragile walls for shortcuts.',hintHi:'ようがんを こえ、こわせる かべを つらぬいて ちかみちへ。'},
 {name:'虹の王冠',english:'Rainbow Crown',hiragana:'にじの おうかん',sky:'#4d5388',rock:'#8583b2',turf:'#eeccff',accent:'#fff4b0',hint:'すべての仕掛けが集合。自分だけの最短ルートを。',hintEn:'Every trick comes together. Find your own shortest route.',hintHi:'すべての しかけが しゅうごう。じぶんだけの さいたんルートを。'},
];
export const ITEM_INFO:Record<Item,{name:string;en:string;hi:string;hint:string;hintEn:string;hintHi:string;icon:string}>={
 normal:{name:'ふつうの球',en:'Standard',hi:'ふつうの たま',hint:'いつもの弾道。個数制限なし。',hintEn:'A reliable flight. Unlimited uses.',hintHi:'いつもの だんどう。こすうせいげん なし。',icon:'ball'},
 sticky:{name:'吸着の球',en:'Anchor',hi:'きゅうちゃくの たま',hint:'壁や天井にぴたり。そこから次のショット。',hintEn:'Stick to a wall or ceiling and shoot from there.',hintHi:'かべや てんじょうに ぴたり。そこから つぎの ショット。',icon:'anchor'},
 ice:{name:'氷渡りの球',en:'Frost',hi:'こおりわたりの たま',hint:'水面を凍らせて足場に。溶岩には効きません。',hintEn:'Freeze water into a foothold. Lava stays dangerous.',hintHi:'すいめんを こおらせて あしばに。ようがんには ききません。',icon:'snow'},
 heavy:{name:'鉄星の球',en:'Iron star',hi:'てつぼしの たま',hint:'風に強く、もろい壁を壊します。',hintEn:'Resist wind and smash fragile walls.',hintHi:'かぜに つよく、もろい かべを こわします。',icon:'weight'},
 bounce:{name:'反跳の球',en:'Rebound',hi:'はんちょうの たま',hint:'強く跳ね返り、高い場所へ。',hintEn:'Bounce harder to reach higher places.',hintHi:'つよく はねかえり、たかい ばしょへ。',icon:'bounce'},
 float:{name:'ふわりの球',en:'Feather',hi:'ふわりの たま',hint:'ゆっくり落ち、谷や高い壁を越えます。',hintEn:'Fall slowly to cross ravines and tall walls.',hintHi:'ゆっくり おち、たにや たかい かべを こえます。',icon:'feather'},
 phase:{name:'幻影の球',en:'Phantom',hi:'げんえいの たま',hint:'もろい壁を通り抜ける魔法の球。',hintEn:'Pass through fragile walls.',hintHi:'もろい かべを とおりぬける まほうの たま。',icon:'ghost'},
 brake:{name:'空中ブレーキ',en:'Air brake',hi:'くうちゅう ブレーキ',hint:'飛行中に押すと、その場で勢いを止めます。',hintEn:'Press during flight to stop momentum.',hintHi:'ひこうちゅうに おすと、そのばで いきおいを とめます。',icon:'brake'},
 undo:{name:'時戻し',en:'Rewind',hi:'ときもどし',hint:'直前の一打をやり直します。',hintEn:'Undo your last stroke.',hintHi:'ちょくぜんの いちだを やりなおします。',icon:'undo'},
};
const rect=(x:number,y:number,w:number,h:number,material:Material='grass',move?:Solid['move']):Solid=>({points:[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}],material,move});
const land=(points:number[][],material:Material='grass'):Solid=>({points:points.map(([x,y])=>({x,y})),material});
const d=(kind:Device['kind'],x:number,y:number,w:number,h:number,extra:Partial<Device>={}):Device=>({kind,x,y,w,h,...extra});
const layouts=['小さな一歩','島めぐり','ひみつのトンネル','空へ続く階段','すり鉢の跳躍','鏡の回廊','時を刻むリフト','逆さまの天文台','王冠への道'];
export function makeSideCourse(tour:number,number:number):SideCourse{
 const t=TOURS[tour],v=tour*2,m:Material=tour===1?'ice':tour===2?'sand':'grass';let solids:Solid[]=[],devices:Device[]=[],tee={x:24,y:32},cup={x:332,y:42},par=4;
 switch(number){
 case 0: solids=[land([[0,0],[360,0],[360,40+v],[300,40+v],[266,28],[230,28],[202,16],[150,16],[115,30],[0,30]],m)];cup={x:332,y:40+v};devices=[d('water',137,0,47,17)];par=3;break;
 case 1: solids=[rect(0,0,65,30,m),rect(93,5,52,43+v,m),rect(179,0,54,66-v,m),rect(273,0,87,48+v,m),rect(52,-12,244,14,m)];cup={x:332,y:48+v};devices=[d('fan',151,25,25,75,{force:{x:0,y:20}})];break;
 case 2: solids=[rect(0,0,360,28,m),rect(90,73+v,170,22,m),rect(162,28,16,45+v,'fragile'),rect(290,28,70,34,m)];cup={x:332,y:62};devices=[d('water',203,0,48,29)];par=4;break;
 case 3: solids=[rect(0,0,72,30,m),rect(92,20,63,46,m),rect(181,45,67,63,m),rect(283,70,77,77,m),rect(230,147,18,34,'fragile')];cup={x:331,y:147};devices=[d('spring',42,30,18,5),d('fan',157,34,23,100,{force:{x:0,y:23}})];par=5;break;
 case 4: solids=[land([[0,0],[360,0],[360,62],[300,62],[265,19],[210,12],[140,12],[98,37],[54,30],[0,30]],m),rect(168,92+v,65,12,m)];cup={x:333,y:62};devices=[d('spring',159,12,26,5),d('bumper',259,74,14,14)];par=3;break;
 case 5: solids=[rect(0,0,142,30,m),rect(170,0,18,125+v,'fragile'),rect(218,0,142,42,m),rect(85,130+v,200,15,m)];cup={x:332,y:42};devices=[d('portal',119,58,16,23,{pair:1}),d('portal',248,91+v,16,23,{pair:0})];par=3;break;
 case 6: solids=[rect(0,0,75,30,m),rect(103,25,52,14,m,{x:0,y:48,speed:.65,phase:0}),rect(187,95,65,14,m,{x:22,y:0,speed:.55,phase:1}),rect(292,0,68,144-v,m),rect(0,-12,280,12,m)];cup={x:330,y:144-v};devices=[d('spring',43,30,18,5),d('fan',261,30,25,110,{force:{x:0,y:24}})];par=5;break;
 case 7: solids=[rect(0,0,75,30,m),rect(90,177,185,14,'sticky'),rect(140,0,70,47,m),rect(282,0,78,80+v,m)];cup={x:330,y:80+v};devices=[d('gravity',85,42,190,130,{force:{x:0,y:32}}),d('water',70,-2,211,11),d('bumper',226,112,14,14)];par=4;break;
 default: solids=[rect(0,0,70,30,m),rect(100,12,55,48,m),rect(176,20,17,106,'fragile'),rect(209,73,58,15,m,{x:10,y:24,speed:.6,phase:0}),rect(291,0,69,132+v,m),rect(0,175,140,16,'sticky')];cup={x:330,y:132+v};devices=[d('fan',71,30,28,92,{force:{x:0,y:21}}),d('spring',118,60,21,5),d('portal',235,116,16,23,{pair:3}),d('portal',309,160,16,23,{pair:2}),d('water',155,-3,133,14)];par=5;
 }
 if(tour===3||tour===7)solids=solids.filter((_,i)=>number!==1||i!==4);
 if(tour===5&&number!==7)devices.push(d('gravity',185,80,67,92,{force:{x:0,y:29}}));
 if(tour===4&&![3,6,8].includes(number))devices.push(d('spring',55,30,18,5));
 if(tour===6)devices=devices.map(o=>o.kind==='water'?{...o,kind:'lava'}:o);
 if(tour===7&&number<5)devices.push(d('bumper',210,112,14,14));
 return {id:tour*9+number,tour,number,name:layouts[number],par,width:360,height:220,tee,cup,solids,devices,coins:[{x:90,y:99+v},{x:190,y:142},{x:292,y:175+v}],theme:t};
}
export const SIDE_COURSES=TOURS.flatMap((_,t)=>Array.from({length:9},(_,n)=>makeSideCourse(t,n)));
export function solidPoints(s:Solid,time:number):V[]{const m=s.move,dx=m?Math.sin(time*m.speed+m.phase)*m.x:0,dy=m?Math.sin(time*m.speed+m.phase)*m.y:0;return s.points.map(p=>({x:p.x+dx,y:p.y+dy}));}
