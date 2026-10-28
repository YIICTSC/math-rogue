import {PROTAGONISTS} from '../../three/protagonistCatalog';
import {MAGIC_HEROES,MAGIC_MALE_PROTAGONISTS} from '../../data/magicHeroes';
import {ABYSS_HEROES} from '../../components/school-dungeon/dungeons2/roster';
import type {Hero,Weapon} from './types';
const make=(id:string,name:string,origin:string,role:string,weapon:Weapon,skill:string,motto:string,color:string,join:number,portrait=id):Hero=>({id,name,origin,role,weapon,skill,motto,color,join,portrait,hp:weapon==='axe'?36:weapon==='staff'?27:32,atk:weapon==='magic'?13:weapon==='staff'?9:12,def:weapon==='lance'?8:weapon==='axe'?7:5,speed:weapon==='sword'||weapon==='bow'?9:7,move:weapon==='lance'?5:4});
const hs:[string,string,Weapon,string,string][]=[
 ['warrior','突破の剣士','sword','反逆の一閃','正しい命令かどうかは、自分の頭で決める。'],
 ['caretaker','命の守り手','staff','生命の連環','救えなかった命も、数にして片づけたくない。'],
 ['assassin','影渡りの斥候','sword','無音の影走り','名前を隠しても、手を貸したことは残る。'],
 ['mage','錬成の研究者','magic','連鎖反応','再現できなくても、観測した事実は消えない。'],
 ['dodgeball','疾駆の槍兵','lance','逆転のラストパス','外した一本は、次のパスで取り返そう。'],
 ['bard','鼓舞の奏者','magic','未来への生放送','編集しない声を、今度こそ最後まで届ける。'],
 ['librarian','記録の術師','magic','未完の叙事詩','書き直す余白があるから、物語は生きている。'],
 ['chef','戦場の料理人','axe','腹いっぱいの約束','作戦会議は食べてから。空腹じゃ明日も考えられない。'],
 ['gardener','緑路の射手','bow','荒野の芽吹き','雑草という名前で、根を切るのはやめよう。'],
];
const magicWeapons:Weapon[]=['magic','magic','staff','axe','sword','magic','bow','magic','staff'];
const maleWeapons:Weapon[]=['lance','lance','staff','magic','axe','magic','magic','sword'];
const d2Weapons:Weapon[]=['sword','magic','bow','magic','staff','axe','lance','sword','bow'];
export const HEROES:Hero[]=[
 make('aster','アステル','継界の王国','星灯の継承者','sword','暁を継ぐ剣','命令する前に、君の答えを聞かせてほしい。','#69d6ce',0),
 make('lyra','リュラ','継界の王国','星灯の継承者','sword','暁を継ぐ剣','王冠より、帰る場所を守る剣を選ぶ。','#eea88b',0),
 ...hs.map(([key,role,weapon,skill,motto],i)=>make(`high-school-${key}`,PROTAGONISTS.find(h=>h.id===`high-school-${key}`)!.name,'高校編',role,weapon,skill,motto,['#f5a66d','#a1d5a1','#c4afe7','#92cadd','#e2bf78','#dda1c3','#c9bce6','#e9ad73','#9bd2a2'][i],[0,2,4,3,5,7,6,2,5][i])),
 ...MAGIC_HEROES.map((h,i)=>make(`magic-${h.id.toLowerCase()}`,h.name,'マジック編',h.transformedTitle,magicWeapons[i],h.ability,`${h.personality}。${h.story}`,h.color,[1,3,2,5,7,8,5,9,10][i])),
 ...MAGIC_MALE_PROTAGONISTS.map((h,i)=>make(`magic-${h.assetId}`,h.name,'マジック編',h.transformedTitle,maleWeapons[i],h.specialty.split('・')[0],`${h.personality}。${h.role}として仲間を支える。`,h.color,[1,4,6,8,7,9,10,12][i])),
 ...ABYSS_HEROES.map((h,i)=>make(h.id,h.name,'ダンジョンズ2',h.role,d2Weapons[i],h.skills[2].name,({lyria:'剣の光よりも、剣を収める時を覚えたい。',celis:'凍らせれば傷は止まる。でも、春まで止めてはいけない。',flora:'種を持っていこう。帰り道にも花が咲くように。',noctia:'禁書にも、誰かを救おうとした書き手がいた。',aurene:'祈りは、傷つく人の隣で捧げるもの。',ignis:'怖いよ。だから、仲間と一緒に一歩を踏み出す。',leon:'盾は、後ろにいる人のために掲げる。',orion:'闇を知る剣なら、夜道を案内することもできる。',leif:'足跡を隠すのは、追われる人を逃がす時だけさ。'} as Record<string,string>)[h.id.slice(10)],h.color,[4,6,8,10,11,6,9,11,12][i])),
 make('nagi','ナギ','星潮の航路','星海の航海士','bow','新しい航路','星が見えなくても、隣を進む人の灯は見える。','#85dcd9',3,'star-nagi'),
 make('mio','ミオ','星潮の航路','木霊の道案内','bow','木霊の連矢','木々の名前を、忘れた人にも教えてあげたい。','#9bd29c',5,'star-mio'),
 make('sena','セナ','星潮の航路','時計の修理工','axe','明日へ回す歯車','戻せない時間より、進める明日を直そう。','#d9b2a1',8,'star-sena'),
];
export const heroById=(id:string)=>HEROES.find(h=>h.id===id)||HEROES[0];
export const WEAPONS:Record<Weapon,string>={sword:'剣',lance:'槍',axe:'斧',bow:'弓',magic:'魔法',staff:'杖'};
export const pairKey=(a:string,b:string)=>[a,b].sort().join('|');
export const ORIGINALS=['aster','lyra'];
