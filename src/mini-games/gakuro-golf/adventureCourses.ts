import type { Hole, Hazard, TerrainHill } from './course';
const hill=(x:number,z:number,rx:number,rz:number,height:number):TerrainHill=>({x,z,rx,rz,height});
const pit=(x:number,z:number,rx:number,rz:number):Hazard=>({x,z,rx,rz});
/** Each hole has a deliberate landing route; sky islands include safe stepping stones. */
export const ADVENTURE_HOLES:Hole[]=[
 {name:'朝露の丘',par:3,cup:{x:0,z:145},fairway:26,wind:{x:.2,z:.1},water:[],sand:[pit(25,105,12,16)],terrain:{theme:'meadow',hills:[hill(0,65,45,35,9),hill(-20,115,30,32,-4)]}},
 {name:'三日月のくぼ地',par:4,cup:{x:-25,z:220},fairway:26,wind:{x:-.25,z:.1},water:[pit(27,120,18,26)],sand:[],terrain:{theme:'meadow',hills:[hill(-5,100,40,45,-14),hill(-22,195,35,35,8)]}},
 {name:'風車の峠',par:4,cup:{x:20,z:240},fairway:24,wind:{x:.5,z:-.1},water:[],sand:[pit(-24,150,16,25)],terrain:{theme:'mountain',hills:[hill(0,115,60,40,25),hill(20,230,30,30,7)]}},
 {name:'泉の飛び石',par:3,cup:{x:-12,z:160},fairway:24,wind:{x:-.18,z:.2},water:[pit(5,80,28,20)],sand:[],terrain:{theme:'meadow',hills:[hill(-20,125,42,30,12)]}},
 {name:'二つの峰',par:5,cup:{x:25,z:315},fairway:26,wind:{x:.3,z:.12},water:[],sand:[pit(40,240,15,20)],terrain:{theme:'mountain',hills:[hill(-20,95,40,35,23),hill(18,210,45,38,30)]}},
 {name:'砂のすり鉢',par:4,cup:{x:0,z:225},fairway:30,wind:{x:.12,z:-.2},water:[],sand:[pit(0,100,33,34)],terrain:{theme:'desert',hills:[hill(0,100,47,44,-18),hill(28,165,35,30,12)]}},
 {name:'琥珀の尾根',par:4,cup:{x:-28,z:245},fairway:23,wind:{x:-.4,z:.14},water:[pit(25,160,20,26)],sand:[],terrain:{theme:'desert',hills:[hill(-15,135,22,85,23)]}},
 {name:'花園のクレーター',par:3,cup:{x:15,z:135},fairway:27,wind:{x:.1,z:.08},water:[],sand:[pit(-25,80,12,16)],terrain:{theme:'meadow',hills:[hill(15,135,32,32,-13),hill(-12,65,40,24,8)]}},
 {name:'雲への登り坂',par:5,cup:{x:0,z:320},fairway:27,wind:{x:.35,z:.2},water:[],sand:[pit(30,210,16,26)],terrain:{theme:'mountain',hills:[hill(0,310,65,130,43)]}},
 {name:'天空への第一歩',par:3,cup:{x:12,z:145},fairway:29,wind:{x:.18,z:.12},water:[],sand:[],terrain:{theme:'sky',base:26,hills:[hill(10,135,35,35,4)],islands:[pit(0,10,36,42),pit(-9,72,31,31),pit(12,140,40,42)]}},
 {name:'星のかけ橋',par:4,cup:{x:-20,z:230},fairway:25,wind:{x:-.3,z:.2},water:[],sand:[],terrain:{theme:'sky',base:30,hills:[hill(-10,110,28,35,12)],islands:[pit(0,0,33,40),pit(20,75,30,30),pit(-15,140,32,36),pit(-20,228,40,40)]}},
 {name:'雨雲を越えて',par:4,cup:{x:28,z:250},fairway:26,wind:{x:.5,z:-.18},water:[pit(-18,152,13,19)],sand:[],terrain:{theme:'sky',base:32,hills:[hill(20,170,40,45,18)],islands:[pit(0,10,35,45),pit(-12,92,34,32),pit(23,166,38,40),pit(28,244,42,42)]}},
 {name:'月影の谷',par:4,cup:{x:-15,z:215},fairway:25,wind:{x:-.16,z:.14},water:[],sand:[pit(20,150,12,18)],terrain:{theme:'moon',base:8,hills:[hill(0,90,45,43,-22),hill(-15,200,35,33,8)]}},
 {name:'竜の背中',par:5,cup:{x:20,z:330},fairway:24,wind:{x:.32,z:-.1},water:[],sand:[],terrain:{theme:'mountain',hills:[hill(-18,82,30,35,28),hill(18,168,33,35,34),hill(-8,258,33,35,22)]}},
 {name:'滝の上のグリーン',par:3,cup:{x:0,z:155},fairway:25,wind:{x:.22,z:.1},water:[pit(25,90,22,25)],sand:[],terrain:{theme:'mountain',hills:[hill(0,150,42,50,32)]}},
 {name:'浮島の回廊',par:5,cup:{x:-25,z:320},fairway:27,wind:{x:-.4,z:.14},water:[],sand:[],terrain:{theme:'sky',base:36,hills:[hill(20,160,35,40,16)],islands:[pit(0,0,36,40),pit(-20,76,33,32),pit(20,158,36,38),pit(0,238,32,36),pit(-25,318,42,40)]}},
 {name:'虹のすべり台',par:4,cup:{x:25,z:235},fairway:27,wind:{x:.3,z:.22},water:[],sand:[pit(-25,165,16,20)],terrain:{theme:'moon',base:10,hills:[hill(0,60,45,45,26),hill(25,220,35,35,-7)]}},
 {name:'星冠の頂',par:5,cup:{x:0,z:340},fairway:28,wind:{x:.4,z:.12},water:[],sand:[pit(18,250,12,20)],terrain:{theme:'sky',base:40,hills:[hill(-15,120,40,40,10),hill(0,335,45,50,23)],islands:[pit(0,0,38,45),pit(15,78,32,35),pit(-15,150,35,38),pit(18,230,36,36),pit(0,330,44,48)]}},
];
