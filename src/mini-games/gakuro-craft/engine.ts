import {MAP_WIDTH,MAP_HEIGHT,CENTER_X,CENTER_Z,LEGACY_OFFSET_X,LEGACY_OFFSET_Z,LEGACY_SIZE,tileAt,mapInside} from './map';
export {MAP_WIDTH,MAP_HEIGHT,CENTER_X,CENTER_Z} from './map';
import type {PetKind} from './pets';
import {gameCommand,tickGames,type GameCommand,type HomeGame} from './homeGames';
import {homeAt,enterHome} from './homeSocial';
import type {Home} from './progression';
import { newProgress, migrateProgress, progressCommand, recordWork, refreshDay, shopRows, leaveHome, petCommand, type HomeItem, type Progress } from './progression';
import { avatarOf, type Avatar } from './avatar';
import type { KartQuestion } from '../gakuro-kart/learning';

export const SIZE = MAP_WIDTH, CAPACITY = 40, MAX_ENERGY = 100, QUIZ_ENERGY = 30, GROW_SECONDS = 90;
import { MATERIALS, BUILDINGS, CRAFTABLES, RECIPES, type Material, type Building, type Craftable, type Inventory } from './materials';
export { MATERIALS, BUILDINGS, CRAFTABLES, RECIPES, type Material, type Building, type Craftable, type Inventory } from './materials';
export type Tile = { ground: 'grass' | 'sand' | 'water'; nature: 'tree' | 'rock' | null; blocks: Building[]; owner: string; crop: number | null; watered: boolean; regrow: number; regrowKind?: 'tree' | 'rock'; revision: number; fruitAt?: number;homeOwner?:string;homeName?:string;homeLevel?:number };
export type Player = { spectator?: boolean; id: string; profileId:string;progress:Progress;indoors:boolean;homeTile?:number; name: string; color: number; x: number; z: number; energy: number; bag: Inventory; correct: number; actions: number; dx: number; dz: number; inputAt: number; actionAt: number; avatar: Avatar; coins: number; buffUntil: number; fishing?:{tile:number;biteAt:number;expires:number}; lastAction?: {seq:number;kind:string;tile:number;at:number} };
export type World = {width:number;height:number;games:Record<string,HomeGame>;homeViews:Record<number,Home>; seed: number; time: number; revision: number; tiles: Tile[]; players: Record<string, Player>; donated: number; harvested: number; built: number; paused: boolean;villageLevel:number;builtSites:number[];residents:Record<string,{id:string;bag:Inventory;coins:number;energy:number;correct:number;progress:Progress}> };
export type Tool = 'gather' | 'plant' | 'water' | 'harvest' | 'fish' | 'remove' | 'build' | 'pick';
export type Command = GameCommand | {type:'pet_care'} | {type:'pet_name';name:string} | { type: 'move'; dx: number; dz: number } | { type: 'act'; tool: Tool; tile: number; building?: Building } | { type: 'craft'; material: Craftable } | { type: 'appearance'; avatar: Avatar } | { type: 'eat' } | { type: 'buy'; material: Material } | {type:'quest_accept'|'quest_claim';id:string} | {type:'home_claim';tile:number;petKind?:PetKind;petName?:string} | {type:'home_enter'|'home_leave'|'home_upgrade';tile?:number} | {type:'home_place';slot:number;item:HomeItem;rotation?:number} | {type:'home_make';item:HomeItem} | {type:'home_rotate'|'home_use';slot:number} | {type:'home_move';slot:number;target:number} | {type:'home_remove';slot:number} | { type: 'donate' } | { type: 'quiz' } | { type: 'answer'; token: string; option: number };
export type PublicQuestion = Omit<KartQuestion, 'correct'>;
export type Reply = { type: 'notice'; text: string; cue?: string } | { type: 'quiz'; token: string; question: PublicQuestion } | { type: 'answer'; token: string; correct: boolean; answer: string; energy: number; elapsedMs: number; question: PublicQuestion; selected: string };
export const indexOf = (x: number, z: number) => tileAt(x,z);
export const inside = (x: number, z: number) => mapInside(x,z);
const random = (seed: number, i: number) => ((Math.imul(seed ^ i, 1664525) + 1013904223) >>> 0) / 4294967296;
export function createWorld(seed = 1): World {
  const tiles: Tile[] = [];
  for (let z = 0; z < MAP_HEIGHT; z++) for (let x = 0; x < SIZE; x++) {
    const i = z * SIZE + x, distance = Math.hypot(x-CENTER_X,z-CENTER_Z), coastDistance=Math.hypot((x-CENTER_X)/3,(z-CENTER_Z)/2), coast = 16 + Math.sin((20+(x-CENTER_X)/3)*.6)*1.8 + Math.cos((20+(z-CENTER_Z)/2)*.7);
    const water = coastDistance > coast || (x > CENTER_X+5 && x < CENTER_X+9 && z > CENTER_Z-11 && z < CENTER_Z+5);
    const originalArea=x>=LEGACY_OFFSET_X&&x<LEGACY_OFFSET_X+LEGACY_SIZE&&z>=LEGACY_OFFSET_Z&&z<LEGACY_OFFSET_Z+LEGACY_SIZE;
    const resourceIndex=originalArea?(z-LEGACY_OFFSET_Z)*LEGACY_SIZE+x-LEGACY_OFFSET_X:i+LEGACY_SIZE**2;
    const r = random(seed, Math.imul(resourceIndex+17, 374761393));
    const nature = !water && distance > 4 && r < .19 ? 'tree' : !water && distance > 4 && r < .27 ? 'rock' : null;
    tiles.push({ ground: water ? 'water' : coastDistance > coast - 1.7 ? 'sand' : 'grass', nature, blocks: [], owner: '', crop: null, watered: false, regrow: 0, revision: 0 });
  }
  return {width:MAP_WIDTH,height:MAP_HEIGHT, seed, time: 0, revision: 0, tiles, players: {}, donated: 0, harvested: 0, built: 0, paused: false,villageLevel:0,builtSites:[],residents:{},games:{},homeViews:{} };
}
export function addPlayer(w: World, id: string, name: string, color = 0, avatar?: Avatar, profileId=id) {
  if (Object.keys(w.players).length >= CAPACITY || w.players[id] || !id || id.length > 100) return false;
  if(Object.values(w.players).some(p=>p.profileId===profileId)||(!w.residents[profileId]&&Object.keys(w.residents).length>=160))return false;
  const n = Object.keys(w.players).length;
  w.players[id] = { id,profileId,progress:newProgress(),indoors:false, name: name.trim().slice(0, 16) || 'Guest', color: Number.isInteger(color) ? Math.max(0, Math.min(5, color)) : 0, x: CENTER_X-1.5+n%4, z: CENTER_Z-1.5+Math.floor(n/4)%4,
    energy: MAX_ENERGY, bag: { wood: 12, stone: 8, seed: 6, crop: 0, fish: 0, plank: 4, brick: 0, flower: 0, lamp: 1, bench: 0, roof: 0, fence: 0, window: 0, campfire: 0, fruit: 0, meal: 0 }, avatar: avatarOf(avatar,color), coins: 0, buffUntil: 0, correct: 0, actions: 0, dx: 0, dz: 0, inputAt: 0, actionAt: -1 };
  const saved=w.residents[profileId];if(saved){const p=w.players[id];p.bag={...saved.bag};p.coins=saved.coins;p.energy=Math.max(0,Math.min(100,saved.energy));p.correct=saved.correct;p.progress=migrateProgress(saved.progress);for(const t of w.tiles){let changed=false;if(t.owner===saved.id){t.owner=id;changed=true;}if(t.homeOwner===saved.id){t.homeOwner=id;t.homeName=p.name;changed=true;}if(changed)t.revision=++w.revision;}}
  return true;
}
export const walkable = (w: World, x: number, z: number) => {
  if (!inside(x, z)) return false;
  const t = w.tiles[indexOf(x, z)]; return (!t.nature && t.blocks.length < 2 && (t.ground !== 'water' || t.blocks[0] === 'plank'));
};
export const mature = (w: World, t: Tile) => t.crop !== null && w.time - t.crop >= (t.watered ? GROW_SECONDS / 2 : GROW_SECONDS);
export const raining = (w: World) => (Math.floor(w.time/240)+w.seed)%3===1 && w.time%240>48 && w.time%240<156;
const notice = (text: string, cue?:string): Reply => ({ type: 'notice', text, cue });
function feedback(w:World,p:Player,kind:string,tile:number){p.lastAction={seq:(p.lastAction?.seq||0)+1,kind,tile,at:w.time};}
function touch(w: World, t: Tile) { t.revision = ++w.revision; }
export function setSpectator(w: World, id: string, enabled: boolean) {
  const p = w.players[id];
  if (!p || typeof enabled !== 'boolean') return false;
  if (enabled) {
    for (const game of Object.values(w.games)) if (game.players.includes(id)) gameCommand(w, p, { type: 'game_leave', key: game.key });
    if (p.indoors) leaveHome(w, p);
    p.dx = p.dz = 0; p.fishing = undefined;
  }
  p.spectator = enabled; w.revision++; return true;
}
export function applyCommand(w: World, id: string, raw: unknown): Reply | undefined {
  const p = w.players[id]; if (!p || p.spectator || !raw || typeof raw !== 'object') return;
  const c = raw as Command;
  if(typeof c.type!=='string')return;
  if (c.type === 'move') {
    if (!Number.isFinite(c.dx) || !Number.isFinite(c.dz) || Math.abs(c.dx) > 1 || Math.abs(c.dz) > 1) return;
    if(p.indoors){p.dx=p.dz=0;return;}const n = Math.max(1, Math.hypot(c.dx, c.dz)); p.dx = c.dx / n; p.dz = c.dz / n; p.inputAt = w.time; return;
  }
  if (w.paused) return notice('ホストが戻るまで一時停止中です。');
  if (c.type === 'appearance') { p.avatar=avatarOf(c.avatar,p.color);p.color=p.avatar.shirt;return notice('見た目を変更しました。','avatar'); }
  if(c.type==='home_leave'){leaveHome(w,p);return;}
  if(c.type.startsWith('game_'))return gameCommand(w,p,c as GameCommand);
  if(c.type.startsWith('pet_'))return petCommand(w,p,c);
  if (w.time - p.actionAt < .35) return;
  if(c.type.startsWith('quest_')||c.type.startsWith('home_'))return progressCommand(w,p,c);
  if(p.indoors&&['act','donate','buy'].includes(c.type))return notice('島の作業は家を出てから行いましょう。');
  if (c.type === 'eat') {
    if(!p.bag.meal)return notice('料理がありません。');
    p.bag.meal--;p.buffUntil=w.time+60;p.actionAt=w.time;feedback(w,p,'eat',indexOf(p.x,p.z));return notice('おいしい！60秒間、移動が速くなります。','eat');
  }
  if(c.type==='buy'){
    const product=shopRows(w).find(row=>row.material===c.material);if(!product)return notice('島が発展すると買える品物です。');
    if(Math.hypot(p.x-CENTER_X,p.z-CENTER_Z)>4)return notice('島の中央の広場で買い物できます。');
    const price=product.price;if(p.coins<price)return notice('コインが足りません。納品で集めましょう。');
    p.coins-=price;p.bag[c.material]++;p.actionAt=w.time;return notice('買い物しました！','craft');
  }
  if (c.type === 'craft') {
    if (!CRAFTABLES.includes(c.material)) return;
    if(c.material==='meal'&&!(p.indoors&&p.progress.home.furniture.some(f=>f.item==='campfire'))&&!w.tiles.some((t,i)=>t.blocks.includes('campfire')&&Math.hypot(i%SIZE+.5-p.x,Math.floor(i/SIZE)+.5-p.z)<3))return notice('たき火の近くで料理できます。');
    const recipe = RECIPES[c.material];
    if (Object.entries(recipe).some(([k, n]) => p.bag[k as Material] < n!)) return notice('材料が足りません。');
    if (p.energy < 3) return notice('問題に正解してエネルギーを回復しましょう。');
    for (const [k, n] of Object.entries(recipe)) p.bag[k as Material] -= n!;
    p.bag[c.material]++; p.energy -= 3; p.actionAt = w.time; p.actions++; recordWork(w,p,'craft',indexOf(p.x,p.z));feedback(w,p,'craft',indexOf(p.x,p.z));return notice('クラフトしました！','craft');
  }
  if (c.type === 'donate') {
    if (Math.hypot(p.x - CENTER_X, p.z - CENTER_Z) > 4) return notice('島の中央の広場で納品できます。');
    if (p.bag.crop + p.bag.fish < 1) return notice('作物か魚を納品しましょう。');
    if (p.bag.crop) p.bag.crop--; else p.bag.fish--;
    w.donated++;recordWork(w,p,'donate',indexOf(CENTER_X,CENTER_Z)); p.coins+=3; feedback(w,p,'donate',indexOf(CENTER_X,CENTER_Z));p.actionAt = w.time; p.bag.seed += 2; return notice('納品ありがとう！種2個と3コインを受け取りました。','donate');
  }
  if (c.type !== 'act' || !Number.isInteger(c.tile) || c.tile < 0 || c.tile >= w.tiles.length) return;
  const x = c.tile % SIZE + .5, z = Math.floor(c.tile / SIZE) + .5, t = w.tiles[c.tile];
  if (Math.hypot(x - p.x, z - p.z) > 2.9) return notice('もう少し近づいてください。');
  if(t.homeOwner)return notice('家の入口は片づけたり建築したりできません。');
  const cost = c.tool === 'fish' ? (p.fishing ? 6 : 2) : c.tool === 'gather' ? 5 : 3;
  if (p.energy < cost) return notice('問題に正解してエネルギーを回復しましょう。');
  let message = '',cue:string=c.tool,amount=1;
  if(c.tool==='pick'&&t.nature==='tree'){if((t.fruitAt||0)>w.time)return notice('果実は45秒で実ります。');p.bag.fruit+=2;t.fruitAt=w.time+45;message='果実を摘みました！';
  } else if (c.tool === 'gather' && t.nature) {
    p.bag[t.nature === 'tree' ? 'wood' : 'stone'] += 3; if (t.nature === 'tree') p.bag.seed++;
    t.regrowKind = t.nature; t.nature = null; t.regrow = w.time + 180; message = '素材を集めました！';
  } else if (c.tool === 'plant' && t.ground === 'grass' && !t.nature && !t.blocks.length && t.crop === null) {
    if (!p.bag.seed) return notice('種が足りません。木を採集するか、広場へ納品しましょう。');
    p.bag.seed--; t.crop = w.time; t.watered = false; t.owner = id; t.regrow = 0; message = '種をまきました。水やりで早く育ちます。';
  } else if (c.tool === 'water' && t.crop !== null && !t.watered) { t.watered = true; message = '水をあげました！';
  } else if (c.tool === 'harvest' && mature(w, t)) {
    p.bag.crop += 2; p.bag.seed += 2; w.harvested++; t.crop = null; t.watered = false; t.owner = ''; message = '収穫しました！';
  } else if (c.tool === 'fish' && t.ground === 'water' && !t.blocks.length) {
    if(!p.fishing){const biteAt=w.time+1.6+random(w.seed,c.tile+p.actions)*1.4;p.fishing={tile:c.tile,biteAt,expires:biteAt+1.5};message='浮きが沈んだら、もう一度作業ボタン！';cue='cast';}
    else {
      const f=p.fishing;p.fishing=undefined;
      if(f.tile!==c.tile||w.time<f.biteAt||w.time>f.expires){p.actionAt=w.time;feedback(w,p,'water',c.tile);return notice('魚が逃げました。沈んだ瞬間に引き上げましょう。','wrong');}
      const perfect=w.time-f.biteAt<.5;amount=perfect?2:1;p.bag.fish+=amount;message=perfect?'大成功！魚を2匹釣りました！':'魚が釣れました！';
    }
  } else if (c.tool === 'build' && c.building && BUILDINGS.includes(c.building) && !t.nature && t.crop === null && t.blocks.length < 4) {
    if (t.owner && t.owner !== id) return notice('ほかの人の建築は変更できません。');
    if (Math.hypot(x - CENTER_X, z - CENTER_Z) < 3) return notice('中央の広場は空けておきましょう。');
    if (t.ground === 'water' && !t.blocks.length && c.building !== 'plank') return notice('水の上には木の床で橋を架けられます。');
    if (t.blocks.length && ['flower', 'lamp', 'bench', 'roof', 'fence', 'window', 'campfire'].includes(t.blocks[t.blocks.length - 1])) return notice('飾りの上には積めません。');
    if (Object.values(w.players).some(q => !q.spectator && indexOf(q.x, q.z) === c.tile)) return notice('人がいる場所には置けません。');
    if (!p.bag[c.building]) return notice('材料が足りません。');
    p.bag[c.building]--; t.blocks.push(c.building); t.owner = id; t.regrow = 0; w.built++; message = '建築しました！';
  } else if (c.tool === 'remove' && t.blocks.length) {
    if (t.owner !== id) return notice('ほかの人の建築は変更できません。');
    if (Object.values(w.players).some(q => !q.spectator && indexOf(q.x, q.z) === c.tile)) return notice('人がいる場所は片づけられません。');
    p.bag[t.blocks.pop()!]++; if (!t.blocks.length) t.owner = ''; message = '片づけました。素材が戻りました。';
  } else return notice('この場所ではその作業はできません。');
  p.energy -= cost; p.actionAt = w.time; p.actions++; touch(w, t);if(cue!=='cast')recordWork(w,p,c.tool,c.tile,amount);feedback(w,p,c.tool,c.tile);return notice(message,cue);
}
export function tick(w: World, seconds: number) {
  if (w.paused || !Number.isFinite(seconds) || seconds <= 0) return;
  const dt = Math.min(.1, seconds); w.time += dt;tickGames(w,dt);
  for (const p of Object.values(w.players)) {
    if (p.spectator) continue;
    refreshDay(w,p);if(!p.indoors&&w.tiles[indexOf(p.x,p.z)]?.homeOwner)enterHome(w,p,indexOf(p.x,p.z));if(p.indoors){p.dx=p.dz=0;continue;}if(p.fishing&&(w.time>p.fishing.expires||Math.hypot(p.dx,p.dz)>.1))p.fishing=undefined;
    if (w.time - p.inputAt > .5 || p.energy <= 0) { p.dx = p.dz = 0; continue; }
    const speed = w.time < (p.buffUntil||0) ? 4.2 : 3.2, oldX = p.x, oldZ = p.z;
    const step = Math.min(speed * dt, p.energy / .7);
    if (walkable(w, p.x + p.dx * step, p.z)) p.x += p.dx * step;
    if (walkable(w, p.x, p.z + p.dz * step)) p.z += p.dz * step;
    p.energy = Math.max(0, p.energy - Math.hypot(p.x - oldX, p.z - oldZ) * .7);if(w.tiles[indexOf(p.x,p.z)]?.homeOwner)enterHome(w,p,indexOf(p.x,p.z));
  }
  const rain=raining(w);for (let i = 0; i < w.tiles.length; i++) { const t = w.tiles[i]; if(rain&&t.crop!==null&&!t.watered){t.watered=true;touch(w,t);}if (t.regrow && w.time >= t.regrow && !t.blocks.length && t.crop === null) {
    if (!Object.values(w.players).some(p => !p.spectator && indexOf(p.x, p.z) === i)) { t.nature = t.regrowKind || 'tree'; t.regrow = 0; touch(w, t); }
  }
  }
}
export class QuizBank {
  private pending = new Map<string, { token: string; q: KartQuestion; at: number }>();
  private serial = 0; private cursors = new Map<string, number>();
  constructor(private questions: KartQuestion[]) { if (!questions.length) throw new Error('No questions'); }
  forget(id: string) { this.pending.delete(id); this.cursors.delete(id); }
  ask(w: World, id: string): Reply | undefined {
    const p = w.players[id]; if (!p || p.spectator) return;
    p.dx = p.dz = 0;p.fishing=undefined;
    let pending = this.pending.get(id);
    if (!pending) { const index = this.cursors.get(id) || 0; pending = { token: `${w.seed}:${++this.serial}`, q: this.questions[index % this.questions.length], at: w.time }; this.cursors.set(id, index + 1); this.pending.set(id, pending); }
    const { correct: _correct, ...question } = pending.q;
    return { type: 'quiz', token: pending.token, question };
  }
  answer(w: World, id: string, token: unknown, option: unknown): Reply | undefined {
    const p = w.players[id], pending = this.pending.get(id);
    if (!p || p.spectator || !pending || token !== pending.token || !Number.isInteger(option) || (option as number) < 0 || (option as number) > 3 || w.paused) return;
    this.pending.delete(id); const { correct: answerIndex, ...question } = pending.q, correct = option === answerIndex;
    if (correct) { p.energy = Math.min(MAX_ENERGY, p.energy + QUIZ_ENERGY); p.correct++; }
    return { type: 'answer', token: pending.token, correct, answer: pending.q.options[answerIndex], question, selected: pending.q.options[option as number], energy: p.energy, elapsedMs: Math.max(0, (w.time - pending.at) * 1000) };
  }
}
