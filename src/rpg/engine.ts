import {legacyRegion} from './worldLandscape';
import {landscapeGate} from './landscapeMap';
import {applyRoomAction,currentVoxelRoom,type RoomAction,type VoxelRoom} from './voxelRooms';
import {applyVoxel,moveLandscape2D,advanceVoxelWater,type VoxelAction,type VoxelWorld} from './voxel';
import {applyFarm,advanceFarm,type FarmState,type FarmAction} from './farm/model';
import {applyCity,advanceCity,type CityState,type CityAction} from './city/model';
import {applyTown,advanceTown,newTown,type TownState,type TownAction} from './town/model';
import {applySocial,advanceSocial,newSocial,type SocialWorld,type SocialMemory,type SocialAction} from './social';
import type {CustomHero} from './customHero';
import {recoverGatherEnergy,GATHER_ENERGY_MAX} from './energy';
import { createLife, advanceLife, applyLifeAction, lifeWalkable, type LifeWorld, type LifePlayer, type LifeAction } from './life';
import { BIOMES, biomeAt, biomeSurface, riverAt, fishingPondAt } from "./biomes";
import { STORIES, storyForSite, applyStory, type StoryAction, type StoryProgress } from "./stories";
import { applyDuel, advanceDuels, leaveDuels, type Duel, type DuelAction } from "./duels";
import type { Card } from '../types';
import { createActivities, advanceActivities, applyActivity, activityBusy, acceptProfile, leaveActivities, type Activities, type ActivityAction, type Mutation } from './activities';
import { cloneRpgAdventureSetup, type RpgAdventureSetup } from "./setup";
import { getEncounterEnemyNamePool } from "../services/geminiService";
import type { VisualThemeId } from "../data/visualThemes";
import { ROAMING_NPC_EVENTS } from './roamingNpcs';

// Three times the width and twice the height: six times the explorable area.
export const WIDTH = 192,
  HEIGHT = 88,
  CAPACITY = 40;
export type Tile = "grass" | "forest" | "water" | "road" | "stone";
export type SiteKind =
  | "story"
  | "town"
  | "rest"
  | "event"
  | "npc"
  | "treasure"
  | "enemy"
  | "guardian"
  | "boss"
  | "dungeon" | "fragment" | "secret" | "seal";
export type BonusRankingKind =
  | "BATTLES"
  | "TREASURES"
  | "STEPS"
  | "INTERACTIONS";
