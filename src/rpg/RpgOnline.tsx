import VoxelRoomPanel from './VoxelRoomPanel';
import CampaignEnding from './CampaignEnding';
import ResidentScene from './town/ResidentScene';
import {nearbyResidents,residentNear,residentPosition} from './town/worldResidents';
import FarmQuickActions from './farm/QuickActions';
import {useRpgMusic,type RpgMusicScene} from './music';
import FarmPanel from './farm/Panel';
import RpgSettings from './RpgSettings';
import {useRpgPreferences,updateRpgPreferences} from './preferences';
import CityPanel from './city/Panel';
import {residentsOf} from './town/residents';
import {trans} from '../utils/textUtils';
import TownPanel from './town/Panel';
import {calendar,nearbyFlowers} from './town/model';
import {copy,SEASONS,RESIDENTS} from './town/catalog';
import {FlowerSprite} from './town/Sprites';
import {assetUrl} from '../utils/assetPaths';
import GameTitleScreen from '../mini-games/shared/GameTitleScreen';
import {makeWorldSave,writeWorldSave,restoreWorldSave,canSaveWorld,type RpgWorldSave} from './worldSave';
import useConversationVoice from './useConversationVoice';
import { loadConversationVoice, saveConversationVoice } from './conversationVoice';
import HeroBuilder from './HeroBuilder';
import SocialPanel,{loadMemory} from './SocialPanel';
import {loadHero,loadHeroDraft,saveHero,type CustomHero} from './customHero';
import {socialLineText,type SocialMemory} from './social';
import './social.css';
import useFishingAudio from './useFishingAudio';
import {FishingFrame} from './FishSprite';
import FishingCatch from './FishingCatch';
import useFishingCollection from './useFishingCollection';
import {energyOf,GATHER_ENERGY_MAX} from './energy';
import GatherMiniModal from './GatherMiniModal';
import LifeSprite from './LifeSprite';
import {nearbyResources} from './nearbyResources';
import {audioService} from '../services/audioService';
import {useCompactRpgLayout} from './mobileLayout';
import TouchPad from './TouchPad';
import HomeRoom from './HomeRoom';
import LifePanel from './LifePanel';
import { natureAt, resourceReady } from './life';
import { StoryDialog, StoryJournal } from "./StoryPanel";
import RoamingNpcDialog from './RoamingNpcDialog';
import { biomeAt } from "./biomes";
import '../mini-games/shared/lobby.css';
import HostSpectator, { useSpectatorTarget } from '../mini-games/shared/HostSpectator';
import { findWalkingRoute } from "./walking";
import ActivitiesPanel from "./ActivitiesPanel";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Compass,
  Users,
  Map,
  Crown,
  Copy,
  Check,
  Heart,
  Clock,
  BookOpen,
  Sparkles,
  MoreHorizontal,
  Axe,
  Zap,
  X,
} from "lucide-react";
import type { LanguageMode, Player } from "../types";
import type { GameMode } from "../types";
import TranslatedUiTree from "../components/TranslatedUiTree";
import GoHomeDash from "../components/GoHomeDash";
import WorldCanvas from "./WorldView";
import {relativeMove} from "./worldViewMath";
import {
  distance,
  HEIGHT,
  WIDTH,
  siteUnavailable,
  type World,
  type Adventurer,
  type Site,
  type BonusRankingKind,
} from "./engine";
import { getRpgSiteDisplayName } from "./enemyNames";
import { RpgRoom } from "./network";
import { nativeProfile, type RpgSnapshot } from "./bridge";
import { buildRpgInviteUrl, getRpgRoomCodeFromUrl } from "./invite";
import type { RpgAdventureSetup } from "./setup";
import "./rpg.css";


const BONUS_RANKING_LABELS: Record<
  BonusRankingKind,
  { title: string; score: (player: Adventurer) => number }
> = {
  BATTLES: {
    title: "戦闘勝利数ランキング",
    score: (player) => player.completedBattles || 0,
  },
  TREASURES: {
    title: "宝箱開封数ランキング",
    score: (player) => player.claimed?.length || 0,
  },
  STEPS: {
    title: "探索歩数ランキング",
    score: (player) => player.moveCount || 0,
  },
  INTERACTIONS: {
    title: "施設利用回数ランキング",
    score: (player) => player.interactionCount || 0,
  },
};

