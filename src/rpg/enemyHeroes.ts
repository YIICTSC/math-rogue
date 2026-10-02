import { assetUrl } from "../utils/assetPaths";
import { CARDS_LIBRARY } from '../constants';
import { getAllEnemyNamesByTheme, getTrueBossByTheme } from '../data/enemyCatalogs';
import { ENDLESS_BOSSES, getEndlessBossSpritePath } from '../data/endlessMode';
import { getThemedHumanoidEnemySpritePath, getThemedMajorBossEnemySpritePath, getThemedMonsterEnemySpritePath, type VisualThemeId } from '../data/visualThemes';
import { getEnemyIllustrationPaths } from '../utils/enemyIllustration';
import type { Card, Character, Player, Relic } from '../types';
export interface EnemyHero extends Character { relic:Relic; signature:Omit<Card,'id'>; role:string; }
const styles = [
 {name:'突破',test:/剣|戦|番長|騎士|獣|竜|体育|ボール|ゴリラ/,cards:['BASH','IRON_WAVE','HEADBUTT'],strength:2,block:0,draw:0,heal:0},
 {name:'守護',test:/盾|守|鎧|石|岩|校長|巨|門/,cards:['IRON_WAVE','DEFEND','BASH'],strength:0,block:8,draw:0,heal:0},
 {name:'攪乱',test:/毒|影|闇|呪|幽|忍|虫|蜘蛛/,cards:['POISON_STAB','NEUTRALIZE','SLICE'],strength:0,block:3,draw:1,heal:0},
 {name:'知略',test:/本|書|知|学|魔|星|月|理|数|時計/,cards:['BEAM_CELL','POMMEL_STRIKE','QUICK_SLASH'],strength:0,block:0,draw:1,heal:2},
 {name:'疾風',test:/鳥|風|翼|速|走|飛|猫|犬/,cards:['SLICE','QUICK_SLASH','TWIN_STRIKE'],strength:1,block:0,draw:1,heal:0},
 {name:'再生',test:/花|森|木|水|海|雪|歌|音|給食/,cards:['IRON_WAVE','NEUTRALIZE','CLEAVE'],strength:0,block:4,draw:0,heal:3},
];
const cache=new Map<VisualThemeId,EnemyHero[]>();
const usedRelicEffects=new Map<VisualThemeId,Set<string>>();
function uniqueInnate(theme:VisualThemeId,style:typeof styles[number],hash:number) {
 const used=usedRelicEffects.get(theme)||new Set<string>();usedRelicEffects.set(theme,used);
 const roleIndex=styles.indexOf(style);
 const fits=(strength:number,block:number,draw:number,heal:number)=>{
  const power=strength*3+block+draw*4+heal*2;
  const roleChecks=[strength>=1,block>=4,draw>=1,draw>=1,draw>=1||strength>=1,heal>=2];
  return power>=7&&power<=16&&roleChecks[roleIndex];
 };
 const options:Array<{strength:number;block:number;draw:number;heal:number}>=[];
 for(let strength=0;strength<=2;strength++)for(let block=0;block<=12;block++)for(let draw=0;draw<=2;draw++)for(let heal=0;heal<=4;heal++)if(fits(strength,block,draw,heal))options.push({strength,block,draw,heal});
 const start=hash%options.length;
 for(let offset=0;offset<options.length;offset++){
  const choice=options[(start+offset)%options.length],key=JSON.stringify(choice);
  if(!used.has(key)){used.add(key);return choice;}
 }
 throw new Error(`No unique starter relic remains for ${theme} ${style.name}`);
}
export function getEnemyHeroes(theme:VisualThemeId):EnemyHero[] {
 if(cache.has(theme))return cache.get(theme)!;
 const boss=getTrueBossByTheme(theme);
 const names=[...new Set([...getAllEnemyNamesByTheme(theme),boss.name,theme==='magic'?'真・大魔女校長':'真・校長先生',...ENDLESS_BOSSES.filter(b=>b.arc===theme).map(b=>b.name),...(theme==='high-school'?['あずき','ドドメデス','ゲンゾー']:[])])];
 const heroes=names.map((name,index):EnemyHero=>{
  const id=`RPG_ENEMY:${theme}:${name}`;
  const hash=Array.from(name).reduce((n,c)=>(Math.imul(n,31)+c.codePointAt(0)!)>>>0,7);
  const style=styles.find(s=>s.test.test(name))||styles[hash%styles.length];
  const innate=uniqueInnate(theme,style,hash);
  const relic:Relic={id:`${id}:RELIC`,name:`${name}の${style.name}の証`,rarity:'STARTER',effectType:'START_BATTLE',rpgInnate:innate,description:`戦闘開始時、筋力${innate.strength}・ブロック${innate.block}・追加ドロー${innate.draw}・HP回復${innate.heal}。`};
  const base=CARDS_LIBRARY[style.cards[hash%style.cards.length]];
  const signature={...base,name:`${name}の秘技`,description:base.description};
  const enemy={name,enemyType:name===boss.name||name.startsWith('真・')?'THE_HEART':'GENERIC',phase:name.startsWith('真・')?2:1};
  const endless=ENDLESS_BOSSES.find(b=>b.arc===theme&&b.name===name);
  const aliases:Record<string,string>={'バスケットボール':'体育館のバスケットボール','用務員さん':'激怒した用務員さん','真・校長先生':'校長先生'};
  const special:Record<string,string>={'あずき':'sprites/high-school/azuki/idle.webp','ドドメデス':'enemy-illustrations/ドドメデス.webp','ゲンゾー':'enemy-illustrations/ゲンゾー.webp'};
  const imageData=(theme==='high-school'&&special[name]?assetUrl(special[name]):null)||(endless&&endless.floor<=50?getEndlessBossSpritePath(endless,'idle'):null)||getThemedMajorBossEnemySpritePath(enemy,theme)||getThemedHumanoidEnemySpritePath(enemy,theme,'idle')||getThemedMonsterEnemySpritePath(enemy,theme)||getEnemyIllustrationPaths(aliases[name]||name)[0];
  // Each hero has an exclusive signature plus a reproducible, balanced ten-card loadout.
  const extra=['BASH','NEUTRALIZE','IRON_WAVE','HEADBUTT','THUNDERCLAP','TWIN_STRIKE','POMMEL_STRIKE','CLEAVE','POISON_STAB','QUICK_SLASH','SLICE','BEAM_CELL'];
  return {id,name,description:`${style.name}を得意とする冒険者。固有の証と専用の秘技を携えて旅に出る。`,maxHp:68+hash%13,gold:50,startingRelicId:relic.id,deckTemplate:['STRIKE','STRIKE','DEFEND','DEFEND',...style.cards,extra[hash%extra.length],extra[(hash>>>9)%extra.length]],color:'#77c8b4',imageData,relic,signature,role:style.name};
 });
 cache.set(theme,heroes);return heroes;
}
export function enemyHeroDeck(hero:EnemyHero):Card[] {
 return [...hero.deckTemplate.map(key=>CARDS_LIBRARY[key]),hero.signature].map((card,i)=>({...card,id:`${hero.id}:CARD:${i}`}));
}
export function applyEnemyHeroRelics(player:Player):number {
 let draw=0;
 for(const relic of player.relics){const effect=relic.rpgInnate;if(!effect)continue;player.strength+=effect.strength;player.block+=effect.block;player.currentHp=Math.min(player.maxHp,player.currentHp+effect.heal);draw+=effect.draw;}
 return draw;
}