export const BONUS_RANKING_KINDS: BonusRankingKind[] = [
  "BATTLES",
  "TREASURES",
  "STEPS",
  "INTERACTIONS",
];
export type RpgEndReason = "clear" | "timeout";
export type RpgRankingCategory = "KILLS" | "DAMAGE" | "CORRECT" | "BONUS";
export interface RpgRankingAward {
  category: RpgRankingCategory;
  rank: number;
  score: number;
}
export interface Site {
  storyVariant?:number;
  storyId?: string;
  storyRole?: "npc" | "goal";
  id: string;
  x: number;
  y: number;
  kind: SiteKind;
  name: string;
  hp: number;
  maxHp: number;
  cleared: boolean;
  raidSize?: number;
  nativeInitialized?: boolean;
  bossPhase?: 1 | 2 | 3;
  eventNumber?: number;
  npcEventId?: string;
  enemyNamesByTheme?: Record<VisualThemeId, string>;
}
export interface NativeProfile {
  hp: number;
  maxHp: number;
  gold: number;
  character: string;
  image: string;
  deckSize: number;
  correctAnswers?: number;
  deck?: Card[];
  mutationRevision?: number;
  visualTheme?: VisualThemeId;
}
export interface NativeScene {
  token: string;
  siteId: string;
  damage: number;
  sequence: number;
  teamPower: number;
}
export interface Adventurer {
  position3D?: {x:number;z:number;y?:number;vy?:number;swimming?:boolean;surface2D?:boolean;oxygen?:number;waterAt?:number};
  voxelDiscoveries?:string[];
  voxelAt?:number;
  hero?:CustomHero;
  memory?:SocialMemory;
  lastPlayerTalk?:number;
  life?: LifePlayer;
  stories?: Record<string, StoryProgress>;
  spectator?: boolean;
  id: string;
  name: string;
  x: number;
  y: number;
  color: number;
  hp: number;
  maxHp: number;
  gold: number;
  team: string | null;
  claimed: string[];
  message: string;
  lastMove: number;
  profile?: NativeProfile;
  completedBattles: number;
  totalDamage: number;
  correctAnswers: number;
  moveCount: number;
  interactionCount: number;
  siteUses: Record<string, number>;
  nativeScene?: NativeScene;
  mutationRevision?: number;
  mutations?: Mutation[];
  duelId?: string;
  rivalKills: number;
  dungeonId?: string;
  arcadeUses?: number;
  arcadeResult?: string;
  arcadeOutcome?: {token:string;game:"FLIP"|"ROULETTE"|"SLOT";choice:number;roll:number;win:boolean;correctCount:number;gold:number;heal:number;card?:Card};
  arcadePending?: {token:string;siteId:string;game:"FLIP"|"ROULETTE"|"SLOT";choice:number;roll:number};
  npcEventsSeen?: string[];
  npcEventResults?: Record<string, { choiceId: string; outcome: 'normal' | 'win' | 'lose' | 'fallback' }>;
}
export interface World {
 voxelRooms?:VoxelRoom[];
 voxels?:VoxelWorld;
 campaignVersion?: 2;
 endingProgress?: Record<string,number>;
 city?:CityState;
  social?:SocialWorld;
  town?:TownState;
  farm?:FarmState;
  life: LifeWorld;
  nativeMode: true;
  gameMode: "COOP" | "BATTLE_ROYALE";
  duels: Duel[];
  activities: Activities;
  seed: number;
  setup?: RpgAdventureSetup;
  tiles: Tile[];
  sites: Site[];
  players: Record<string, Adventurer>;
  logs: string[];
  won: boolean;
  timeLimitMinutes: number;
  deadlineAt: number;
  started: boolean;
  ended: boolean;
  endReason: RpgEndReason | null;
  endedAt: number | null;
  rewardAt: number | null;
  rankingAwards: Record<string, RpgRankingAward>;
  bonusRankingKind: BonusRankingKind;
  revision: number;
}
export type Action = RoomAction | VoxelAction | FarmAction | CityAction | TownAction | SocialAction | LifeAction | StoryAction | DuelAction | ActivityAction
  | { type: "move"; dx: number; dy: number }
  | { type: "team"; target: string | null }
  | { type: "native-enter"; siteId: string }
  | { type: "native-ready"; token: string; maxHp: number }
  | {
      type: "native-damage";
      token: string;
      total: number;
      sequence: number;
      phase?: 1 | 2 | 3;
    }
  | {
      type: "native-finish";
      token: string;
      outcome: "complete" | "victory" | "defeat";
      profile: NativeProfile;
      battleDamage?: number;
    }
  | { type: "native-learning"; correctAnswers:number }
  | { type: "native-profile"; profile: NativeProfile }
  | { type: "rpg-start" };