function rankingRows(
  members: Adventurer[],
  score: (player: Adventurer) => number,
) {
  return members
    .map((player) => ({ player, score: Math.max(0, Math.floor(score(player))) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.player.name.localeCompare(b.player.name, "ja"),
    )
    .slice(0, 5);
}

export default function RpgOnline({
  player,
  active,
  interactionBlocked = false,
  languageMode,
  sceneError,
  adventureSetup,
  autoJoinInvite = false,
  initialIntent = 'solo',resumeSave,onTitle,
  onRoom,
  onSnapshot,
  onEnergyRequest,
  onSetup,
  onClose,
}: {
  player: Player;
  active: boolean;
  interactionBlocked?: boolean;
  languageMode: LanguageMode;
  sceneError?: string;
  adventureSetup?: RpgAdventureSetup;
  autoJoinInvite?: boolean;
  initialIntent?:'solo'|'online';resumeSave?:RpgWorldSave|null;onTitle?:()=>void;
  onRoom: (room: RpgRoom) => void;
  onSnapshot: (snapshot: RpgSnapshot) => void;
  onEnergyRequest?:()=>void;
  onSetup: (setup: RpgAdventureSetup) => void;
  onClose: () => void;
}) {
  const prefs=useRpgPreferences(),[settingsOpen,setSettingsOpen]=useState(false);
  const [cityOpen,setCityOpen]=useState(false),[farmOpen,setFarmOpen]=useState(false);
  const [hero,setHero]=useState(loadHero),[heroOpen,setHeroOpen]=useState(false),[memory,setMemory]=useState(loadMemory),[socialError,setSocialError]=useState('');
  const compact=useCompactRpgLayout();
  const [detail,setDetail]=useState<string|null>(null);
  const detailRef=useRef<HTMLElement>(null);
  const [quickReady,setQuickReady]=useState(true);
  const [lifeOpen,setLifeOpen]=useState(false);
  const [lifeInitialTab,setLifeInitialTab]=useState<string>();
  const [lifeTarget,setLifeTarget]=useState<number|null>(null);
  const [storySiteId, setStorySiteId] = useState<string | null>(null);
  const [roamingNpcSiteId, setRoamingNpcSiteId] = useState<string | null>(null);
  const [residentTarget,setResidentTarget]=useState<string|null>(null);
  const [npcChoicePending, setNpcChoicePending] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);
  const [world, setWorld] = useState<World | null>(null);
  const inviteCode = useMemo(
    () =>
      typeof window === "undefined"
        ? ""
        : getRpgRoomCodeFromUrl(window.location.href),
    [],
  );
  const [name, setName] = useState(inviteCode ? "" : trans("冒険者",languageMode)),
    [code, setCode] = useState(inviteCode),
    [inviteCopied, setInviteCopied] = useState(false);
  const [gameMode,setGameMode]=useState<World["gameMode"]>("COOP");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(initialIntent==='solo'?0:30);
  const [intent,setIntent]=useState<'practice'|'create'|'join'>(initialIntent==='solo'?'practice':'create');
  const [inviteEntered,setInviteEntered]=useState(false);
  const [saveStatus,setSaveStatus]=useState(''),[saving,setSaving]=useState(false);
  const playerLatest=useRef(player);playerLatest.current=player;
  const resumed=useRef(false),saveInProgress=useRef(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [inviteTheme, setInviteTheme] = useState<RpgAdventureSetup["visualTheme"]>(
    adventureSetup?.visualTheme || "elementary",
  );
  const previewTheme = autoJoinInvite
    ? inviteTheme
    : adventureSetup?.visualTheme || "elementary";
  const displaySiteName = (site: Site) => getRpgSiteDisplayName(site, previewTheme);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [overview, setOverview] = useState(false);
  const room = useRef<RpgRoom | null>(null),
    latest = useRef({ world, active });
  const destination = useRef<{ x: number; y: number } | null>(null);
  const walkingRoute = useRef<Array<{x:number;y:number}>>([]);
  useEffect(()=>{if(settingsOpen||cityOpen||farmOpen){destination.current=null;walkingRoute.current=[];}},[settingsOpen,cityOpen,farmOpen]);
  const fishing=useFishingCollection(world?.players[room.current?.selfId||'']?.life?.fishRecords,world?.players[room.current?.selfId||'']?.life?.lastCatch,world?.players[room.current?.selfId||'']?`${world.seed}:${room.current?.selfId}`:undefined);
  useFishingAudio(world?.players[room.current?.selfId||'']?.life,world?.players[room.current?.selfId||'']?.message||'',active&&!interactionBlocked&&!world?.ended,fishing.result);
  latest.current = { world, active: active && !(world?.won&&world.endReason==='clear'&&(world.endingProgress?.[room.current?.selfId||'']||0)<6) && !residentTarget && !farmOpen && !settingsOpen && !cityOpen && !fishing.result && !interactionBlocked && !detail && !heroOpen && !world?.players[room.current?.selfId || ""]?.life?.work && !storySiteId && !roamingNpcSiteId && !lifeOpen && !world?.players[room.current?.selfId || ""]?.life?.indoors && !world?.players[room.current?.selfId || ""]?.spectator };
  useEffect(()=>{if(world?.players[room.current?.selfId||'']?.life?.indoors){destination.current=null;walkingRoute.current=[];setLifeOpen(false);}},[world?.players[room.current?.selfId||'']?.life?.indoors]);
  const selfId = room.current?.selfId || "",
    me = world?.players[selfId];
  const roomCode = room.current?.code || "";
  const inviteUrl = useMemo(
    () =>
      roomCode && typeof window !== "undefined"
        ? buildRpgInviteUrl(window.location.href, roomCode)
        : "",
    [roomCode],
  );
  const members: Adventurer[] = world ? Object.values(world.players) : [];
  const spectating = !!me?.spectator;
  const candidates = members.filter(p => p.id !== selfId && !p.spectator);
  const spectators = useSpectatorTarget(spectating, candidates.map(p => p.id));
  const watched = spectating ? world?.players[spectators.target || ''] : me;
  const rankedMembers = members.filter(p => !p.spectator);
  const remainingSeconds = world&&world.timeLimitMinutes>0
    ? Math.max(0, Math.ceil((world.deadlineAt - clockNow) / 1000))
    : null;
  const bonusRanking =
    BONUS_RANKING_LABELS[world?.bonusRankingKind || "BATTLES"];
  const rankingDefinitions = [
    {
      title: world?.gameMode === "BATTLE_ROYALE" ? "倒した数ランキング" : "総ダメージ数ランキング",
      score: (member: Adventurer) => world?.gameMode === "BATTLE_ROYALE" ? member.rivalKills || 0 : member.totalDamage || 0,
    },
    {
      title: "総問題正解数ランキング",
      score: (member: Adventurer) => member.correctAnswers || 0,
    },
    bonusRanking,
  ];
  const incomingRequest=world?.social?.requests.find(r=>r.to===selfId);
  const spokenLine = useConversationVoice(world, selfId, active && prefs.speech && !settingsOpen && !interactionBlocked && !world?.ended && !me?.spectator && !me?.nativeScene && !me?.life?.work && !heroOpen && !Object.values(world?.life.games || {}).some(g => g.kind === 'rhythm' && g.phase === 'playing' && g.players.includes(selfId)), languageMode);
  const currentTalk=world?.social?.talks.filter(t=>t.people.includes(selfId)).at(-1);
  const talkLine=spokenLine || (currentTalk&&clockNow-currentTalk.at>=0&&clockNow-currentTalk.at<currentTalk.lines.length*2600?currentTalk.lines[Math.floor((clockNow-currentTalk.at)/2600)]:undefined);
  const near =
    world && me
      ? world.sites
          .filter((s) => distance(s, me) <= 2)
          .sort((a, b) => distance(a, me) - distance(b, me))[0]
      : undefined;
  useEffect(() => () => room.current?.close(), []);
  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const voiceKey = hero ? 'original-hero' : `${previewTheme}:${previewTheme === 'magic' ? player.magicProtagonistId || player.id : player.id}`;
  useEffect(() => { setMemory(m => ({ ...m, conversationVoice: loadConversationVoice(voiceKey) })); }, [voiceKey]);
  const heroJson=JSON.stringify(hero),memoryJson=JSON.stringify(memory);
  useEffect(()=>{if(me&&!me.spectator&&!me.nativeScene&&JSON.stringify(me.hero||null)!==heroJson)room.current?.send({type:'hero-set',hero});},[selfId,!!me,!!me?.spectator,!!me?.nativeScene,heroJson]);
  useEffect(()=>{if(me&&!me.spectator&&JSON.stringify(me.memory)!==memoryJson)room.current?.send({type:'social-memory',memory});},[selfId,!!me,!!me?.spectator,memoryJson]);
  useEffect(()=>{audioService.setRpgHeroVoice(hero?.voice||null);return()=>audioService.setRpgHeroVoice(null);},[heroJson]);
  const updateMemory=(m:SocialMemory)=>{try{if(m.conversationVoice)saveConversationVoice(voiceKey,m.conversationVoice);localStorage.setItem('rpg-social-memory-v1',JSON.stringify(m));setMemory(m);room.current?.send({type:'social-memory',memory:m});setSocialError('');}catch{setSocialError('保存できませんでした。端末の空き容量を確認してください。');}};
  const updateHero=(h:CustomHero|null)=>{saveHero(h);setHero(h);room.current?.send({type:'hero-set',hero:h});};
  const profileJson = JSON.stringify({...nativeProfile(player),visualTheme:previewTheme});
  useEffect(() => {
    if (
      active &&
      me &&
      !me.nativeScene &&
      JSON.stringify(me.profile) !== profileJson
    )
      room.current?.send({
        type: "native-profile",
        profile: JSON.parse(profileJson),
      });
  }, [active, selfId, !!me, !!me?.nativeScene, profileJson]);
  const start = async (mode: "practice" | "create" | "join" | "invite") => {
    setBusy(true);
    setError("");
    room.current?.close();
    const r = new RpgRoom((w) => {
      setWorld(w);
      if (w.setup) onSetup(w.setup);
      onSnapshot({ world: w, selfId: r.selfId });
    }, setError);
    room.current = r;
    onRoom(r);
    try {
      if (mode === "practice") r.practice(name, adventureSetup, timeLimitMinutes,gameMode);
      else if (mode === "create") await r.create(name, adventureSetup, timeLimitMinutes,gameMode);
      else if (mode === "invite")
        await r.prepareInviteJoin(code, name, (setup) =>
          onSetup({ ...setup, visualTheme: inviteTheme }),
        );
      else await r.join(code, name);
    } catch (e) {
      r.close();
      if (room.current === r) room.current = null;
      setWorld(null);
      setError(e instanceof Error ? e.message : "接続できませんでした。");
    } finally {
      setBusy(false);
    }
  };
  useEffect(()=>{if(!resumeSave||resumed.current)return;resumed.current=true;const r=new RpgRoom(w=>{setWorld(w);onSnapshot({world:w,selfId:r.selfId});},setError);room.current=r;onRoom(r);try{const savedHero=resumeSave.player.customHero||resumeSave.world.players[resumeSave.selfId].hero||null;setHero(savedHero);setMemory(resumeSave.world.players[resumeSave.selfId].memory||loadMemory());r.resume(restoreWorldSave(resumeSave),resumeSave.selfId);setSaveStatus('保存したワールドを再開しました。');}catch{r.close();setError('保存データを読み込めませんでした。');}return()=>{r.close();resumed.current=false;};},[resumeSave]);
  const persist=async(quiet=false)=>{const r=room.current,w=r?.world;if(!r||!w||!r.host||r.code||saveInProgress.current)return false;if(!w.ended&&!canSaveWorld(w,r.selfId,playerLatest.current)){if(!quiet)setSaveStatus('戦闘・採取・ミニゲームが終わってから保存してください。');return false;}saveInProgress.current=true;setSaving(true);try{await writeWorldSave(w.ended?structuredClone({version:1 as const,savedAt:Date.now(),selfId:r.selfId,world:w,player:playerLatest.current}):makeWorldSave(w,r.selfId,playerLatest.current));setSaveStatus('ワールドを保存しました。');return true;}catch{setSaveStatus('保存できませんでした。端末の空き容量を確認してください。');return false;}finally{saveInProgress.current=false;setSaving(false);}};
  const persistLatest=useRef(persist);persistLatest.current=persist;
  useEffect(()=>{if(!world?.started||!selfId||room.current?.code)return;const initial=setTimeout(()=>void persistLatest.current(true),1000),timer=setInterval(()=>void persistLatest.current(true),30000);const hidden=()=>{if(document.hidden)void persistLatest.current(true);};document.addEventListener('visibilitychange',hidden);return()=>{clearTimeout(initial);clearInterval(timer);document.removeEventListener('visibilitychange',hidden);};},[selfId,world?.started]);
  useEffect(()=>{if(!world?.ended||room.current?.code)return;const timer=setTimeout(()=>void persistLatest.current(true),1000);return()=>clearTimeout(timer);},[world?.ended]);
  const saveToTitle=async()=>{if(await persist()) {room.current?.close();onTitle?.();}};
  const copyInviteUrl = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const input = document.createElement("textarea");
        input.value = inviteUrl;
        input.setAttribute("readonly", "true");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        try {
          if (!document.execCommand("copy")) throw new Error("copy failed");
        } finally {
          input.remove();
        }
      }
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 2200);
    } catch {
      setError(
        "招待URLをコピーできませんでした。URLを選択してコピーしてください。",
      );
    }
  }, [inviteUrl]);
  const closeResident=()=>{room.current?.send({type:'town-encounter',target:null});setResidentTarget(null);};
  const openResident=(id:string)=>{const w=latest.current.world,p=w?.players[room.current?.selfId||''];if(!w||!p||!residentNear(w,p,id)||p.nativeScene)return;destination.current=null;walkingRoute.current=[];setDetail(null);setLifeOpen(false);room.current?.send({type:'town-encounter',target:id});setResidentTarget(id);};
  const interact = useCallback(() => {
    const w = latest.current.world,
      p = w?.players[room.current?.selfId || ""];
    if (!w || !p || !latest.current.active || p.nativeScene) return;
    const resident=nearbyResidents(w,p)[0];if(resident){destination.current=null;walkingRoute.current=[];room.current?.send({type:'town-encounter',target:resident.id});setResidentTarget(resident.id);setDetail(null);return;}
    const home=w.life?.houses.find(h=>distance(h,p)<=2);
    if(home){destination.current=null;room.current?.send({type:'life-enter',houseId:home.id});setLifeOpen(true);return;}
    const site = w.sites
      .filter((s) => distance(s, p) <= 2)
      .sort((a, b) => distance(a, p) - distance(b, p))[0];
    if (site) {
      destination.current = null;
      if (site.kind === "story") { setStorySiteId(site.id); return; }
      if (site.kind === "npc") { setNpcChoicePending(false); setRoamingNpcSiteId(site.id); return; }
      room.current?.send(site.kind === "dungeon" ? { type: "dungeon-join", siteId: site.id } : ["fragment", "secret", "seal"].includes(site.kind) ? { type: "secret-search", siteId: site.id } : { type: "native-enter", siteId: site.id });
    } else {destination.current=null;setLifeTarget(null);setLifeOpen(true);}
  }, []);
  useEffect(()=>{
    if(roamingNpcSiteId && world?.players[selfId]?.npcEventResults?.[roamingNpcSiteId])setNpcChoicePending(false);
  },[roamingNpcSiteId,selfId,world?.players]);
  useEffect(()=>{if(prefs.mapView==='2D'&&me?.position3D)room.current?.send({type:'voxel-snap'});},[prefs.mapView,!!me?.position3D]);
  const [facing,setFacing]=useState(0);
  const lastDirection=useRef({dx:0,dy:-1});
  const navigation=useRef({facing,threeD:false});navigation.current={facing,threeD:prefs.mapView==='3D'&&!overview};
  const turn=(n:number)=>setFacing(((n%4)+4)%4);
  useEffect(() => {
    if (!active || interactionBlocked) destination.current = null;
    const held=new Set<string>();
    const release=(e:KeyboardEvent)=>held.delete(e.key.toLowerCase());
    const stop=()=>held.clear();
    const key = (e: KeyboardEvent) => {
      if (
        !latest.current.active ||
        (e.target as HTMLElement).closest("input,textarea,select,[role=dialog]")
      )
        return;
      const dirs: Record<string, number[]> = {
        ArrowUp: [0, -1],
        w: [0, -1],
        ArrowDown: [0, 1],
        s: [0, 1],
        ArrowLeft: [-1, 0],
        a: [-1, 0],
        ArrowRight: [1, 0],
        d: [1, 0],
      };
      if(navigation.current.threeD&&["q","r"].includes(e.key.toLowerCase())){e.preventDefault();setFacing(n=>(n+(e.key.toLowerCase()==="q"?3:1))%4);return;}
      const dir = dirs[e.key];
      if (dir) {
        e.preventDefault();
        destination.current = null;
        if(navigation.current.threeD){if(!e.repeat){held.add(e.key.toLowerCase());const v=relativeMove(dir[0]*.256,dir[1]*.256,navigation.current.facing);room.current?.send({type:"voxel-move",...v});}return;}
        const step={dx:dir[0],dy:dir[1]};lastDirection.current=step;
        room.current?.send(navigation.current.threeD?{type:"voxel-move",dx:step.dx*.32,dy:step.dy*.32}:{type:"move",...step});
      }
      if (e.key.toLowerCase() === "e") {
        e.preventDefault();
        interact();
      }
    };
    window.addEventListener("keydown", key);window.addEventListener("keyup",release);window.addEventListener("blur",stop);
    const freeTimer=window.setInterval(()=>{if(!navigation.current.threeD||!latest.current.active){held.clear();return;}const dx=Number(held.has("d")||held.has("arrowright"))-Number(held.has("a")||held.has("arrowleft")),dy=Number(held.has("s")||held.has("arrowdown"))-Number(held.has("w")||held.has("arrowup"));const l=Math.hypot(dx,dy);if(l){const v=relativeMove(dx/l*.256,dy/l*.256,navigation.current.facing);room.current?.send({type:"voxel-move",...v});}},80);
    const timer = window.setInterval(() => {
      const w = latest.current.world,
        p = w?.players[room.current?.selfId || ""],
        target = destination.current;
      if (!latest.current.active || !w || !p || p.nativeScene || !target)
        return;
      while(walkingRoute.current[0]?.x===p.x && walkingRoute.current[0]?.y===p.y)walkingRoute.current.shift();
      const step=walkingRoute.current[0];
      if(step && distance(p,step)===1){lastDirection.current={dx:step.x-p.x,dy:step.y-p.y};room.current?.send({type:"move",...lastDirection.current});}
      else destination.current=null;
    }, 160);
    return () => {
      window.removeEventListener("keydown", key);window.removeEventListener("keyup",release);window.removeEventListener("blur",stop);clearInterval(freeTimer);
      clearInterval(timer);
    };
  }, [active, interactionBlocked, interact]);
  const hasActivityDialog=!!world&&!!me&&(world.activities.trades.some(t=>t.from===selfId||t.to===selfId)||world.duels.some(d=>d.id===me.duelId&&d.status==='request')||world.activities.dungeons.some(d=>d.id===me.dungeonId&&d.status==='lobby'));
  if(hasActivityDialog)latest.current.active=false;
  const openDetail=(id:string)=>{destination.current=null;walkingRoute.current=[];setDetail(id);};
  useEffect(()=>{if(!compact||!active||lifeOpen||storySiteId||roamingNpcSiteId||hasActivityDialog||me?.life?.indoors)setDetail(null);},[compact,active,lifeOpen,storySiteId,roamingNpcSiteId,hasActivityDialog,me?.life?.indoors]);
  useEffect(()=>{if(!compact||!detail)return;const before=document.activeElement as HTMLElement|null;detailRef.current?.querySelector<HTMLButtonElement>('.rpg-detail-close')?.focus();return()=>{if(before?.isConnected&&before.getClientRects().length)before.focus();};},[compact,!!detail]);
  const detailKeys=[['town','暮らし'],['social','交流'],['player','状態'],['team','仲間'],['event','イベント'],['journal','手帳'],['goal','目標'],['menu','部屋']];
  const detailKeyDown=(e:React.KeyboardEvent)=>{if(!compact||!detail)return;if(e.key==='Escape'){e.stopPropagation();setDetail(null);}if(e.key==='Tab'){const buttons=Array.from(detailRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,summary,[tabindex="0"]')||[]).filter(el=>el.getClientRects().length>0);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
  useEffect(()=>{if(!me?.life?.lastAction){setQuickReady(true);return;}setQuickReady(false);const timer=setTimeout(()=>setQuickReady(true),350);return()=>clearTimeout(timer);},[me?.life?.lastAction]);
  const requestEnergy=()=>{if(!active||interactionBlocked||me?.life?.work||hasActivityDialog)return;destination.current=null;walkingRoute.current=[];setDetail(null);setLifeOpen(false);onEnergyRequest?.();};
  const quickGather=(tile:number)=>{if(!latest.current.active||!world||!quickReady)return;if(energyOf(me?.life)<1){requestEnergy();return;}destination.current=null;walkingRoute.current=[];setDetail(null);setLifeOpen(false);const fish=world.tiles[tile]==='water';if(fish)void audioService.preloadRpgFishingSounds();room.current?.send({type:fish?'life-cast':'life-work',tile});};
  const continueFishing=()=>{
    fishing.close();
    if(!world||!me||!active||interactionBlocked||world.ended||me.life?.work||me.life?.indoors||hasActivityDialog)return;
    const tile=nearbyResources(world,me).find(tile=>world.tiles[tile]==='water');
    if(tile===undefined)return;
    if(energyOf(me.life)<1){requestEnergy();return;}
    destination.current=null;walkingRoute.current=[];setDetail(null);setLifeOpen(false);
    void audioService.preloadRpgFishingSounds();
    room.current?.send({type:'life-cast',tile});
  };
  const quickTiles=compact&&world&&me&&!spectating&&!me.life?.indoors?nearbyResources(world,me).filter((tile,index,all)=>world.tiles[tile]!=='water'||all.find(t=>world.tiles[t]==='water')===tile):[];
  useEffect(()=>{if(compact&&me?.life?.work){destination.current=null;walkingRoute.current=[];setDetail(null);setLifeOpen(false);}},[compact,me?.life?.work?.started]);
  const openLife=()=>{destination.current=null;walkingRoute.current=[];setDetail(null);setLifeTarget(null);setLifeOpen(true);};
  const move=(dx:number,dy:number)=>{if(!latest.current.active)return;destination.current=null;walkingRoute.current=[];const step=navigation.current.threeD?relativeMove(dx,dy,navigation.current.facing):{dx,dy};if(!navigation.current.threeD)lastDirection.current={dx,dy};room.current?.send(navigation.current.threeD?{type:'voxel-move',dx:step.dx*.32,dy:step.dy*.32}:{type:'move',...step});};
  const hudHp=spectating?watched?.hp||0:player.currentHp,hudMaxHp=spectating?watched?.maxHp||1:player.maxHp;
  const close = () => {
    void persist(true);
    room.current?.close();
    onClose();
  };
  const musicScene:RpgMusicScene = settingsOpen?'settings':heroOpen?'hero':!world||!world.started?'setup':world.ended?(world.endReason==='clear'?'clear':'ended'):farmOpen?'farm':cityOpen?'city':fishing.result?'catch':me?.life?.work?(me.life.work.kind==='fish'?'fishing':'gather'):storySiteId||roamingNpcSiteId?'story':me?.life?.indoors?'home':lifeOpen?(lifeInitialTab==='fishbook'?'journal':'craft'):detail==='social'||detail==='town'?'social':detail==='journal'||detail==='player'?'journal':detail==='team'?'team':detail==='event'?'event':detail==='goal'?'goal':detail==='menu'?'setup':hasActivityDialog?'team':'map';
  useRpgMusic(active&&!interactionBlocked&&!me?.nativeScene?musicScene:null,world?.ended?40:10,me?.life?.indoors?'home':!world||!world.started?'setup':'map');
  return (
    <TranslatedUiTree mode={languageMode}>
      {autoJoinInvite&&!inviteEntered&&!world&&<GameTitleScreen kind="rpg" title="異世界転生したら学力で無双した件" subtitle="学習ローグRPG" logo={<img src={assetUrl('sprites/rpg/title/logo.webp')} alt="学習ローグRPG"/>} languageMode={languageMode} onClose={close} backdrop={<img src={assetUrl('sprites/rpg/title/frontier.webp')} alt=""/>} actions={[{label:'招待に参加する',onClick:()=>setInviteEntered(true)}]}/>}
      {settingsOpen&&<RpgSettings languageMode={languageMode} onClose={()=>setSettingsOpen(false)}/>}
      {farmOpen&&world&&<FarmPanel world={world} selfId={selfId} send={a=>room.current?.send(a)} languageMode={languageMode} onTrack={(x,y)=>{if(!me)return;const route=findWalkingRoute(world,me.x,me.y,x,y);walkingRoute.current=route;destination.current=route.at(-1)||null;setFarmOpen(false);}} onClose={()=>setFarmOpen(false)}/>}
      {cityOpen&&world?.city&&<CityPanel world={world} selfId={selfId} send={a=>room.current?.send(a)} languageMode={languageMode} onClose={()=>setCityOpen(false)}/>}
      {heroOpen&&<HeroBuilder languageMode={languageMode} initial={hero||loadHeroDraft()} onSave={updateHero} onClose={()=>setHeroOpen(false)}/>}
      <main className={`rpg-root ${[prefs.contrast?'rpg-high-contrast':'',prefs.largeText?'rpg-large-text':'',prefs.largeControls?'rpg-large-controls':'',prefs.reducedMotion?'rpg-reduced-motion':'',prefs.hand==='right'?'rpg-hand-right':''].join(' ')} ${!world||!world.started?'rpg-intro-root':''} ${compact&&world?.started&&me?'rpg-root--compact':''}`} data-testid="rpg-native-map" data-resident-scene={!!residentTarget}>
        <header className="rpg-header">
          <button className="rpg-brand" onClick={close}>
            <Compass />
            学習ローグ <em className="rpg-dev-badge">開発中</em>
            <b>RPG ONLINE</b>
          </button>
          <span>
            {world ? `${Object.keys(world.players).length} / 40` : ""}
          </span>
          <button className="rpg-subtle" onClick={close}>
            学習ローグへ
          </button>
        </header>
        {world && room.current?.host && roomCode && <HostSpectator enabled={spectating} canChangeMode={!world.started} onChange={value => { destination.current = null; walkingRoute.current = []; room.current?.setSpectator(value); }} name={spectators.target ? watched?.name : undefined} count={candidates.length} onNext={spectators.next} languageMode={languageMode}>{watched && spectators.target && <><span>HP {watched.hp} / {watched.maxHp}</span><span>{watched.gold} G</span><span>{watched.completedBattles} WIN</span><span>{watched.correctAnswers} CORRECT</span><span>{watched.nativeScene ? world.sites.find(s => s.id === watched.nativeScene?.siteId)?.name || '探索中' : watched.dungeonId ? 'ダンジョン' : '探索中'}</span></>}</HostSpectator>}
        {!world || !me ? (
          <div className="rpg-lobby">
            <div className="rpg-lobby-art">
              <img src={assetUrl('sprites/rpg/title/frontier.webp')} alt=""/>
            </div>
            <section className="rpg-lobby-form rpg-entry-form">
              <div className="rpg-entry-heading"><h1>{autoJoinInvite?'招待に参加する':intent==='practice'?'ひとり用の冒険':intent==='create'?'オンラインの部屋を作る':'招待に参加する'}</h1><button className="rpg-entry-builder" onClick={()=>setHeroOpen(true)}>主人公ビルダー</button></div>
              {!autoJoinInvite&&<nav className="rpg-entry-tabs" aria-label="冒険の遊び方">{([['practice','ひとりで遊ぶ'],['create','部屋を作る'],['join','招待に参加する']] as const).map(([value,label])=><button key={value} aria-pressed={intent===value} disabled={busy} onClick={()=>{setIntent(value);if(value==='practice'){setTimeLimitMinutes(0);setGameMode('COOP');}else if(timeLimitMinutes===0)setTimeLimitMinutes(30);}}>{label}</button>)}</nav>}
              <label>{autoJoinInvite?'参加名':'冒険者の名前'}<input value={name} maxLength={16} autoComplete="nickname" onChange={e=>setName(e.target.value)}/></label>
              {autoJoinInvite?<label>開始する編<select value={inviteTheme} onChange={e=>setInviteTheme(e.target.value as RpgAdventureSetup['visualTheme'])}><option value="elementary">小学生編</option><option value="high-school">高校編</option><option value="magic">マジック編</option></select></label>:intent==='join'?<label>ルームコード<input value={code} maxLength={6} autoCapitalize="characters" onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''))}/></label>:<div className="rpg-entry-options">{intent==='create'&&<label>ゲームモード<select value={gameMode} onChange={e=>setGameMode(e.target.value as World['gameMode'])}><option value="COOP">協力</option><option value="BATTLE_ROYALE">バトルロイヤル</option></select></label>}<label>制限時間<select value={timeLimitMinutes} onChange={e=>setTimeLimitMinutes(Number(e.target.value))}><option value={0}>制限時間なし</option>{[5,15,30,60,90,120,180].map(n=><option key={n} value={n}>{n} min</option>)}</select></label></div>}
              <button className="rpg-join-button" disabled={busy||!name.trim()||((autoJoinInvite||intent==='join')&&code.length!==6)} onClick={()=>start(autoJoinInvite?'invite':intent)}>{busy?'接続中…':autoJoinInvite?'名前を決めて主人公選択へ':intent==='practice'?'冒険をはじめる':intent==='create'?'オンラインの部屋を作る':'招待コードを入力して入室する'}</button>
              <small>{intent==='practice'&&!autoJoinInvite?'ワールドと主人公をこの端末へ自動保存します。':'最大40人・チームは最大4人。ホストの画面を開いたままにしてください。'}</small>
            </section>
          </div>
        ) : !world.started ? (
          <main className="rpg-waiting-lobby">
            <section className="rpg-waiting-panel"><button onClick={()=>setHeroOpen(true)}>オリジナル主人公を作る</button>
              <div className="rpg-waiting-heading">
                <div>
                  <h1>冒険者集合中</h1>
                  <p>ホストが開始すると、全員でワールドへ移動します。</p>
                </div>
                <strong>{members.length} / 40</strong>
              </div>
              <div className="rpg-waiting-roster" aria-label="部屋の参加者">
                <h2>参加者</h2>
                <ul>
                  {members.map((member) => (
                    <li key={member.id}>
                      <span className="rpg-waiting-dot" style={{ background: `hsl(${member.color * 60}, 58%, 63%)` }} />
                      <span className="online-member-name">{member.name}</span>
                      {member.id === Object.keys(world.players)[0] && <small>ホスト</small>}
                      {member.id === selfId && <small>あなた</small>}{member.spectator && <small>観戦モード</small>}
                    </li>
                  ))}
                  {members.length < 2 && <li className="rpg-waiting-empty">仲間が参加するのを待っています…</li>}
                </ul>
              </div>
              {roomCode && (
                <div className="rpg-waiting-invite">
                  <span>ROOM {roomCode}</span>
                  <button className="rpg-invite-button" onClick={copyInviteUrl}>
                    {inviteCopied ? <Check size={14} /> : <Copy size={14} />}
                    {inviteCopied ? "コピーしました" : "招待URLをコピー"}
                  </button>
                </div>
              )}
              {room.current?.host ? (
                <div className="rpg-waiting-start-area">
                  <button
                    className="rpg-primary rpg-start-adventure"
                    disabled={busy || members.length < 2}
                    onClick={() => room.current?.send({ type: "rpg-start" })}
                  >
                    ゲーム開始
                  </button>
                  <p>{members.length < 2 ? "参加者が2人以上集まると開始できます。" : "全員の準備ができたら開始してください。"}</p>
                </div>
              ) : (
                <p className="rpg-waiting-host-message">ホストの開始を待っています。</p>
              )}
            </section>
            <details className="rpg-waiting-mini-game">
              <summary className="rpg-waiting-mini-heading">
                <div>
                  <h2>待っている間に遊ぼう</h2>
                  <p>帰宅ダッシュ一発アウト · HP 1</p>
                </div>
                <span>開始前は何度でもリトライできます</span>
              </summary>
              <div className="rpg-waiting-mini-frame">
                <GoHomeDash
                  onBack={() => {}}
                  problemMode={(adventureSetup?.mode || "MIXED") as GameMode}
                  problemModePool={adventureSetup?.modePool}
                  answerMode={adventureSetup?.answerMode}
                  assignment={adventureSetup?.assignment}
                  languageMode={languageMode}
                  initialHp={1}
                  initialMaxHp={1}
                  compact
                  exitEnabled={false}
                />
              </div>
            </details>
          </main>
        ) : (
          <>
            <div className="rpg-game-grid">
              <section className="rpg-exploration" inert={compact&&!!detail?true:undefined}>
                {compact&&<div className="rpg-compact-hud" aria-label="冒険の重要情報">
                  <button className="rpg-compact-menu" aria-label="部屋と操作の詳細" onClick={()=>openDetail('menu')}><Compass size={19}/><span className="rpg-desktop-title">木漏れ日のフロンティア</span></button>
                  <button className="rpg-compact-health" aria-label="プレイヤーの状態" onClick={()=>openDetail('player')}><Heart size={15}/><span>HP <b>{hudHp}/{hudMaxHp}</b><i><em style={{width:`${Math.max(0,Math.min(100,hudHp/Math.max(1,hudMaxHp)*100))}%`}}/></i></span></button>
                  <button className="rpg-compact-clock" aria-label="制限時間と冒険の目標" onClick={()=>openDetail('goal')}><Clock size={15}/><b>{world.timeLimitMinutes===0?'∞':`${Math.floor((remainingSeconds||0)/60)}:${String((remainingSeconds||0)%60).padStart(2,'0')}`}</b></button>
                  <button className="rpg-compact-members" aria-label="参加者とチーム" onClick={()=>openDetail('team')}><Users size={16}/><span>{members.length}/40</span></button>
                </div>}

                <div className="rpg-map-title">
                  <h1>木漏れ日のフロンティア</h1><span>{world.gameMode === "BATTLE_ROYALE" ? "バトルロイヤル" : "協力"}</span>
                  <span>
                    戦闘勝利 {watched?.completedBattles || 0}
                    {remainingSeconds !== null && (
                      <strong className="rpg-time-limit" aria-label="制限時間">
                        {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}
                      </strong>
                    )}
                  </span>
                </div>
                <div className="rpg-map-container">{!spectating&&<button className="rpg-season-badge" onClick={()=>setDetail('town')}>{copy(SEASONS[calendar(world).season],languageMode)} {calendar(world).date} · {trans('暮らし',languageMode)}</button>}{incomingRequest&&!me.life?.indoors&&<button className="rpg-social-invite" onClick={()=>openDetail('social')}>{incomingRequest.kind==='cohabit'?'同居のお誘い':'結婚のお申し込み'}</button>}{talkLine&&<div className="rpg-social-bubble" aria-live="polite"><b>{talkLine.speaker==='player'?'あなた':world.players[talkLine.speaker]?.hero?.name||world.players[talkLine.speaker]?.name||(residentsOf(world).find(r=>r.id===talkLine.speaker)?copy(residentsOf(world).find(r=>r.id===talkLine.speaker)!.name,languageMode):world.town?.people[talkLine.speaker]?.name)}</b>{socialLineText(talkLine,languageMode)}</div>}
                  {active && (
                    <WorldCanvas onEnergyRequest={requestEnergy} onVoxelAction={spectating?undefined:action=>{if(latest.current.active&&!interactionBlocked)room.current?.send(action);}} paused={!!residentTarget||!!storySiteId||!!roamingNpcSiteId} facing={facing} onFacing={turn}
                      world={world}
                      selfId={spectating ? spectators.target || selfId : selfId}
                      overview={overview}
                      languageMode={languageMode}
                      visualTheme={previewTheme}
                      onPlayer={spectating ? undefined : id=>{setSelectedPeer(id);if(compact)openDetail('team');}}
                      onTile={(x, y) => {
                        if (!prefs.tapMove||settingsOpen||cityOpen||farmOpen||!latest.current.active || spectating || lifeOpen || me.life?.indoors || me.life?.work) return;
                        const tile=y*WIDTH+x;
                        if(Math.abs(me.x-x)+Math.abs(me.y-y)<=2 && (world.tiles[tile]==='water'||natureAt(world,tile)&&resourceReady(world,tile))){destination.current=null;if(compact)quickGather(tile);else{setLifeTarget(tile);setLifeOpen(true);}return;}
                        const route=findWalkingRoute(world,me.x,me.y,x,y);
                        walkingRoute.current=route;
                        destination.current=route.at(-1)||null;
                      }}
                    />
                  )}
                  {!spectating && active && !world.ended && !heroOpen && me.life?.indoors && <HomeRoom onEncounter={openResident} musicActive={active&&!interactionBlocked&&!me.nativeScene} onBuilder={()=>setHeroOpen(true)} onMemory={updateMemory} world={world} selfId={selfId} languageMode={languageMode} send={a=>{destination.current=null;room.current?.send(a);}}/>}
                  {!spectating && (lifeOpen||!compact&&!!me.life?.work) && !(compact&&me.life?.work) && !me.life?.indoors && <LifePanel musicActive={active&&!interactionBlocked&&!me.nativeScene} initialTab={lifeInitialTab} world={world} selfId={selfId} target={lifeTarget} languageMode={languageMode} onEnergyRequest={requestEnergy} send={a=>{destination.current=null;room.current?.send(a);}} onCity={()=>{setLifeOpen(false);setCityOpen(true);}} onClose={()=>{setLifeOpen(false);setLifeInitialTab(undefined);}} onTrack={(x,y)=>{const route=findWalkingRoute(world,me.x,me.y,x,y);walkingRoute.current=route;destination.current=route.at(-1)||null;setLifeOpen(false);}}/>}
                  <button className="rpg-settings-map-button" aria-label={trans("RPG設定",languageMode)} onClick={()=>setSettingsOpen(true)}>⚙</button>
                  {compact&&<button className="rpg-compact-message" onClick={()=>openDetail('menu')} aria-label="メッセージの詳細"><span>{watched?.message}</span><MoreHorizontal size={15}/></button>}
                  <button className="rpg-view-switch" aria-label="2D / 3D" onClick={()=>{room.current?.send({type:'voxel-snap'});updateRpgPreferences({mapView:prefs.mapView==='3D'?'2D':'3D'});}}>{prefs.mapView==='3D'?'3D':'2D'}</button>
                  <div className="rpg-map-tools">
                    {!spectating&&<button onClick={()=>{setDetail(null);setLifeOpen(false);setFarmOpen(true);}}>🌱 {trans("農園・牧場",languageMode)}</button>}
                    {world.city&&!spectating&&<button onClick={()=>setCityOpen(true)}>🏙 {trans('都市運営',languageMode)}</button>}
                    {!spectating && <button onClick={openLife}>🪓 {me.life?.indoors?'家とミニゲーム':'採取・クラフト'}</button>}
                    <button onClick={() => setOverview(!overview)}>
                      <Map size={16} />
                      {overview ? "自分の近く" : "全体マップ"}
                    </button>
                    <span>{biomeAt(watched?.x??me.x,watched?.y??me.y).name}</span>
                  </div>
                  {!spectating && <div className="rpg-map-bottom">
                    <div className="rpg-movement-controls">{prefs.mapView==='3D'&&!overview&&<div className="rpg-turn-controls"><button aria-label="↶" disabled={!latest.current.active} onClick={()=>turn(facing-1)}>↶</button><span>{["N","E","S","W"][Math.round(facing)%4]}</span><button aria-label="↷" disabled={!latest.current.active} onClick={()=>turn(facing+1)}>↷</button></div>}<span className="rpg-desktop-hint">WASD / 矢印キーで移動 · E 調べる</span><TouchPad disabled={!!residentTarget||settingsOpen||cityOpen||farmOpen||!active||interactionBlocked||!!fishing.result||!!detail||lifeOpen||!!me.life?.indoors||!!me.life?.work||!!storySiteId||!!roamingNpcSiteId||hasActivityDialog} onMove={move} languageMode={languageMode}/></div>
                    <div className="rpg-map-actions">
                    {!spectating&&!me.life?.indoors&&nearbyResidents(world,me).length>0&&<div className="rpg-resident-quick" aria-label={trans('近くの住人',languageMode)}>{nearbyResidents(world,me).map(r=><button key={r.id} disabled={!latest.current.active} onClick={()=>openResident(r.id)}><img src={assetUrl(r.portrait)} alt=""/><span>{copy(r.name,languageMode)}<small>{trans('話しかける',languageMode)}</small></span></button>)}</div>}
                    {!spectating&&<FarmQuickActions world={world} selfId={selfId} languageMode={languageMode} disabled={!latest.current.active} send={a=>{destination.current=null;walkingRoute.current=[];room.current?.send(a);}} onOpen={()=>{setDetail(null);setLifeOpen(false);setFarmOpen(true);}}/>}

                    {!spectating&&!me.life?.indoors&&nearbyFlowers(world,me).length>0&&<div className="rpg-flower-quick" aria-label={trans('近くの花',languageMode)}>{nearbyFlowers(world,me).slice(0,3).map(({tile,flower})=><button key={tile} disabled={!quickReady||!active||interactionBlocked||!!me.life?.work||lifeOpen||!!detail||!!storySiteId||!!roamingNpcSiteId||hasActivityDialog||energyOf(me.life)<1} onClick={()=>room.current?.send({type:'town-flower-pick',tile})} aria-label={copy(flower.name,languageMode)+' '+trans('花を摘む',languageMode)}><FlowerSprite id={flower.id}/><span>{trans('花を摘む',languageMode)}<small> −1</small></span></button>)}</div>}
                    {!spectating&&!me.life?.indoors&&!detail&&!lifeOpen&&!farmOpen&&!cityOpen&&<VoxelRoomPanel active={active&&!interactionBlocked} world={world} selfId={selfId} facing={prefs.mapView==='3D'?facing:lastDirection.current.dx===1?1:lastDirection.current.dx===-1?3:lastDirection.current.dy===1?2:0} languageMode={languageMode} send={a=>room.current?.send(a)}/>}
                    {!spectating&&!me.life?.indoors&&me.life?.hoe&&<button className="rpg-till-quick" disabled={!active||interactionBlocked||!!detail||lifeOpen||!!me.life?.work} onClick={()=>{if(energyOf(me.life)<1){requestEnergy();return;}const d=prefs.mapView==='3D'?relativeMove(0,-1,facing):lastDirection.current;const step=Math.abs(d.dx)>Math.abs(d.dy)?{dx:Math.sign(d.dx),dy:0}:{dx:0,dy:Math.sign(d.dy)};room.current?.send({type:'farm-till',...step});}}>🌱 {trans('耕す',languageMode)} −1</button>}
                    {compact&&quickTiles.length>0&&<div className="rpg-quick-resources" role="group" aria-label="近くの採取"><button className="rpg-energy-button" disabled={!onEnergyRequest||!active||interactionBlocked||!!me.life?.work||lifeOpen||!!detail||!!storySiteId||!!roamingNpcSiteId||hasActivityDialog} onClick={requestEnergy}><Zap size={14}/><b>{energyOf(me.life)}/{GATHER_ENERGY_MAX}</b><span>問題で回復</span></button><div>{quickTiles.map(tile=>{const fish=world.tiles[tile]==='water',node=natureAt(world,tile),label=fish?'川釣り':node!.name;return <button key={tile} disabled={!quickReady||!active||interactionBlocked||!!me.life?.work||lifeOpen||!!detail||!!storySiteId||!!roamingNpcSiteId||hasActivityDialog} aria-label={label} title={label} onClick={()=>quickGather(tile)}>{fish?<FishingFrame index={0}/>:<LifeSprite index={node!.sprite}/>}<span>{fish?'釣り':node!.rock?'採掘':'採取'}</span><small>−1</small></button>;})}</div></div>}
                    {near && (
                      <button className="rpg-interact" onClick={interact}>
                        <span>
                          <strong>{displaySiteName(near)}</strong>
                          <small>
                            {siteUnavailable(world, me, near) || "E 調べる"}
                          </small>
                        </span>
                      </button>
                    )}
                    </div>
                  </div>}
                </div>
                {compact&&<nav className="rpg-compact-dock" aria-label="冒険メニュー">
                  {!spectating&&<button disabled={!active||interactionBlocked} onClick={openLife}><Axe size={19}/><span>採取</span></button>}
                  {!spectating&&<button className="rpg-farm-dock" aria-label={trans('農園・牧場・ペット',languageMode)} aria-haspopup="dialog" disabled={!active||interactionBlocked} onClick={()=>{setDetail(null);setLifeOpen(false);setFarmOpen(true);}}><span aria-hidden="true" style={{fontSize:19}}>🌱</span><span>{trans('農園',languageMode)}</span></button>}
                  <button aria-pressed={overview} onClick={()=>setOverview(!overview)}><Map size={19}/><span>{overview?'近く':'全体'}</span></button>
                  <button aria-haspopup="dialog" onClick={()=>openDetail('team')}><Users size={19}/><span>仲間</span></button>
                  <button aria-haspopup="dialog" onClick={()=>openDetail('event')}><Sparkles size={19}/><span>イベント</span><small>{world.activities.event.progress}/{world.activities.event.target}</small></button>
                  {!spectating&&<button aria-haspopup="dialog" onClick={()=>openDetail('journal')}><BookOpen size={19}/><span>手帳</span></button>}
                  <button aria-haspopup="dialog" onClick={()=>openDetail('menu')}><MoreHorizontal size={19}/><span>詳細</span></button>
                </nav>}
                <div className="rpg-map-caption">
                  {spectating ? '8秒ごとにランダム切替' : 'WASD / 矢印キーで移動 · E 調べる · マップをタップして移動'}
                </div>
              </section>
              {!spectating && storySiteId && active && world.sites.some(s=>s.id===storySiteId && distance(s,me)<=2) && <StoryDialog languageMode={languageMode} site={world.sites.find(s=>s.id===storySiteId)!} player={me} send={action=>room.current?.send(action)} onClose={()=>setStorySiteId(null)} />}
              {!spectating && roamingNpcSiteId && active && world.sites.some(s=>s.id===roamingNpcSiteId && s.kind==='npc' && distance(s,me)<=2) && <RoamingNpcDialog languageMode={languageMode} site={world.sites.find(s=>s.id===roamingNpcSiteId)!} player={me} pending={npcChoicePending} blockedReason={siteUnavailable(world,me,world.sites.find(s=>s.id===roamingNpcSiteId)!)} onChoose={choiceId=>{setNpcChoicePending(true);room.current?.send({type:'npc-event-choice',siteId:roamingNpcSiteId,choiceId});}} onClose={()=>{setRoamingNpcSiteId(null);setNpcChoicePending(false);}} />}
              <aside ref={detailRef} className={`rpg-sidebar ${compact?'rpg-detail-sheet':''}`} hidden={compact&&!detail} data-detail={detail||undefined} role={compact&&detail?'dialog':undefined} aria-modal={compact&&detail?true:undefined} aria-label={compact&&detail?'冒険の詳細':undefined} onKeyDown={detailKeyDown}>
            {compact&&detail&&<><header className="rpg-detail-heading"><h2>{detailKeys.find(([id])=>id===detail)?.[1]}</h2><button className="rpg-detail-close" aria-label="マップに戻る" onClick={()=>setDetail(null)}><X size={20}/><span>マップに戻る</span></button></header><nav className="rpg-detail-tabs" aria-label="詳細の切り替え">{detailKeys.filter(([id])=>!spectating||!['journal'].includes(id)).map(([id,label])=><button key={id} aria-pressed={detail===id} onClick={()=>setDetail(id)}>{label}</button>)}</nav></>}
                <div className="rpg-sidebar-content">{!spectating&&(!compact||detail==='town')&&<TownPanel onEncounter={openResident} onTrack={id=>{const pos=residentPosition(world,id);setDetail(null);walkingRoute.current=findWalkingRoute(world,me.x,me.y,pos.x,pos.y);destination.current=walkingRoute.current.at(-1)||null;}} world={world} selfId={selfId} languageMode={languageMode} send={a=>room.current?.send(a)}/>}{!spectating&&<SocialPanel languageMode={languageMode} world={world} selfId={selfId} send={a=>room.current?.send(a)} onBuilder={()=>setHeroOpen(true)} onMemory={updateMemory}/>}<p role="alert">{socialError}</p>
                {!spectating && <div data-rpg-panel="journal"><StoryJournal world={world} languageMode={languageMode} player={me} onTrack={(x,y)=>{const route=findWalkingRoute(world,me.x,me.y,x,y);walkingRoute.current=route;destination.current=route.at(-1)||null;setStorySiteId(null);if(compact)setDetail(null);}} /></div>}
                <ActivitiesPanel display="cards" languageMode={languageMode} world={world} selfId={selfId} selectedPeer={selectedPeer} send={action => { destination.current = null; room.current?.send(action); }} />
                <section data-rpg-panel="goal" className="rpg-objective">
                  <h2>
                    <Crown />
                    魔王城へ
                  </h2>
                  <p>6地域の試験官を倒し、三段階に変身する魔王に挑もう。</p>
                  {world.sites
                    .filter((s) => s.kind === "guardian" || s.kind === "boss")
                    .map((s) => (
                      <p key={s.id}>
                        {s.name}：
                        {s.cleared
                          ? "討伐済み"
                          : s.nativeInitialized
                            ? `${s.hp} / ${s.maxHp}`
                            : "未挑戦"}
                      </p>
                    ))}
                </section>
                {!spectating && <><section data-rpg-panel="player" className="rpg-player-panel">
                  <h2>{me.name}</h2>
                  <p>
                    HP {player.currentHp} / {player.maxHp}
                  </p>
                  <p>
                    コイン {player.gold} · デッキ {player.deck.length}
                  </p>
                  <p>
                    町・休憩所・？イベントは、各場所で戦闘3勝につき1回利用できます。
                  </p>
                  <p>宝箱は各プレイヤーにつき1回です。</p>
                </section>
                <section data-rpg-panel="team" className="rpg-player-panel"><button onClick={()=>openDetail('social')}>主人公と交流</button>
                  <h2>
                    <Users />
                    チーム
                  </h2>
                  <button
                    className={`rpg-team-action ${
                      me.team
                        ? "rpg-team-action--leave"
                        : "rpg-team-action--publish"
                    }`}
                    onClick={() =>
                      room.current?.send({
                        type: "team",
                        target: me.team ? null : selfId,
                      })
                    }
                  >
                    {me.team ? "チームを離れる" : "チームを公開する"}
                  </button>
                  <p>近くのチームメンバー1人につき、戦闘開始時の攻撃力+2。</p>
                  <div className="rpg-team-member-list">
                    {members
                      .filter((p) => p.id !== selfId)
                      .map((p) => (
                        <div className="rpg-team-member-row" key={p.id}>
                          <span>
                            {p.name}
                            {p.nativeScene ? " · 探索中" : ""}
                          </span>
                          {p.team && p.team !== me.team && (
                            <button
                              className="rpg-team-join-button"
                              onClick={() =>
                                room.current?.send({ type: "team", target: p.id })
                              }
                            >
                              参加
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </section>
                </>}
                {compact&&spectating&&<section data-rpg-panel="player" className="rpg-player-panel"><h2>{watched?.name||'ホスト観戦'}</h2><p>HP {hudHp} / {hudMaxHp}</p><p>コイン {watched?.gold||0} · 戦闘勝利 {watched?.completedBattles||0}</p></section>}
                {compact&&spectating&&<section data-rpg-panel="team" className="rpg-player-panel"><button onClick={()=>openDetail('social')}>主人公と交流</button><h2>参加者とチーム</h2>{members.map(p=><p key={p.id}>{p.name} · HP {p.hp}/{p.maxHp}</p>)}</section>}
                {compact&&<section data-rpg-panel="menu" className="rpg-player-panel rpg-room-details"><h2>木漏れ日のフロンティア</h2><p>{world.gameMode==='BATTLE_ROYALE'?'バトルロイヤル':'協力'} · 戦闘勝利 {watched?.completedBattles||0}</p><p>{biomeAt(watched?.x??me.x,watched?.y??me.y).name}</p><h3>採取エネルギー</h3><p>{energyOf(watched?.life)} / {GATHER_ENERGY_MAX}</p>{!spectating&&<><p>採取1回で1消費、1問正解で2回復。時間では回復しません。</p><button className="rpg-outline" disabled={!onEnergyRequest} onClick={requestEnergy}>問題を解いて回復</button></>}<h3>メッセージ</h3><p>{watched?.message}</p><h3>操作</h3><p>マップをタップして移動。矢印ボタンは押し続けて移動できます。</p><p>施設の近くで「調べる」、素材の近くで「採取」を使いましょう。</p>{spectating&&<><p>8秒ごとにランダム切替</p><button className="rpg-outline" onClick={spectators.next}>次のプレイヤー</button></>}{roomCode?<><p>ROOM {roomCode}</p><button className="rpg-invite-button" onClick={copyInviteUrl}>{inviteCopied?'コピーしました':'招待URLをコピー'}</button></>:<p>ひとり用 · 通信なし</p>}{!roomCode&&<div className="rpg-save-controls"><h3>ワールドの保存</h3><p role="status">{saveStatus||'探索中は30秒ごとに自動保存します。'}</p><button className="rpg-outline" disabled={saving} onClick={()=>void persist()}>ワールドを保存する</button>{onTitle&&<button className="rpg-outline" disabled={saving} onClick={()=>void saveToTitle()}>保存してRPGタイトルへ</button>}</div>}<button className="rpg-outline" onClick={close}>学習ローグへ</button></section>}
                </div>
              </aside>
            </div>
            {compact&&!spectating&&active&&me.life?.work&&<GatherMiniModal key={`${me.life.work.target}:${me.life.work.tile}`} world={world} work={me.life.work} languageMode={languageMode} send={a=>room.current?.send(a)}/>}
            {!spectating&&active&&fishing.result&&!me.life?.work&&<FishingCatch catching={fishing.result} languageMode={languageMode} onContinue={continueFishing} onClose={fishing.close} onBook={()=>{fishing.close();setLifeInitialTab('fishbook');setLifeOpen(true);}}/>}
            {compact&&detail&&<div className="rpg-detail-backdrop" aria-hidden="true" onClick={()=>setDetail(null)}/>}
            {!spectating&&<ActivitiesPanel display="dialogs" languageMode={languageMode} world={world} selfId={selfId} selectedPeer={selectedPeer} send={action=>{destination.current=null;room.current?.send(action);}}/>}
            <footer className="rpg-footer">
              <p role="status">{watched?.message}</p>
              {roomCode ? (
                <div className="rpg-room-invite">
                  <span>ROOM {roomCode}</span>
                  <button
                    className="rpg-invite-button"
                    onClick={copyInviteUrl}
                    title="招待URLをコピー"
                  >
                    {inviteCopied ? <Check size={14} /> : <Copy size={14} />}
                    {inviteCopied ? "コピーしました" : "招待URLをコピー"}
                  </button>
                </div>
              ) : (
                <span>ひとり用 · 通信なし</span>
              )}
            </footer>
            {world.won && world.endReason==='clear' && !spectating && !me.nativeScene && (world.endingProgress?.[selfId]||0)<6 && <CampaignEnding world={world} selfId={selfId} languageMode={languageMode} send={a=>room.current?.send(a)}/>}
            {world.ended && !me.nativeScene && (
              <div className="rpg-overlay">
                <section className="rpg-dialog rpg-clear-dialog">
                  <h1>{world.endReason === "timeout" ? "時間切れ！" : "魔王を倒しました！"}</h1>
                  <p>{world.endReason === "timeout" ? "制限時間が終了しました。" : "みんなの冒険は大成功！"}</p>
                  <div className="rpg-ranking-grid">
                    {rankingDefinitions.map((ranking) => (
                      <section className="rpg-ranking-card" key={ranking.title}>
                        <h2>{ranking.title}</h2>
                        <ol>
                          {rankingRows(rankedMembers, ranking.score).map(
                            ({ player: rankedPlayer, score }, index) => (
                              <li key={rankedPlayer.id}>
                                <span className="rpg-ranking-rank">{index + 1}</span>
                                <span className="rpg-ranking-name">
                                  {rankedPlayer.name}
                                </span>
                                <strong>{score}</strong>
                              </li>
                            ),
                          )}
                        </ol>
                      </section>
                    ))}
                  </div>
                  {world.endReason==='clear'&&<button disabled={(world.campaignVersion===2&&(world.endingProgress?.[selfId]||0)<6)||clockNow<(world.rewardAt||0)||!Object.keys(world.rankingAwards).length||!!me.nativeScene} onClick={()=>{room.current?.send({type:'city-continue'});}}>{trans('街づくりを始める',languageMode)}</button>}
                  <button onClick={close}>学習ローグへ</button>
                </section>
              </div>
            )}
          </>
        )}
        {(error || sceneError) && (
          <div className="rpg-connection-error" role="alert">
            {error || sceneError}
            <button onClick={close}>学習ローグへ</button>
          </div>
        )}
      {residentTarget&&world&&active&&!spectating&&<ResidentScene world={world} selfId={selfId} target={residentTarget} languageMode={languageMode} send={a=>room.current?.send(a)} talkLine={talkLine} onClose={closeResident} onEvent={id=>{closeResident();setNpcChoicePending(false);setRoamingNpcSiteId(id);}}/>}
      </main>
    </TranslatedUiTree>
  );
}
