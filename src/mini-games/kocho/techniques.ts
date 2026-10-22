import type { GuestCard } from './guests';

export interface HeroTechnique {
  gain?: number; spend?: number; repeat?: number; bonusPerFocus?: number;
  shield?: number; heal?: number; strength?: number; barrier?: number;
  reduceCooldown?: number; retreat?: number; reverse?: boolean;
}
// Eighteen mechanically distinct families, each with four tactical variants.
// All effects use the same resolver in battle, tooltips and regression tests.
interface Family {
  names: [string, string, string, string];
  type: GuestCard['type']; range: number[]; damage: number; cooldown: number;
  effectType?: GuestCard['effectType']; technique?: HeroTechnique;
  descriptions: [string, string, string];
}
const families: Family[] = [
  { names:['紅蓮連拳','Crimson Barrage','ぐれんれんけん','流星連射'], type:'ATTACK', range:[1], damage:2, cooldown:3, effectType:'NORMAL', technique:{repeat:2}, descriptions:['目の前の敵を2回攻撃','Strike the nearest tile twice','めのまえのてきを2かいこうげき'] },
  { names:['突破の衝撃','Breakthrough','とっぱのしょうげき','彗星突進'], type:'ATTACK', range:[1,2,3], damage:3, cooldown:3, effectType:'DASH_ATTACK', descriptions:['前方3マスまで突進し、最初の敵を攻撃','Rush up to 3 tiles and strike the first enemy','ぜんぽう3マスまでとっしんし、さいしょのてきをこうげき'] },
  { names:['影抜きスライド','Shadow Slide','かげぬきスライド','光速すり抜け'], type:'ATTACK', range:[1,2,3], damage:2, cooldown:4, effectType:'PIERCE_DASH', descriptions:['前方3マスまで最初の敵をすり抜けて攻撃','Slide up to 3 tiles through the first enemy','ぜんぽう3マスまでさいしょのてきをすりぬけてこうげき'] },
  { names:['旋回の嵐','Whirling Storm','せんかいのあらし','星環スイープ'], type:'ATTACK', range:[-1,1], damage:3, cooldown:3, effectType:'PIERCE', descriptions:['前後1マスの敵すべてを攻撃','Strike all enemies one tile ahead and behind','ぜんご1マスのてきすべてをこうげき'] },
  { names:['見切りの一撃','Perfect Counter','みきりのいちげき','鏡星カウンター'], type:'ATTACK', range:[1], damage:2, cooldown:3, effectType:'COUNTER', descriptions:['目の前を攻撃。攻撃態勢か行動まで1ターン以下の敵には3倍','Strike ahead; triple damage if the enemy is attacking or acts within 1 turn','めのまえをこうげき。こうげきたいせいかこうどうまで1ターンいかのてきには3ばい'] },
  { names:['烈風掌','Gale Palm','れっぷうしょう','彗星プッシュ'], type:'ATTACK', range:[1,2], damage:2, cooldown:3, effectType:'PUSH', descriptions:['前方2マスまで攻撃し、敵を最大2マス押す','Strike within 2 tiles and push the enemy up to 2 tiles','ぜんぽう2マスまでこうげきし、てきをさいだい2マスおす'] },
  { names:['引き込みフック','Grappling Hook','ひきこみフック','星鎖フック'], type:'ATTACK', range:[2,3,4], damage:2, cooldown:3, effectType:'PULL', descriptions:['前方2〜4マスの敵を攻撃し、目の前へ引き寄せる','Strike an enemy 2–4 tiles ahead and pull it next to you','ぜんぽう2〜4マスのてきをこうげきし、めのまえへひきよせる'] },
  { names:['離脱の一閃','Recoil Slash','りだつのいっせん','反動スターバースト'], type:'ATTACK', range:[1,2,3], damage:3, cooldown:3, effectType:'RECOIL', descriptions:['前方3マスまで攻撃。命中すると1マス後退','Strike within 3 tiles; step back 1 tile on hit','ぜんぽう3マスまでこうげき。めいちゅうすると1マスこうたい'] },
  { names:['一点狙撃','Pinpoint Shot','いってんそげき','天頂の星'], type:'ATTACK', range:[1,2,3,4,5,6], damage:3, cooldown:4, effectType:'FURTHEST', descriptions:['向きに関係なく最も遠い敵を攻撃','Strike the farthest enemy regardless of facing','むきにかんけいなくもっともとおいてきをこうげき'] },
  { names:['校則一閃','Rulebreaker Arc','こうそくいっせん','銀河の光'], type:'ATTACK', range:[1,2,3,4], damage:2, cooldown:4, effectType:'PIERCE', descriptions:['前方4マスの敵すべてを攻撃','Strike every enemy within 4 tiles ahead','ぜんぽう4マスのてきすべてをこうげき'] },
  { names:['足払い','Low Sweep','あしばらい','時止めの星'], type:'ATTACK', range:[1,2], damage:2, cooldown:4, effectType:'STUN', descriptions:['前方2マスまで攻撃し、敵の行動を1ターン遅らせる','Strike within 2 tiles and delay the enemy by 1 turn','ぜんぽう2マスまでこうげきし、てきのこうどうを1ターンおくらせる'] },
  { names:['闘気吸収','Fighting Spirit Drain','とうききゅうしゅう','月光ドレイン'], type:'ATTACK', range:[1,2], damage:2, cooldown:4, effectType:'DRAIN', descriptions:['前方2マスまで攻撃。命中ごとにHPを1回復','Strike within 2 tiles; heal 1 HP per hit','ぜんぽう2マスまでこうげき。めいちゅうごとにHPを1かいふく'] },
  { names:['鉄壁の構え','Iron Guard','てっぺきのかまえ','守護星座'], type:'UTILITY', range:[0], damage:0, cooldown:3, technique:{shield:4}, descriptions:['シールドを4獲得','Gain 4 shield','シールドを4かくとく'] },
  { names:['燃える気合','Burning Resolve','もえるきあい','星への祈り'], type:'UTILITY', range:[0], damage:0, cooldown:4, technique:{strength:2,gain:2}, descriptions:['次の命中攻撃の威力を2強化','Add 2 strength to the next successful attack','つぎのめいちゅうこうげきのいりょくを2きょうか'] },
  { names:['応急手当','First Aid','おうきゅうてあて','癒しの星雨'], type:'UTILITY', range:[0], damage:0, cooldown:4, technique:{heal:3}, descriptions:['HPを3回復','Heal 3 HP','HPを3かいふく'] },
  { names:['呼吸を整える','Second Wind','こきゅうをととのえる','再詠唱'], type:'UTILITY', range:[0], damage:0, cooldown:5, technique:{reduceCooldown:2}, descriptions:['手札と発動済みカードのCDを2短縮。自身と予約中のカードは対象外','Reduce other hand and resolved-card cooldowns by 2; excludes this card and pending actions','てふだとはつどうずみカードのCDを2たんしゅく。じしんとよやくちゅうのカードはたいしょうがい'] },
  { names:['絶対の意志','Unbreakable Will','ぜったいのいし','星の絶対結界'], type:'UTILITY', range:[0], damage:0, cooldown:6, technique:{barrier:1}, descriptions:['次のダメージを1回無効化。バリアは最大2回分','Negate the next damage instance; up to 2 barriers','つぎのダメージを1かいむこうか。バリアはさいだい2かいぶん'] },
  { names:['反転退避','Turning Retreat','はんてんたいひ','星間ステップ'], type:'UTILITY', range:[0], damage:0, cooldown:3, technique:{retreat:2,reverse:true}, descriptions:['最大2マス後退して向きを変える。敵を飛び越えない','Retreat up to 2 tiles then turn; cannot pass enemies','さいだい2マスこうたいしてむきをかえる。てきをとびこえない'] },
];
const akariEnglish = ['Meteor Volley','Comet Rush','Lightspeed Slide','Star Orbit','Mirror Star','Comet Push','Star Chain','Recoil Starburst','Zenith Star','Galactic Light','Time Stop Star','Moonlight Drain','Guardian Constellation','Starlit Prayer','Healing Starfall','Recast','Absolute Star Barrier','Astral Retreat'];
const akariHiragana = ['りゅうせいれんしゃ','すいせいとっしん','こうそくすりぬけ','せいかんスイープ','きょうせいカウンター','すいせいプッシュ','せいさフック','はんどうスターバースト','てんちょうのほし','ぎんがのひかり','ときどめのほし','げっこうドレイン','しゅごせいざ','ほしへのいのり','いやしのほしあめ','さいえいしょう','ほしのぜったいけっかい','せいかんステップ'];
function akariFamily(base:Family,index:number):Family {
  // Akari trades close-range force for reach and stronger support spells.
  const variants:Record<number,Partial<Family>> = {
    0:{range:[1,2,3],damage:1,descriptions:['前方3マスまでの最初の敵を2回攻撃','Strike the first enemy within 3 tiles twice','ぜんぽう3マスまでのさいしょのてきを2かいこうげき']},
    3:{range:[-2,-1,1,2],damage:2,descriptions:['前後2マスの敵すべてを攻撃','Strike all enemies within 2 tiles ahead and behind','ぜんご2マスのてきすべてをこうげき']},
    10:{range:[1,2,3],cooldown:5,descriptions:['前方3マスまで攻撃し、敵の行動を1ターン遅らせる','Strike within 3 tiles and delay the enemy by 1 turn','ぜんぽう3マスまでこうげきし、てきのこうどうを1ターンおくらせる']},
    12:{technique:{shield:5},descriptions:['シールドを5獲得','Gain 5 shield','シールドを5かくとく']},
    13:{technique:{strength:1,gain:3},descriptions:['次の命中攻撃の威力を1強化','Add 1 strength to the next successful attack','つぎのめいちゅうこうげきのいりょくを1きょうか']},
    14:{technique:{heal:4},descriptions:['HPを4回復','Heal 4 HP','HPを4かいふく']},
    15:{cooldown:6,technique:{reduceCooldown:3},descriptions:['手札と発動済みカードのCDを3短縮。自身と予約中のカードは対象外','Reduce other hand and resolved-card cooldowns by 3; excludes this card and pending actions','てふだとはつどうずみカードのCDを3たんしゅく。じしんとよやくちゅうのカードはたいしょうがい']},
  };
  return {...base,...variants[index]};
}
const variants = [ ['速攻','Quick','そっこう'], ['蓄勢','Charge','ちくせい'], ['連携','Link','れんけい'], ['解放','Unleash','かいほう'] ] as const;
export const KOCHO_TECHNIQUE_ENGLISH: Record<string,string> = {};
export const KOCHO_TECHNIQUE_HIRAGANA: Record<string,string> = {};
export const KOCHO_ADVANCED_CARDS: GuestCard[] = (['rebel','akari'] as const).flatMap(hero => {
  const resource = hero === 'rebel' ? ['闘志','Resolve','とうし'] : ['星光','Starlight','せいこう'];
  const cards = (hero==='akari'?families.map(akariFamily):families).flatMap((family, familyIndex) => variants.map((variant, v): GuestCard => {
    const gain = v === 1 ? 3 : v === 3 ? 0 : 1;
    const technique: HeroTechnique = { ...family.technique, gain:gain+(family.technique?.gain ?? 0), ...(v===2?{shield:(family.technique?.shield??0)+1}:{}), ...(v===3?{spend:3,bonusPerFocus:family.type==='ATTACK'?1:0,shield:(family.technique?.shield??0)+2}:{} ) };
    const damage = family.type==='ATTACK' ? Math.max(1, family.damage+(v===2?1:0)-(v===0?1:0)) : 0;
    const name = `${hero==='rebel'?family.names[0]:family.names[3]}・${variant[0]}`;
    const englishName = `${hero==='rebel'?family.names[1]:akariEnglish[familyIndex]}: ${variant[1]}`;
    const hiraganaName = `${hero==='rebel'?family.names[2]:akariHiragana[familyIndex]}・${variant[2]}`;
    const details = [family.descriptions[0], ...(damage?[`威力${damage}${technique.repeat?`×${technique.repeat}`:''}`]:[]), ...(gain+(family.technique?.gain??0)?[`${resource[0]}+${gain+(family.technique?.gain??0)}（上限10）`]:[]), ...(v===2?['追加シールド+1']:[]), ...(v===3?[family.type==='ATTACK'?`${resource[0]}を最大3消費し、1消費につき威力+1。追加シールド+2`:`${resource[0]}を最大3消費し、消費数と同じシールドを追加。追加シールド+2`]:[])];
    const en = [family.descriptions[1], ...(damage?[`Power ${damage}${technique.repeat?` x${technique.repeat}`:''}`]:[]), ...(technique.gain?[`Gain ${technique.gain} ${resource[1]} (max 10)`]:[]), ...(v===2?['Gain 1 extra shield']:[]), ...(v===3?[`Spend up to 3 ${resource[1]}; ${family.type==='ATTACK'?'add 1 power per point':'gain shield equal to points spent'}. Gain 2 extra shield`]:[])].join('. ');
    const hi = [family.descriptions[2], ...(damage?[`いりょく${damage}${technique.repeat?`×${technique.repeat}`:''}`]:[]), ...(technique.gain?[`${resource[2]}+${technique.gain}（じょうげん10）`]:[]), ...(v===2?['ついかシールド+1']:[]), ...(v===3?[`${resource[2]}をさいだい3しょうひし、${family.type==='ATTACK'?'1しょうひにつきいりょく+1':'しょうひすうとおなじシールドをついか'}。ついかシールド+2`]:[])].join('。');
    const description=details.join('。');
    KOCHO_TECHNIQUE_ENGLISH[name]=englishName; KOCHO_TECHNIQUE_ENGLISH[description]=en;
    KOCHO_TECHNIQUE_HIRAGANA[name]=hiraganaName; KOCHO_TECHNIQUE_HIRAGANA[description]=hi;
    return {hero,art:10+v*20+familyIndex,name,englishName,hiraganaName,description,type:family.type,range:[...family.range],damage,cooldown:Math.max(1,family.cooldown+(v===3?1:0)-(v===0?1:0)),color:hero==='rebel'?'bg-rose-800':'bg-violet-800',energyCost:1,maxSlots:3,effectType:family.effectType,technique,minStage:1+Math.floor(familyIndex/3)};
  }));
  for(let n=0;n<2;n++) {
    const name=hero==='rebel'?(n?'叛逆の最終宣言':'紅蓮限界突破'):(n?'スターライト・フィナーレ':'願いの超新星');
    const description=`${resource[0]}を最大10消費。前方6マスの敵すべてに威力2、1消費につき威力+1${n?'。命中時に2連撃':'。シールドを3獲得'}`;
    const en=`Spend up to 10 ${resource[1]}. Strike all enemies up to 6 tiles ahead for 2 power +1 per point spent${n?', twice':'; gain 3 shield'}.`;
    const hiraganaName=hero==='rebel'?(n?'はんぎゃくのさいしゅうせんげん':'ぐれんげんかいとっぱ'):(n?'スターライト・フィナーレ':'ねがいのちょうしんせい');
    const hi=`${resource[2]}をさいだい10しょうひ。ぜんぽう6マスのてきすべてにいりょく2、1しょうひにつきいりょく+1${n?'。めいちゅうじに2れんげき':'。シールドを3かくとく'}`;
    KOCHO_TECHNIQUE_ENGLISH[name]=hero==='rebel'?(n?'Final Rebellion':'Crimson Limit Break'):(n?'Starlight Finale':'Wishing Supernova'); KOCHO_TECHNIQUE_ENGLISH[description]=en;
    KOCHO_TECHNIQUE_HIRAGANA[name]=hiraganaName; KOCHO_TECHNIQUE_HIRAGANA[description]=hi;
    cards.push({hero,art:28+n,name,description,type:'ATTACK',range:[1,2,3,4,5,6],damage:2,cooldown:n?8:6,color:hero==='rebel'?'bg-red-900':'bg-fuchsia-900',energyCost:1,maxSlots:1,effectType:'PIERCE',technique:{spend:10,bonusPerFocus:1,repeat:n?2:1,shield:n?0:3},minStage:6});
  }
  return cards;
});

export const clampKochoFocus = (value: number) => Math.min(10,Math.max(0,Number.isFinite(value)?Math.floor(value):0));
export function resolveHeroTechnique(focus:number, technique?:HeroTechnique, utility=false) {
  const available=clampKochoFocus(focus), spent=Math.min(available,technique?.spend??0);
  return { focus:clampKochoFocus(available-spent+(technique?.gain??0)), spent,
    bonusDamage:spent*(technique?.bonusPerFocus??0), repeat:Math.max(1,technique?.repeat??1),
    shield:(technique?.shield??0)+(utility?spent:0), heal:technique?.heal??0,
    strength:technique?.strength??0, barrier:technique?.barrier??0,
    reduceCooldown:technique?.reduceCooldown??0,retreat:technique?.retreat??0,reverse:Boolean(technique?.reverse) };
}