export function random(seed: number) {
  let n = seed >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const distance = (
  a: { x: number; y: number },
  b: { x: number; y: number },
) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const isBattleSite = (s: Site) =>
  ["enemy", "guardian", "boss"].includes(s.kind);
export const isSharedSite = (s: Site) =>
  s.kind === "guardian" || s.kind === "boss";
export function siteUnavailable(
  w: World,
  p: Adventurer,
  s: Site,
): string | null {
  if (p.nativeScene || activityBusy(w,p)) return "現在のシーンを完了してください。";
  if (w.ended)
    return w.endReason === "timeout" ? "時間切れ！" : "魔王を倒しました！";
  if (w.won&&!w.city) return "魔王を倒しました！";
  if (s.cleared) return "討伐済みです。";
  if (s.kind === "treasure" && p.claimed.includes(s.id))
    return "この宝箱は開封済みです。";
  if (s.kind === "npc" && p.npcEventsSeen?.includes(s.id))
    return "この旅人とのイベントは解決済みです。";
  if (["town", "rest", "event"].includes(s.kind) && !w.city) {
    const remaining =
      3 - ((p.completedBattles || 0) - (p.siteUses?.[s.id] || 0));
    if (remaining > 0)
      return `利用まであと${remaining}回、戦闘に勝利してください。`;
  }
  if (
    s.kind === "boss" &&
    w.sites.some((q) => q.kind === "guardian" && !q.cleared)
  )
    return "6地域の試験官を倒すと魔王城の結界が解除されます。";
  return null;
}
export function validProfile(profile: NativeProfile): boolean {
  return (
    !!profile &&
    [profile.hp, profile.maxHp, profile.gold, profile.deckSize].every(
      Number.isFinite,
    ) &&
    profile.maxHp > 0 &&
    profile.hp >= 0 &&
    profile.hp <= profile.maxHp &&
    profile.gold >= 0 &&
    Number.isInteger(profile.deckSize) && profile.deckSize >= 0 &&
    (profile.deck === undefined || (Array.isArray(profile.deck) && profile.deck.length === profile.deckSize && profile.deck.length <= 500 && new Set(profile.deck.map(c=>c?.id)).size === profile.deck.length && profile.deck.every(c=>c && typeof c.id==='string' && typeof c.name==='string' && typeof c.description==='string' && Number.isFinite(c.cost)))) &&
    typeof profile.character === "string" &&
    typeof profile.image === "string" &&
    (profile.correctAnswers === undefined ||
      (Number.isFinite(profile.correctAnswers) && profile.correctAnswers >= 0))
  );
}
function rotateEnemyName(w: World, site: Site) {
  const siteIndex = w.sites.indexOf(site);
  const nextNames = { ...site.enemyNamesByTheme };
  const themes: VisualThemeId[] = ["elementary", "high-school", "magic"];
  themes.forEach((theme, themeIndex) => {
    const previousName = nextNames[theme] || site.name;
    const candidates = getEncounterEnemyNamePool(theme).filter(
      (name) => name !== previousName,
    );
    if (candidates.length === 0) return;
    const roll = random(
      (
        w.seed +
        Math.imul(w.revision + 1, 0x9e3779b9) +
        siteIndex +
        Math.imul(themeIndex + 1, 0x85ebca6b)
      ) >>> 0,
    )();
    nextNames[theme] = candidates[Math.floor(roll * candidates.length)];
  });
  site.enemyNamesByTheme = nextNames as Record<VisualThemeId, string>;
  site.name = site.enemyNamesByTheme[w.setup?.visualTheme || "elementary"] || site.name;
}
function recordLearning(p:Adventurer,count:number){const next=Math.max(p.correctAnswers||0,Math.floor(count));if(p.life)recoverGatherEnergy(p.life,next-(p.correctAnswers||0));p.correctAnswers=next;}
function applyNativeAction(
  w: World,
  p: Adventurer,
  action: Action,
  tell: (message: string) => boolean,
): boolean {
  if (w.ended && action.type !== "native-finish") return false;
  if(action.type === "native-learning") {
    if(!Number.isSafeInteger(action.correctAnswers)||action.correctAnswers<p.correctAnswers)return false;
    recordLearning(p,action.correctAnswers);w.revision++;return true;
  }
  if (action.type === "native-profile") {
    if (p.nativeScene || p.duelId || !validProfile(action.profile) || !acceptProfile(p,action.profile)) return false;
    p.profile = {...action.profile,visualTheme:action.profile.visualTheme || p.profile?.visualTheme};
    p.hp = action.profile.hp;
    p.maxHp = action.profile.maxHp;
    p.gold = action.profile.gold;
    if (action.profile.correctAnswers !== undefined)
      recordLearning(p,action.profile.correctAnswers);
    w.revision++;
    return true;
  }
  if (action.type === "native-enter") {
    const site = w.sites.find((s) => s.id === action.siteId);
    if (!site || !["enemy","guardian","boss","town","rest","event","treasure"].includes(site.kind) || distance(site, p) > 2) return false;
    const reason = siteUnavailable(w, p, site);
    if (reason) return tell(reason);
    if (["town", "rest", "event"].includes(site.kind))
      p.siteUses = { ...p.siteUses, [site.id]: p.completedBattles || 0 };
    if (site.kind === "treasure") p.claimed.push(site.id);
    if (["town", "rest", "event", "treasure"].includes(site.kind))
      p.interactionCount = (p.interactionCount || 0) + 1;
    if (site.kind === "boss" && !site.raidSize)
      site.raidSize = Object.values(w.players).filter(p => !p.spectator).length;
    const teamPower = p.team
      ? 2 *
        Object.values(w.players).filter(
          (q) => q.id !== p.id && q.team === p.team && distance(p, q) <= 5,
        ).length
      : 0;
    p.nativeScene = {
      token: `${p.id}:${w.revision}:${site.id}`,
      siteId: site.id,
      damage: 0,
      sequence: 0,
      teamPower,
    };
    return tell("本編のシーンをプレイ中です。");
  }
  if (!("token" in action) || action.token !== p.nativeScene?.token)
    return false;
  const scene = p.nativeScene;
  const site = w.sites.find((s) => s.id === scene.siteId)!;
  if (action.type === "native-ready") {
    if (
      !isSharedSite(site) ||
      !Number.isFinite(action.maxHp) ||
      action.maxHp <= 0
    )
      return false;
    if (!site.nativeInitialized) {
      site.hp = site.maxHp = Math.ceil(
        action.maxHp *
          (site.kind === "boss" ? Math.max(1, site.raidSize || 1) : 1),
      );
      if (site.kind === "boss") site.bossPhase = 1;
      site.nativeInitialized = true;
    }
    w.revision++;
    return true;
  }
  if (action.type === "native-damage") {
    if (
      !site.nativeInitialized ||
      !isSharedSite(site) ||
      site.cleared ||
      !Number.isFinite(action.total) ||
      !Number.isSafeInteger(action.sequence) ||
      action.sequence <= scene.sequence
    )
      return false;
    if (site.kind === "boss" && action.phase !== site.bossPhase)
      return false;
    const delta = action.total - scene.damage;
    scene.damage = action.total;
    scene.sequence = action.sequence;
    p.totalDamage = (p.totalDamage || 0) + Math.max(0, Math.floor(delta));
    site.hp = Math.max(0, Math.min(site.maxHp, site.hp - delta));
    if (site.hp === 0) {
      if (site.kind === "boss" && (site.bossPhase || 1) < 3) {
        site.bossPhase = ((site.bossPhase || 1) + 1) as 2 | 3;
        site.hp = site.maxHp;
        for (const player of Object.values(w.players)) {
          if (player.nativeScene?.siteId === site.id) {
            player.nativeScene.damage = 0;
          }
        }
        log(w, site.bossPhase === 2 ? "魔王が真の姿を現した！" : "魔王が最終形態に変身した！");
      } else {
        site.cleared = true;
        log(w, `${site.name}を討伐！`);
      }
      if (site.kind === "boss" && site.cleared && w.gameMode !== "BATTLE_ROYALE") {
        w.won = true;
        endWorld(w, "clear");
      }
    }
    w.revision++;
    return true;
  }
  if (action.type === "native-finish") {
    if (
      !validProfile(action.profile) ||
      !["complete", "victory", "defeat"].includes(action.outcome) || !acceptProfile(p,action.profile)
    )
      return false;
    if (
      action.outcome === "victory" &&
      (isBattleSite(site) || site.kind === "event")
    ) {
      if (isSharedSite(site) && !site.cleared) return false;
      p.completedBattles = (p.completedBattles || 0) + 1;
      if (site.kind === "enemy") rotateEnemyName(w, site);
    }
    if (action.outcome === "defeat") {
      const town = w.sites.find(s=>s.kind === "town")!;
      p.x = town.x;
      p.y = town.y;
    }
    if (Number.isFinite(action.battleDamage) && action.battleDamage! >= 0)
      p.totalDamage =
        (p.totalDamage || 0) + Math.floor(action.battleDamage!);
    p.profile = {...action.profile,visualTheme:action.profile.visualTheme || p.profile?.visualTheme};
    p.hp = action.profile.hp;
    p.maxHp = action.profile.maxHp;
    p.gold = action.profile.gold;
    if (action.profile.correctAnswers !== undefined)
      recordLearning(p,action.profile.correctAnswers);
    delete p.nativeScene;
    return tell(
      action.outcome === "defeat" ? "町に戻りました。" : "探索を続けよう。",
    );
  }
  return false;
}
export function createWorld(
  seed: number,
  setup?: RpgAdventureSetup,
  timeLimitMinutes = 30,
  now = Date.now(),
  gameMode: World["gameMode"] = "COOP",
): World {
  const rng = random(seed),
    tiles: Tile[] = [];
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) {

      tiles.push(
        x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1
          ? "forest"
          : riverAt(x,y)||fishingPondAt(x,y)
            ? "water"
            : rng() < biomeSurface(x,y).trees
              ? "forest"
              : "grass",
      );
    }
  const sites: Site[] = [];
  function add(
    kind: SiteKind,
    name: string,
    x: number,
    y: number,
    hp = 0,
    enemyNamesByTheme?: Record<VisualThemeId, string>,
  ) {
    sites.push({
      id: `site-${sites.length}`,
      kind,
      name,
      x: Math.round(x * 3),
      y: Math.round(y * 2),
      hp,
      maxHp: hp,
      cleared: false,
      ...(enemyNamesByTheme ? { enemyNamesByTheme } : {}),
    });
  }
  add("town", "木漏れ日の町", 10, 32);
  // A recovery hub in every biome keeps the expanded world usable after
  // three victories, without changing the per-location cooldown.
  add("rest", "旅人の焚き火", 10, 10);
  add("town", "星見の宿場", 158 / 3, 10);
  add("rest", "旅人の焚き火", 94 / 3, 32);
  add("rest", "旅人の焚き火", 94 / 3, 10);
  add("rest", "旅人の焚き火", 158 / 3, 32);
  for (const biome of BIOMES) add("guardian", `${biome.name}の試験官`, (biome.x-6)/3, (biome.y-5)/2);
  add("boss", "魔王城", 55, 5);
  add("dungeon", "森の協力ダンジョン", 18, 19);
  add("dungeon", "星の協力ダンジョン", 47, 27);
  add("fragment", "地図の断片", 7, 22);
  add("fragment", "地図の断片", 27, 10);
  add("fragment", "地図の断片", 54, 34);
  add("secret", "封印された秘密の遺跡", 57, 21);
  add("seal", "森の封印装置", 17, 7);
  add("seal", "水辺の封印装置", 35, 23);
  add("seal", "遺跡の封印装置", 48, 6);
  for (const story of STORIES) {
    const storyVariant=Math.floor(rng()*4);
    for (const role of ['npc','goal'] as const) {
      add('story',role==='npc'?story.npc:story.goal,(role==='npc'?story.x:story.goalX)/3,(role==='npc'?story.y:story.goalY)/2);
      Object.assign(sites.at(-1)!,{storyId:story.id,storyRole:role,storyVariant});
      sites.at(-1)!.name=role==='npc'?story.npc:storyForSite(sites.at(-1)!)!.goal;
    }
  }
  const activeTheme = setup?.visualTheme || "elementary";
  const themes: VisualThemeId[] = ["elementary", "high-school", "magic"];
  // Stratify encounters by biome instead of drawing every site from the
  // entire map. Jitter preserves seed variation; spacing prevents clusters.
  for (const biome of BIOMES) {
    const placements = [
      { kind: "enemy", dx: -14, dy: -10 },
      { kind: "enemy", dx: 14, dy: -6 },
      { kind: "enemy", dx: 0, dy: 14 },
      { kind: "event", dx: 22, dy: -12 },
      { kind: "treasure", dx: -20, dy: 14 },
      { kind: "treasure", dx: 22, dy: 14 },
    ] as const;
    for (const placement of placements) {
      const { kind } = placement;
      const target = { x: biome.x + placement.dx, y: biome.y + placement.dy };
      let candidates: Array<{x:number;y:number}> = [];
      for (const radius of [6, 12, WIDTH]) {
        for (let y = 4; y < HEIGHT - 4; y++) for (let x = 4; x < WIDTH - 4; x++) {
          const position = { x, y };
          if (biomeAt(x,y).id !== biome.id || distance(position,target) > radius) continue;
          if (kind === "enemy" && distance(position,biome) > 30) continue;
          if (sites.every(site => distance(site,position) >= 7)) candidates.push(position);
        }
        if (candidates.length) break;
      }
      if (!candidates.length) throw new Error(`No RPG site placement available in ${biome.id}`);
      const { x, y } = candidates[Math.floor(rng() * candidates.length)];
      const enemyNamesByTheme = kind === "enemy"
        ? Object.fromEntries(themes.map((theme) => {
            const names = getEncounterEnemyNamePool(theme);
            return [theme, names[Math.floor(rng() * names.length)]];
          })) as Record<VisualThemeId, string>
        : undefined;
      const name = enemyNamesByTheme?.[activeTheme]
        || (kind === "event" ? "？イベント" : "忘れられた宝箱");
      // Random candidates are already in expanded world coordinates.
      add(kind, name, x / 3, y / 2, 0, enemyNamesByTheme);
    }
  }
  // A roaming character appears in an out-of-the-way patch of each biome.
  // Their identity and exact location are seeded, so everyone in the room
  // discovers the same encounters while new worlds stay unpredictable.
  for (const biome of BIOMES) {
    const candidatesForBiome = ROAMING_NPC_EVENTS.filter(event => event.biome === biome.id);
    const npcEvent = candidatesForBiome[Math.floor(rng() * candidatesForBiome.length)];
    const candidates: Array<{x:number;y:number}> = [];
    const remoteCandidates: Array<{x:number;y:number}> = [];
    for (let y = 4; y < HEIGHT - 4; y++) for (let x = 4; x < WIDTH - 4; x++) {
      if (biomeAt(x, y).id !== biome.id) continue;
      const tile = tiles[y * WIDTH + x];
      const riverX = 90 + Math.round(Math.sin(y / 12) * 12);
      const riverbank = tile !== 'water' && tile !== 'forest' && Math.abs(x - riverX) === 2;
      const suitableTerrain = biome.id === 'forest'
        ? tile === 'forest'
        : biome.id === 'wetland'
          ? riverbank
          : biome.id === 'meadow'
            ? tile === 'grass' || tile === 'forest'
            : tile === 'grass';
      if (!suitableTerrain) continue;
      const position = {x,y};
      if (sites.every(site => distance(site, position) >= 9)) candidates.push(position);
      if (sites.every(site => distance(site, position) >= 7)) remoteCandidates.push(position);
    }
    const placementPool = candidates.length ? candidates : remoteCandidates;
    if (!placementPool.length) throw new Error(`No roaming NPC location available in ${biome.id}`);
    const {x,y} = placementPool[Math.floor(rng() * placementPool.length)];
    add('npc', npcEvent.name.ja, x / 3, y / 2);
    sites.at(-1)!.npcEventId = npcEvent.id;
  }
  // Clear sites first so a later clearing cannot erase a connecting road.
  for (const s of sites) {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
      tiles[(s.y + dy) * WIDTH + s.x + dx] = s.kind === "boss" ? "stone" : "grass";
  }
  const pave = (source: {x:number;y:number}, s: {x:number;y:number}) => {
    let x = source.x,
      y = source.y;
    const horizontalFirst = rng() > 0.5;
    while (x !== s.x || y !== s.y) {
      tiles[y * WIDTH + x] = "road";
      if (x !== s.x && (horizontalFirst || y === s.y)) x += Math.sign(s.x - x);
      else y += Math.sign(s.y - y);
    }
    tiles[s.y * WIDTH + s.x] = "road";
  };
  // The six hubs form two east-west roads and three north-south roads.
  // Their loops offer alternative routes rather than long dead-end branches.
  for (const [index, hub] of BIOMES.entries()) {
    for (const other of BIOMES.slice(index + 1)) {
      if ((hub.y === other.y && Math.abs(hub.x-other.x) === 64)
        || (hub.x === other.x && Math.abs(hub.y-other.y) === 44)) pave(hub,other);
    }
  }
  for (const site of sites) pave(biomeAt(site.x,site.y),site);
  const normalizedTimeLimit = timeLimitMinutes === 0 ? 0 : Math.max(
    1,
    Math.min(180, Math.floor(Number.isFinite(timeLimitMinutes) ? timeLimitMinutes : 30)),
  );
  return {
    campaignVersion: 2,
    endingProgress: {},
    nativeMode: true,
    gameMode,
    duels: [],
    activities: createActivities(),
    life: createLife(now),
    town:newTown(),
    seed,
    ...(setup ? { setup: cloneRpgAdventureSetup(setup) } : {}),
    tiles,
    sites,
    players: {},
    logs: ["異世界の冒険が始まる。6地域の試験官を倒し、魔王城の結界を解こう。"],
    won: false,
    timeLimitMinutes: normalizedTimeLimit,
    deadlineAt: normalizedTimeLimit ? now + normalizedTimeLimit * 60 * 1000 : 0,
    started: true,
    ended: false,
    endReason: null,
    endedAt: null,
    rewardAt: null,
    rankingAwards: {},
    bonusRankingKind:
      BONUS_RANKING_KINDS[Math.floor(rng() * BONUS_RANKING_KINDS.length)],
    revision: 0,
  };
}
export function addPlayer(w: World, id: string, name: string) {
  if (w.ended || w.players[id] || Object.keys(w.players).length >= CAPACITY) return false;
  w.players[id] = {
    id,
    name: name.trim().slice(0, 16) || "冒険者",
    x: w.sites.find(s=>s.kind === "town")!.x - 1 + (Object.keys(w.players).length % 3),
    y: w.sites.find(s=>s.kind === "town")!.y + (Math.floor(Object.keys(w.players).length / 3) % 2),
    color: Object.keys(w.players).length % 6,
    hp: 75,
    maxHp: 75,
    gold: 0,
    team: null,
    claimed: [],
    rivalKills: 0,
    completedBattles: 0,
    totalDamage: 0,
    correctAnswers: 0,
    moveCount: 0,
    interactionCount: 0,
    siteUses: {},
    life: {energy:GATHER_ENERGY_MAX,bag:{wood:4,stone:2},lastAction:0,crafted:[]},
    npcEventsSeen: [],
    message: "町で準備を整え、道に沿って探索しよう。",
    lastMove: 0,
  };
  log(w, `${w.players[id].name}が冒険に参加。`);
  w.revision++;
  return true;
}
export function removePlayer(w: World, id: string) {
  if (!w.players[id]) return;
  leaveDuels(w,id);
  leaveActivities(w,id);
  log(w, `${w.players[id].name}が退出。`);
  for(const r of w.social?.relations||[])if(r.people.includes(id)&&r.houseId)for(const qid of r.people){const q=w.players[qid];if(q?.life)q.life.homeId=w.life.houses.find(h=>h.owner===qid)?.id;}
  delete w.players[id];
  if(w.social){w.social.requests=w.social.requests.filter(r=>r.from!==id&&r.to!==id);w.social.relations=w.social.relations.filter(r=>!r.people.includes(id));}

  for (const p of Object.values(w.players))
    if (
      p.team &&
      !Object.values(w.players).some((q) => q.id !== p.id && q.team === p.team)
    )
      p.team = null;
  w.revision++;
}
function log(w: World, message: string) {
  w.logs = [message, ...w.logs].slice(0, 8);
}
export function setSpectator(w: World, id: string, enabled: boolean) {
  const p = w.players[id];
  if (!p || w.started || typeof enabled !== 'boolean') return false;
  p.spectator = enabled; w.revision++; return true;
}
export function applyAction(
  w: World,
  id: string,
  action: Action,
  now = Date.now(),
): boolean {
  const p = w.players[id];
  if (
    !p ||
    !action ||
    typeof action !== "object" ||
    typeof action.type !== "string"
  )
    return false;
  advanceWorld(w, now);
  const tell = (text: string) => {
    p.message = text;
    w.revision++;
    return true;
  };
  if (action.type === "rpg-start") {
    if (w.started || Object.keys(w.players)[0] !== id) return false;
    if (Object.keys(w.players).length < 2)
      return tell("参加者が2人以上集まると開始できます。");
    w.started = true;
    w.deadlineAt = w.timeLimitMinutes ? now + w.timeLimitMinutes * 60 * 1000 : 0;
    log(w, "参加者が集合し、冒険が始まりました！");
    w.revision++;
    return true;
  }
  const beyondLegacy=p.position3D&&(p.position3D.x<0||p.position3D.z<0||p.position3D.x>=WIDTH||p.position3D.z>=HEIGHT);
  if(beyondLegacy&&!action.type.startsWith('voxel-')&&action.type!=='native-profile'&&action.type!=='native-learning'&&action.type!=='life-craft'&&action.type!=='move'&&!(action.type.startsWith('farm-pet-')&&currentVoxelRoom(w,p)))return false;
  if (action.type.startsWith('town-'))return applyTown(w,p,action as TownAction,now);
  if(w.town?.encounters?.[id]&&action.type!=='native-profile'&&action.type!=='native-learning')return false;
  if(action.type.startsWith('voxel-room-'))return applyRoomAction(w,p,action as RoomAction);
  if(action.type.startsWith('farm-'))return applyFarm(w,p,action as FarmAction);
  if(action.type==='ending-progress'||action.type.startsWith('city-'))return applyCity(w,p,action as CityAction,now);
  if ((w.town?.cooking[id]||w.town?.dreams[id]&&!w.town.dreams[id].finished)&&action.type!=='native-profile'&&action.type!=='native-learning')return false;
  if ((action.type==='hero-set'||action.type.startsWith('social-'))&&!p.spectator)return applySocial(w,p,action as SocialAction,now);
  if (p.spectator && action.type !== "native-profile") return false;
  if (!w.started && action.type !== "native-profile") return false;
  if (action.type.startsWith("life-")) return applyLifeAction(w,p,action as LifeAction,now);
  if ((p.life?.work || p.life?.indoors) && action.type !== "native-profile" && action.type !== "native-learning") return false;
  if (action.type === "story-choice") return applyStory(w,p,action);
  if (action.type.startsWith("duel-"))return applyDuel(w,p,action as DuelAction,now);
  if (action.type.startsWith("native-"))
    return applyNativeAction(w, p, action, tell);
  if (action.type.startsWith("trade-") || action.type.startsWith("dungeon-") || action.type === "arcade-play" || action.type === "arcade-finish" || action.type === "secret-search" || action.type === "npc-event-choice")
    return applyActivity(w,p,action as ActivityAction,now);
  if (w.ended || p.nativeScene || activityBusy(w,p)) return false;
  if(action.type.startsWith("voxel-")){
    const changed=applyVoxel(w,p,action as VoxelAction,now);
    if(changed&&action.type==='voxel-move'&&(!p.position3D||(p.position3D.x>=0&&p.position3D.x<WIDTH&&p.position3D.z>=0&&p.position3D.z<HEIGHT))){const house=w.life.houses.find(h=>h.x===p.x&&h.y===p.y);if(house)applyLifeAction(w,p,{type:'life-enter',houseId:house.id},now);}
    return changed;
  }
  if (action.type === "move") {
    if (
      !Number.isInteger(action.dx) ||
      !Number.isInteger(action.dy) ||
      Math.abs(action.dx) + Math.abs(action.dy) !== 1 ||
      now - p.lastMove < 100
    )
      return false;
    if(p.position3D&&!legacyRegion(p.position3D.x,p.position3D.z))return moveLandscape2D(w,p,action.dx,action.dy,now);
    const x = p.x + action.dx,
      y = p.y + action.dy,
      tile = w.tiles[y * WIDTH + x];
    if(landscapeGate(x,y)&&(x<=0||y<=0||x>=WIDTH-1||y>=HEIGHT-1)){p.position3D={x:p.x+.5,z:p.y+.5,y:0,surface2D:true};return moveLandscape2D(w,p,action.dx,action.dy,now);}
    if (
      x < 1 ||
      x >= WIDTH - 1 ||
      y < 1 ||
      y >= HEIGHT - 1 ||
      (!lifeWalkable(w,x,y)&&!landscapeGate(x,y))
    )
      return false;
    delete p.position3D;
    p.x = x;
    p.y = y;
    p.moveCount = (p.moveCount || 0) + 1;
    p.lastMove = now;
    const house=w.life.houses.find(h=>h.x===x&&h.y===y);
    if(house)applyLifeAction(w,p,{type:'life-enter',houseId:house.id},now);
    w.revision++;
    return true;
  }
  if (action.type === "team") {
    if (action.target === null) {
      p.team = null;
      for (const q of Object.values(w.players))
        if (
          q.team &&
          !Object.values(w.players).some(
            (r) => r.id !== q.id && r.team === q.team,
          )
        )
          q.team = null;
      return tell("チームを離れ、自由探索に戻りました。");
    }
    if (action.target === id) {
      p.team = p.team || id;
      return tell(
        "チームを公開しました。参加は仲間が自由に選べます（最大4人）。",
      );
    }
    const target = w.players[action.target];
    if (target?.spectator) return false;
    if (!target?.team) return false;
    if (
      Object.values(w.players).filter((q) => q.team === target.team).length >= 4
    )
      return tell("そのチームは満員です。");
    p.team = target.team;
    return tell(`${target.name}のチームに参加しました。`);
  }
  return false;
}

