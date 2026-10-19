import {abyssHero} from '../dungeons2/roster';
import {PROTAGONISTS,type ProtagonistId} from '../../../three/protagonistCatalog';
export type AbilityEffect='slash'|'fire'|'ice'|'leaf'|'star'|'shadow'|'thunder'|'water'|'song'|'alchemy';
export interface StudentAbility {name:string;en:string;desc:string;english:string;effect:AbilityEffect;color:string;cooldown:number;power:number;radius?:number;line?:number;dash?:number;heal?:number;food?:number;guard?:number;boost?:number;status?:'sleep'|'frozen'|'poison'|'confused';turns?:number;reveal?:boolean;identify?:boolean;cure?:boolean;}
const a=(name:string,en:string,effect:AbilityEffect,color:string,stats:Partial<StudentAbility>):StudentAbility=>({name,en,effect,color,cooldown:10,power:1.5,desc:'',english:'',...stats});
export const STUDENT_ABILITIES:Record<ProtagonistId,StudentAbility>={
 'elementary-warrior':a('勇気の定規斬り','Brave Ruler Slash','slash','#ffcc75',{line:3,power:1.8,guard:2,cooldown:8}),
 'elementary-caretaker':a('いのちの応援','Living Cheer','leaf','#9ee891',{radius:1,power:.5,heal:35,cure:true,cooldown:12}),
 'elementary-assassin':a('影わたり','Shadow Step','shadow','#c0a1ff',{dash:3,line:3,power:1.6,status:'sleep',turns:1}),
 'elementary-dodgeball':a('全力ドッジシュート','Dodgeball Comet','fire','#ffab79',{line:5,power:2.1,cooldown:9}),
 'elementary-bard':a('おやすみ放送','Lullaby Broadcast','song','#fab5ec',{radius:3,power:.3,status:'sleep',turns:4,cooldown:12}),
 'elementary-librarian':a('ひらめきのしおり','Bookmark Insight','star','#ffe39b',{radius:2,power:0,reveal:true,identify:true,heal:10,cooldown:14}),
 'elementary-chef':a('給食パワーチャージ','Lunch Power','fire','#ffc781',{radius:1,power:.4,heal:25,food:30,cooldown:18}),
 'elementary-gardener':a('つる草の輪','Vine Circle','leaf','#a9e970',{radius:2,power:.8,status:'frozen',turns:3,heal:10,cooldown:11}),
 'elementary-mage':a('理科クラブの電撃','Science Spark','thunder','#fff2a2',{radius:2,power:1.5,status:'frozen',turns:2,cooldown:11}),
 'high-school-warrior':a('反逆の蒼刃','Rebel Azure Blade','slash','#84d4ff',{radius:2,power:2.4,guard:3,cooldown:12}),
 'high-school-caretaker':a('生命のリレー','Life Relay','leaf','#92edbf',{radius:2,power:.5,heal:50,cure:true,guard:2,cooldown:16}),
 'high-school-assassin':a('宵闇の一閃','Twilight Flash','shadow','#bca4fa',{dash:4,line:4,power:2.6,status:'sleep',turns:2,cooldown:13}),
 'high-school-mage':a('錬成スパイラル','Alchemy Spiral','alchemy','#b8ed8e',{radius:3,power:1.7,status:'poison',turns:6,cooldown:13}),
 'high-school-dodgeball':a('流星スリーポイント','Meteor Three-pointer','star','#ffbc70',{line:6,power:2.8,status:'frozen',turns:1,cooldown:12}),
 'high-school-bard':a('共鳴アンセム','Resonance Anthem','song','#e7acff',{radius:4,power:.7,status:'confused',turns:4,boost:5,cooldown:14}),
 'high-school-librarian':a('真理のページ','Page of Truth','star','#ddd8ff',{radius:3,power:.7,reveal:true,identify:true,status:'frozen',turns:3,cooldown:14}),
 'high-school-chef':a('勝利のフルコース','Victory Full Course','fire','#ffd488',{radius:2,power:.6,heal:45,food:45,cure:true,cooldown:22}),
 'high-school-gardener':a('緑の守護結界','Verdant Sanctuary','leaf','#98edac',{radius:3,power:1.1,status:'frozen',turns:4,guard:4,heal:20,cooldown:16}),
 'magic-akari':a('星灯りのグランドクロス','Starlight Grand Cross','star','#fff0b1',{radius:3,power:2.4,guard:2,cooldown:14}),
 'magic-shizuku':a('清流のアリア','Clearwater Aria','water','#8de6ff',{radius:3,power:1.2,heal:35,cure:true,status:'frozen',turns:2,cooldown:15}),
 'magic-hiyori':a('花結びの約束','Promise of Blossoms','leaf','#f6b0cb',{radius:2,power:.8,heal:45,status:'sleep',turns:3,cooldown:16}),
 'magic-tsubasa':a('紅蓮フェニックス','Crimson Phoenix','fire','#ff9368',{line:7,power:3.1,boost:3,cooldown:16}),
 'magic-rei':a('月蝕の黒翼','Eclipse Wings','shadow','#ba96ed',{dash:3,radius:2,power:2.5,status:'confused',turns:3,cooldown:14}),
 'magic-madoka':a('翠風の輪舞','Emerald Wind Waltz','leaf','#b0efc5',{radius:4,power:1.6,status:'frozen',turns:2,heal:15,cooldown:13}),
 'magic-koharu':a('天空への追い風','Skyward Tailwind','water','#bdefff',{dash:4,line:5,power:1.8,guard:3,cooldown:12}),
 'magic-mirai':a('未来視の万華鏡','Foresight Kaleidoscope','alchemy','#e3acff',{radius:3,power:1,reveal:true,identify:true,status:'confused',turns:5,cooldown:15}),
 'magic-sera':a('白銀の聖域','Silver Sanctuary','ice','#e8f7ff',{radius:3,power:1.5,status:'frozen',turns:4,guard:4,heal:15,cooldown:16}),
 'magic-ren':a('暁の光剣','Dawn Lightblade','slash','#ffe0ad',{line:5,power:2.6,boost:4,cooldown:12}),
 'magic-soma':a('雷影の疾走','Thunder Shadow Rush','thunder','#b7bbff',{dash:4,line:4,power:2.2,status:'frozen',turns:3,cooldown:13}),
 'magic-minato':a('蒼海の守り手','Azure Sea Guardian','water','#8adaf6',{radius:2,power:1.6,guard:5,cure:true,cooldown:14}),
 'magic-riku':a('天音の交響曲','Celestial Symphony','song','#d7bbff',{radius:4,power:1.2,status:'sleep',turns:4,heal:20,cooldown:16}),
 'magic-yamato':a('黒曜の破砕撃','Obsidian Breaker','shadow','#b4a0f3',{radius:2,power:3.3,guard:2,cooldown:15}),
 'magic-leon':a('獅子星の王冠','Lionstar Crown','fire','#ffd06c',{radius:3,power:2.6,boost:5,cooldown:17}),
 'magic-elliot':a('夜想の魔導書','Nocturne Grimoire','alchemy','#b5b6ff',{line:6,power:2.3,status:'poison',turns:5,reveal:true,cooldown:15}),
 'magic-sakuya':a('桜月の時止め','Sakura Moon Stasis','ice','#fac5e8',{radius:3,power:1.4,status:'frozen',turns:5,guard:2,cooldown:18}),
};
export function studentAbility(id:string,slot=0):StudentAbility{const hero=abyssHero(id);if(hero)return hero.skills[slot]||hero.skills[0];return STUDENT_ABILITIES[id as ProtagonistId]||STUDENT_ABILITIES[PROTAGONISTS[0].id];}
export function abilityDescription(a:StudentAbility,english=false){const out:string[]=[];if(a.power)out.push(english?`${a.line?'Line '+a.line:'Radius '+(a.radius||1)} · ${a.power}× attack`:`${a.line?'直線'+a.line:'周囲'+(a.radius||1)}マス・攻撃${a.power}倍`);if(a.heal)out.push(english?`HP +${a.heal}`:`HP${a.heal}回復`);if(a.food)out.push(english?`Food +${a.food}`:`満腹度+${a.food}`);if(a.status)out.push(english?`${a.status} ${a.turns} turns`:`${({frozen:'足止め',poison:'毒',confused:'混乱',sleep:'眠り'})[a.status]}${a.turns}ターン`);if(a.dash)out.push(english?`Dash ${a.dash}`:`突進${a.dash}マス`);if(a.guard)out.push(english?`Half damage ${a.guard} turns`:`被害半減${a.guard}ターン`);if(a.boost)out.push(english?`Attack +40% ${a.boost} turns`:`攻撃+40% ${a.boost}ターン`);if(a.reveal)out.push(english?'Reveal map / traps':'地図・罠を見通す');if(a.identify)out.push(english?'Identify supplies':'持ち物識別');if(a.cure)out.push(english?'Cleanse / heal companion':'状態回復・仲間回復');out.push(a.cooldown===0?(english?'Recycle through deck':'デッキ再構築で再利用'):(english?`Recharge ${a.cooldown} turns`:`再使用${a.cooldown}ターン`));return out.join(' / ');}
export interface AbilityEntity {id:number|string;x:number;y:number;hp:number;defense?:number;enemyType?:string;status?:Record<string,number>;[key:string]:any;}
export function resolveStudentAbility(a:StudentAbility,player:{x:number;y:number;attack:number;hp:number;maxHp:number;dir:{x:number;y:number}},enemies:AbilityEntity[],map:string[][],terrain:Record<string,string>,multiplier=1){
 const direction=player.dir.x||player.dir.y?player.dir:{x:0,y:1};
 const clearLine=(tx:number,ty:number)=>{let x=player.x,y=player.y;const distance=Math.max(Math.abs(tx-x),Math.abs(ty-y));for(let i=1;i<=distance;i++){const nx=Math.round(player.x+(tx-player.x)*i/distance),ny=Math.round(player.y+(ty-player.y)*i/distance);if(map[ny]?.[nx]==='WALL'||!map[ny]?.[nx])return false;if(nx!==x&&ny!==y&&(map[y]?.[nx]==='WALL'||map[ny]?.[x]==='WALL'))return false;x=nx;y=ny;}return true;};
 const hits:{x:number;y:number;damage:number}[]=[];
 const result=enemies.map(e=>{if(e.hp<=0||e.enemyType==='SHOPKEEPER')return e;const dx=e.x-player.x,dy=e.y-player.y,distance=Math.max(Math.abs(dx),Math.abs(dy));const onRay=a.line?Array.from({length:a.line},(_,i)=>[direction.x*(i+1),direction.y*(i+1)]).some(([x,y])=>dx===x&&dy===y):distance<=(a.radius||1);if(!onRay||!clearLine(e.x,e.y))return e;const damage=a.power?Math.max(1,Math.floor(Math.max(1,Math.floor(player.attack*a.power-(e.defense||0)*.5))*multiplier)):0;hits.push({x:e.x,y:e.y,damage});return {...e,hp:e.hp-damage,status:{...e.status,...(a.status?{[a.status]:Math.max(e.status?.[a.status]||0,a.turns||2)}:{})}};});
 let x=player.x,y=player.y;for(let i=0;i<(a.dash||0);i++){const nx=x+direction.x,ny=y+direction.y,k=`${nx},${ny}`;if(!map[ny]?.[nx]||map[ny][nx]!=='FLOOR'||terrain[k]||result.some(e=>e.hp>0&&e.x===nx&&e.y===ny)||nx!==x&&ny!==y&&(map[y]?.[nx]==='WALL'||map[ny]?.[x]==='WALL'))break;x=nx;y=ny;}
 return {enemies:result.filter(e=>e.hp>0),dead:result.filter(e=>e.hp<=0&&enemies.some(old=>old.id===e.id&&old.hp>0)),hits,x,y,hp:Math.min(player.maxHp,player.hp+(a.heal||0))};
}