function rankingScore(player: Adventurer, category: RpgRankingCategory, bonus: BonusRankingKind) {
  if (category === "KILLS") return player.rivalKills || 0;
  if (category === "DAMAGE") return player.totalDamage || 0;
  if (category === "CORRECT") return player.correctAnswers || 0;
  if (bonus === "TREASURES") return player.claimed?.length || 0;
  if (bonus === "STEPS") return player.moveCount || 0;
  if (bonus === "INTERACTIONS") return player.interactionCount || 0;
  return player.completedBattles || 0;
}

function finalizeRankingAwards(w: World) {
  const players = Object.values(w.players).filter(p => !p.spectator);
  const categories: RpgRankingCategory[] = [w.gameMode === "BATTLE_ROYALE" ? "KILLS" : "DAMAGE", "CORRECT", "BONUS"];
  const awards: Record<string, RpgRankingAward> = {};
  for (const player of players) {
    const playerAwards = categories.map((category) => {
      const entries = players
        .map((candidate) => ({
          id: candidate.id,
          score: Math.max(0, Math.floor(rankingScore(candidate, category, w.bonusRankingKind))),
        }))
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
      const index = entries.findIndex((entry) => entry.id === player.id);
      return {
        category,
        rank: index < 0 ? players.length : index + 1,
        score: index < 0 ? 0 : entries[index].score,
      } satisfies RpgRankingAward;
    });
    awards[player.id] = playerAwards.sort((a, b) => a.rank - b.rank || categories.indexOf(a.category) - categories.indexOf(b.category))[0];
  }
  w.rankingAwards = awards;
}

function endWorld(w: World, reason: RpgEndReason, now = Date.now()) {
  if (w.ended) return;
  w.ended = true;
  w.endReason = reason;
  w.endedAt = now;
  w.rewardAt = now + 10_000;
  if (reason === "timeout") {
    for (const player of Object.values(w.players)) {
      delete player.nativeScene;
      player.message = "時間切れ！";
    }
    log(w, "制限時間が終了しました。");
  }
  w.revision++;
}

export function advanceWorld(w: World, now = Date.now()) {
  if (w.started && !w.ended && w.timeLimitMinutes > 0 && now >= w.deadlineAt) endWorld(w, "timeout", now);
  advanceVoxelWater(w,now);
  advanceLife(w,now);
  advanceSocial(w,now);
  advanceTown(w,now);
  advanceFarm(w);
  advanceCity(w);
  advanceActivities(w,now);
  advanceDuels(w,now);
  if (
    w.ended &&
    w.rewardAt !== null &&
    now >= w.rewardAt &&
    Object.keys(w.rankingAwards).length === 0
  ) {
    finalizeRankingAwards(w);
    w.revision++;
  }
}
